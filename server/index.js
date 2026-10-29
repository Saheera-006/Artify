import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

/* =========================================================
   ENVIRONMENT CHECK
========================================================= */

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is missing from server/.env");
}

/* =========================================================
   FIREBASE ADMIN
========================================================= */

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

/* =========================================================
   GEMINI CLIENT
========================================================= */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,

  httpOptions: {
    timeout: 120000,
  },
});

/* =========================================================
   GEMINI MODEL FALLBACK LIST
========================================================= */

const GEMINI_MODELS = [
  ...new Set([
    process.env.GEMINI_MODEL || "gemini-3.8-flash",

    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ]),
];

console.log("Gemini models:");
console.log(GEMINI_MODELS);

/* =========================================================
   GET ERROR STATUS
========================================================= */

function getGeminiErrorStatus(error) {
  const possibleStatuses = [
    error?.status,
    error?.statusCode,
    error?.code,
    error?.response?.status,
  ];

  for (const value of possibleStatuses) {
    const numberValue = Number(value);

    if (
      Number.isFinite(numberValue) &&
      numberValue >= 100 &&
      numberValue <= 599
    ) {
      return numberValue;
    }
  }

  return 0;
}

/* =========================================================
   DETECT RETRYABLE ERRORS
========================================================= */

function isRetryableGeminiError(error) {
  const status = getGeminiErrorStatus(error);

  const retryableStatuses = [
    408,
    429,
    500,
    502,
    503,
    504,
  ];

  if (retryableStatuses.includes(status)) {
    return true;
  }

  const message = String(
    error?.message || error || ""
  ).toLowerCase();

  const retryableMessages = [
    "fetch failed",
    "headers timeout",
    "headers timeout error",
    "timeout",
    "timed out",
    "socket timeout",
    "network error",
    "econnreset",
    "econnrefused",
    "etimedout",
    "und_err_headers_timeout",
    "temporarily unavailable",
    "high demand",
    "deadline exceeded",
    "service unavailable",
  ];

  return retryableMessages.some((text) =>
    message.includes(text)
  );
}

/* =========================================================
   WAIT
========================================================= */

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* =========================================================
   GEMINI REQUEST WITH RETRY + MODEL FALLBACK
========================================================= */

async function generateWithRetry(request) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    console.log("");
    console.log("==========================================");
    console.log("Trying Gemini model:", model);
    console.log("==========================================");

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Gemini attempt ${attempt}/3 using ${model}`
        );

        const response = await ai.models.generateContent({
          ...request,

          model,
        });

        console.log(
          `Gemini ${model} succeeded on attempt ${attempt}`
        );

        return response;
      } catch (error) {
        lastError = error;

        const status = getGeminiErrorStatus(error);
        const message = String(
          error?.message || error || "Unknown error"
        );

        console.error(
          `Gemini ${model} attempt ${attempt} failed`
        );

        console.error(
          "Status:",
          status || "unknown"
        );

        console.error(
          "Error:",
          message
        );

        const retryable =
          isRetryableGeminiError(error);

        if (!retryable) {
          console.error(
            `Error is not retryable. Moving to next model.`
          );

          break;
        }

        if (attempt < 3) {
          const baseDelay =
            3000 * Math.pow(2, attempt - 1);

          const jitter =
            Math.floor(Math.random() * 2000);

          const delay =
            Math.min(
              baseDelay + jitter,
              15000
            );

          console.log(
            `Retrying ${model} in ${Math.round(
              delay / 1000
            )} seconds...`
          );

          await sleep(delay);
        } else {
          console.log(
            `${model} failed after 3 attempts.`
          );
        }
      }
    }

    console.log(
      `Moving to next Gemini model...`
    );
  }

  throw lastError || new Error(
    "All Gemini models failed."
  );
}

/* =========================================================
   ADMIN AUTH
========================================================= */

async function verifyAdmin(req, res, next) {
  try {
    const header =
      req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing Firebase login token.",
      });
    }

    const token = header.slice(7);

    await getAuth().verifyIdToken(token);

    next();
  } catch (error) {
    console.error(
      "Auth error:",
      error?.message || error
    );

    return res.status(401).json({
      error: "Invalid or expired admin session.",
    });
  }
}

/* =========================================================
   CLEAN AI CRITERIA
========================================================= */

function cleanCriteria(criteria) {
  if (!Array.isArray(criteria) || !criteria.length) {
    throw new Error(
      "This round has no AI evaluation criteria."
    );
  }

  return criteria
    .map((item) => ({
      name: String(
        item?.name || ""
      ).trim(),

      maxScore: Number(
        item?.maxScore
      ),

      description: String(
        item?.description || ""
      ).trim(),
    }))
    .filter(
      (item) =>
        item.name &&
        Number.isFinite(item.maxScore) &&
        item.maxScore > 0
    );
}

/* =========================================================
   CLEAN ROUND REQUIREMENTS
========================================================= */

function cleanRequirements(requirements) {
  if (!Array.isArray(requirements)) {
    return [];
  }

  return requirements
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: item.trim(),
          value: "",
        };
      }

      return {
        title: String(
          item?.title ||
          item?.name ||
          ""
        ).trim(),

        value: String(
          item?.value ||
          item?.description ||
          ""
        ).trim(),
      };
    })
    .filter(
      (item) => item.title
    );
}

/* =========================================================
   DETECT PDF
========================================================= */

function isPdfUrl(url) {
  if (!url) {
    return false;
  }

  const cleanUrl = String(url)
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  return (
    cleanUrl.endsWith(".pdf") ||
    cleanUrl.includes(".pdf/")
  );
}

/* =========================================================
   CREATE JPG URL FOR CLOUDINARY PDF
========================================================= */

function getEvaluationUrl(fileUrl) {
  if (!fileUrl) {
    throw new Error(
      "Submission file URL is missing."
    );
  }

  if (isPdfUrl(fileUrl)) {
    if (fileUrl.includes("/upload/")) {
      return fileUrl.replace(
        "/upload/",
        "/upload/f_jpg/"
      );
    }

    throw new Error(
      "PDF URL is not a valid Cloudinary delivery URL."
    );
  }

  return fileUrl;
}

/* =========================================================
   DOWNLOAD IMAGE
========================================================= */

async function fetchImageAsBase64(url) {
  console.log(
    "Downloading evaluation file:"
  );

  console.log(url);

  const controller =
    new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 60000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Unable to download submission file (${response.status}).`
      );
    }

    const contentType = (
      response.headers.get(
        "content-type"
      ) || ""
    )
      .split(";")[0]
      .toLowerCase();

    console.log(
      "Downloaded content type:",
      contentType
    );

    if (!contentType.startsWith("image/")) {
      throw new Error(
        `Evaluation file is not an image. Received: ${contentType}`
      );
    }

    const buffer = Buffer.from(
      await response.arrayBuffer()
    );

    console.log(
      "Downloaded file size:",
      Math.round(
        buffer.length / 1024
      ),
      "KB"
    );

    if (
      buffer.length >
      15 * 1024 * 1024
    ) {
      throw new Error(
        "Submission file is too large for this AI endpoint."
      );
    }

    return {
      data: buffer.toString("base64"),
      mimeType: contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (_req, res) => {
    res.json({
      ok: true,
      service: "ARTIFY AI Server",
    });
  }
);

/* =========================================================
   AI DESIGN EVALUATION
========================================================= */

app.post(
  "/api/evaluate-design",
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        fileUrl,
        designType,
        round,
      } = req.body;

      /* ---------------------------------------------------
         BASIC VALIDATION
      --------------------------------------------------- */

      if (!fileUrl || !round) {
        return res.status(400).json({
          error:
            "fileUrl and round are required.",
        });
      }

      const criteria =
        cleanCriteria(
          round.criteria
        );

      const requirements =
        cleanRequirements(
          round.requirements
        );

      if (!criteria.length) {
        return res.status(400).json({
          error:
            "No valid evaluation criteria were supplied.",
        });
      }

      const maxTotal =
        criteria.reduce(
          (sum, item) =>
            sum + item.maxScore,
          0
        );

      if (maxTotal !== 100) {
        return res.status(400).json({
          error:
            `AI criteria maximum must total exactly 100. Current total: ${maxTotal}.`,
        });
      }

      /* ---------------------------------------------------
         LOG INFORMATION
      --------------------------------------------------- */

      console.log("");
      console.log(
        "=========================================="
      );

      console.log(
        "AI EVALUATION STARTED"
      );

      console.log(
        "Round:",
        round.name
      );

      console.log(
        "Design Type:",
        designType
      );

      console.log(
        "Requirements:",
        requirements
      );

      console.log(
        "Criteria:",
        criteria
      );

      console.log(
        "=========================================="
      );

      /* ---------------------------------------------------
         GET IMAGE URL
      --------------------------------------------------- */

      const evaluationUrl =
        getEvaluationUrl(
          fileUrl
        );

      console.log(
        "Original submission URL:",
        fileUrl
      );

      console.log(
        "AI evaluation URL:",
        evaluationUrl
      );

      /* ---------------------------------------------------
         DOWNLOAD IMAGE
      --------------------------------------------------- */

      const {
        data,
        mimeType,
      } =
        await fetchImageAsBase64(
          evaluationUrl
        );

      console.log(
        "Image successfully downloaded."
      );

      console.log(
        "MIME type:",
        mimeType
      );

      /* ---------------------------------------------------
         BUILD CRITERIA TEXT
      --------------------------------------------------- */

      const criteriaText =
        criteria
          .map(
            (item, index) =>
              `${index + 1}. ${item.name} — maximum ${item.maxScore} points. ${item.description}`
          )
          .join("\n");

      /* ---------------------------------------------------
         BUILD REQUIREMENTS TEXT
      --------------------------------------------------- */

      const requirementsText =
        requirements.length
          ? requirements
              .map(
                (item, index) =>
                  `${index + 1}. ${item.title}${
                    item.value
                      ? ` — ${item.value}`
                      : ""
                  }`
              )
              .join("\n")
          : "No additional round requirements supplied.";

      /* ---------------------------------------------------
         AI PROMPT
      --------------------------------------------------- */

      const prompt =
        `You are a strict and objective design competition evaluator.

Evaluate the submitted ${
          designType === "ui"
            ? "UI design"
            : "poster design"
        } ONLY using the supplied information for THIS round.

ROUND NAME:
${
  round.name ||
  "Not supplied"
}

THEME:
${
  round.theme ||
  "Not supplied"
}

PROBLEM STATEMENT:
${
  round.problemStatement ||
  "Not supplied"
}

GUIDELINES:
${
  Array.isArray(
    round.guidelines
  ) &&
  round.guidelines.length
    ? round.guidelines.join("\n")
    : "None supplied"
}

ROUND-SPECIFIC REQUIREMENTS:
${requirementsText}

SCORING CRITERIA:
${criteriaText}

STRICT EVALUATION RULES:

- Judge only what is visibly present in the submitted design.
- Do not invent hidden functionality, research, intent, effort or content.
- Do not use personal taste as a reason for scoring.
- Do not reward or penalize anything outside the supplied scoring criteria.
- Give a specific and observable reason for every score.
- Do not automatically give high scores.
- Use the full scoring range when justified by visible evidence.
- Each score must be between 0 and its criterion maximum.
- totalScore must equal the exact sum of all criterion scores.
- Be consistent: weak visible evidence should receive a lower score.

REQUIREMENTS CRITERION RULES:

- If one of the scoring criteria is named "Requirements", evaluate that criterion ONLY using the ROUND-SPECIFIC REQUIREMENTS listed above.
- Check every supplied round requirement individually.
- Verify whether every requirement is visibly present in the submitted design.
- If a requirement has a specified value, verify the visible content against that exact value.
- Missing requirements must reduce the Requirements score.
- Incorrect required information must reduce the Requirements score.
- Partially visible or unclear requirements should receive partial credit where appropriate.
- Do not assume that something exists if it cannot be seen.
- Do not invent text, labels, features, information or content.
- Do not use requirements from any other round.
- The Requirements score must reflect the overall percentage of supplied requirements actually satisfied.
- If all requirements are clearly satisfied, the Requirements criterion should receive close to its maximum score.
- If many requirements are missing, the Requirements criterion should receive a correspondingly low score.

IMPORTANT:

The Requirements criterion is part of the 100-mark scoring system.

It is NOT an additional score outside the total.

Return JSON only.
No markdown.
No explanations outside JSON.`;

      console.log("");
      console.log(
        "Sending design to Gemini..."
      );

      /* ---------------------------------------------------
         GEMINI REQUEST
      --------------------------------------------------- */

      const response =
        await generateWithRetry({
          contents: [
            {
              role: "user",

              parts: [
                {
                  text: prompt,
                },

                {
                  inlineData: {
                    mimeType,
                    data,
                  },
                },
              ],
            },
          ],

          config: {
            responseMimeType:
              "application/json",

            responseSchema: {
              type: "object",

              properties: {
                criteria: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      name: {
                        type: "string",
                      },

                      maxScore: {
                        type: "number",
                      },

                      score: {
                        type: "number",
                      },

                      reason: {
                        type: "string",
                      },
                    },

                    required: [
                      "name",
                      "maxScore",
                      "score",
                      "reason",
                    ],
                  },
                },

                totalScore: {
                  type: "number",
                },

                summary: {
                  type: "string",
                },
              },

              required: [
                "criteria",
                "totalScore",
                "summary",
              ],
            },
          },
        });

      /* ---------------------------------------------------
         CHECK RESPONSE
      --------------------------------------------------- */

      if (!response?.text) {
        throw new Error(
          "Gemini returned an empty response."
        );
      }

      console.log(
        "Gemini response received."
      );

      console.log(
        "Parsing Gemini JSON..."
      );

      let evaluation;

      try {
        evaluation =
          JSON.parse(
            response.text
          );
      } catch (error) {
        console.error(
          "Gemini returned invalid JSON:"
        );

        console.error(
          response.text
        );

        throw new Error(
          "Gemini returned invalid JSON."
        );
      }

      /* ---------------------------------------------------
         VALIDATE CRITERIA COUNT
      --------------------------------------------------- */

      if (
        !Array.isArray(
          evaluation.criteria
        ) ||
        evaluation.criteria.length !==
          criteria.length
      ) {
        throw new Error(
          `Gemini returned ${evaluation.criteria?.length || 0} criteria, but ${criteria.length} were expected.`
        );
      }

      /* ---------------------------------------------------
         NORMALIZE SCORES
      --------------------------------------------------- */

      const normalized =
        criteria.map(
          (criterion, index) => {
            const result =
              evaluation.criteria[
                index
              ];

            const score =
              Number(
                result?.score
              );

            if (
              !Number.isFinite(
                score
              )
            ) {
              throw new Error(
                `Invalid AI score for ${criterion.name}.`
              );
            }

            if (
              score < 0 ||
              score >
                criterion.maxScore
            ) {
              throw new Error(
                `AI score for ${criterion.name} must be between 0 and ${criterion.maxScore}. Received: ${score}`
              );
            }

            return {
              name:
                criterion.name,

              maxScore:
                criterion.maxScore,

              score,

              reason:
                String(
                  result?.reason ||
                    "No reason provided."
                ).trim(),
            };
          }
        );

      /* ---------------------------------------------------
         SERVER CALCULATES FINAL SCORE
      --------------------------------------------------- */

      const totalScore =
        normalized.reduce(
          (sum, item) =>
            sum + item.score,
          0
        );

      /* ---------------------------------------------------
         REQUIREMENTS CRITERION LOG
      --------------------------------------------------- */

      const requirementsCriterion =
        normalized.find(
          (item) =>
            item.name
              .toLowerCase()
              .trim() ===
            "requirements"
        );

      if (
        requirementsCriterion
      ) {
        console.log(
          `Requirements score: ${requirementsCriterion.score}/${requirementsCriterion.maxScore}`
        );
      } else {
        console.warn(
          "WARNING: No 'Requirements' criterion found."
        );
      }

      /* ---------------------------------------------------
         FINAL LOG
      --------------------------------------------------- */

      console.log("");
      console.log(
        "=========================================="
      );

      console.log(
        "AI EVALUATION COMPLETED"
      );

      console.log(
        `Final score: ${totalScore}/${maxTotal}`
      );

      console.log(
        "=========================================="
      );

      /* ---------------------------------------------------
         RESPONSE
      --------------------------------------------------- */

      return res.json({
        evaluation: {
          criteria:
            normalized,

          rawTotalScore:
            totalScore,

          maxTotalScore:
            maxTotal,

          totalScore,

          summary:
            String(
              evaluation.summary ||
                ""
            ).trim(),
        },

        sourceType:
          isPdfUrl(fileUrl)
            ? "pdf-converted-to-jpg"
            : "image",

        evaluationUrl,
      });
    } catch (error) {
      console.error("");
      console.error(
        "=========================================="
      );

      console.error(
        "EVALUATION ERROR"
      );

      console.error(
        error
      );

      console.error(
        "=========================================="
      );

      const status =
        getGeminiErrorStatus(
          error
        );

      const httpStatus =
        status >= 400 &&
        status <= 599
          ? status
          : 500;

      const retryable =
        isRetryableGeminiError(
          error
        );

      return res
        .status(httpStatus)
        .json({
          error:
            error?.message ||
            "AI evaluation failed.",

          retryable,

          status:
            status || 500,
        });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

const port =
  Number(
    process.env.PORT || 5000
  );

app.listen(
  port,
  () => {
    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      `ARTIFY AI server running on http://localhost:${port}`
    );

    console.log(
      "Gemini timeout: 120 seconds"
    );

    console.log(
      "Gemini retry attempts: 3 per model"
    );

    console.log(
      "=========================================="
    );
  }
);
