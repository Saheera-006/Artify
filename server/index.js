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

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is missing from server/.env");
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/* =========================================================
   ADMIN AUTH
========================================================= */

async function verifyAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Missing Firebase login token.",
      });
    }

    const token = header.slice(7);

    await getAuth().verifyIdToken(token);

    next();
  } catch (error) {
    console.error("Auth error:", error.message);

    res.status(401).json({
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
      name: String(item.name || "").trim(),

      maxScore: Number(item.maxScore),

      description: String(
        item.description || ""
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
      /*
       * Supports:
       *
       * "Restaurant Name"
       *
       * OR
       *
       * {
       *   title: "Restaurant Name",
       *   value: "Dino's Dine"
       * }
       */

      if (typeof item === "string") {
        return {
          title: item.trim(),
          value: "",
        };
      }

      return {
        title: String(
          item.title ||
          item.name ||
          ""
        ).trim(),

        value: String(
          item.value ||
          item.description ||
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
  if (!url) return false;

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

  /*
   * PDF:
   *
   * /upload/...
   *
   * becomes
   *
   * /upload/f_jpg/...
   */

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

  /*
   * Normal image
   */

  return fileUrl;
}

/* =========================================================
   DOWNLOAD IMAGE AND CONVERT TO BASE64
========================================================= */

async function fetchImageAsBase64(url) {
  console.log(
    "Downloading evaluation file:",
    url
  );

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Unable to download submission file (${response.status}).`
    );
  }

  const contentType = (
    response.headers.get("content-type") || ""
  )
    .split(";")[0]
    .toLowerCase();

  if (!contentType.startsWith("image/")) {
    throw new Error(
      `Evaluation file is not an image. Received: ${contentType}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  if (buffer.length > 15 * 1024 * 1024) {
    throw new Error(
      "Submission file is too large for this AI endpoint."
    );
  }

  return {
    data: buffer.toString("base64"),
    mimeType: contentType,
  };
}

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
  });
});

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
         VALIDATION
      --------------------------------------------------- */

      if (!fileUrl || !round) {
        return res.status(400).json({
          error:
            "fileUrl and round are required.",
        });
      }

      /* ---------------------------------------------------
         CLEAN CRITERIA
      --------------------------------------------------- */

      const criteria = cleanCriteria(
        round.criteria
      );

      /* ---------------------------------------------------
         CLEAN ROUND REQUIREMENTS
      --------------------------------------------------- */

      const requirements =
        cleanRequirements(
          round.requirements
        );

      /* ---------------------------------------------------
         LOG ROUND INFORMATION
      --------------------------------------------------- */

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
         PDF → JPG
      --------------------------------------------------- */

      const evaluationUrl =
        getEvaluationUrl(fileUrl);

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
      } = await fetchImageAsBase64(
        evaluationUrl
      );

      console.log(
        "Downloaded MIME type:",
        mimeType
      );

      /* ---------------------------------------------------
         CREATE CRITERIA TEXT
      --------------------------------------------------- */

      const criteriaText = criteria
        .map(
          (item, index) =>
            `${index + 1}. ${item.name} — maximum ${item.maxScore} points. ${item.description}`
        )
        .join("\n");

      /* ---------------------------------------------------
         CREATE REQUIREMENTS TEXT
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
        `You are a strict and objective design competition evaluator.\n\n` +

        `Evaluate the submitted ${
          designType === "ui"
            ? "UI design"
            : "poster design"
        } ONLY using the supplied information for THIS round.\n\n` +

        `ROUND NAME:\n${
          round.name || "Not supplied"
        }\n\n` +

        `THEME:\n${
          round.theme || "Not supplied"
        }\n\n` +

        `PROBLEM STATEMENT:\n${
          round.problemStatement ||
          "Not supplied"
        }\n\n` +

        `GUIDELINES:\n${
          Array.isArray(round.guidelines) &&
          round.guidelines.length
            ? round.guidelines.join("\n")
            : "None supplied"
        }\n\n` +

        `ROUND-SPECIFIC REQUIREMENTS:\n${requirementsText}\n\n` +

        `SCORING CRITERIA:\n${criteriaText}\n\n` +

        `STRICT EVALUATION RULES:\n` +

        `- Judge only what is visibly present in the submitted design.\n` +

        `- Do not invent hidden functionality, research, intent, effort or content.\n` +

        `- Do not use personal taste as a reason for scoring.\n` +

        `- Do not reward or penalize anything outside the supplied scoring criteria.\n` +

        `- Give a specific and observable reason for every score.\n` +

        `- Do not automatically give high scores.\n` +

        `- Use the full scoring range when justified by the visible evidence.\n` +

        `- Each score must be between 0 and its criterion maximum.\n` +

        `- totalScore must equal the exact sum of all criterion scores.\n` +

        `- Be consistent: weak visible evidence should receive a lower score.\n\n` +

        `REQUIREMENTS CRITERION RULES:\n` +

        `- If one of the scoring criteria is named "Requirements", evaluate that criterion ONLY using the ROUND-SPECIFIC REQUIREMENTS listed above.\n` +

        `- Check every supplied round requirement individually.\n` +

        `- Verify whether each requirement is visibly present in the submitted design.\n` +

        `- If a requirement has a specified value, verify the visible content against that value.\n` +

        `- Missing requirements must reduce the Requirements score.\n` +

        `- Incorrect or clearly different required information must reduce the Requirements score.\n` +

        `- Partially visible or unclear requirements should receive only partial credit where appropriate.\n` +

        `- Do not assume that something exists if it cannot be seen.\n` +

        `- Do not invent text, labels, features, information or content.\n` +

        `- Do not use requirements from any other round.\n` +

        `- The Requirements score must reflect the overall percentage of supplied requirements that are actually satisfied.\n` +

        `- If all requirements are clearly satisfied, the Requirements criterion should receive close to its maximum score.\n` +

        `- If many requirements are missing, the Requirements criterion should receive a correspondingly low score.\n\n` +

        `IMPORTANT:\n` +

        `The Requirements criterion is part of the 100-mark scoring system. It is NOT an additional score outside the total.\n` +

        `Return JSON only. No markdown.`;

      /* ---------------------------------------------------
         GEMINI REQUEST
      --------------------------------------------------- */

      const response =
        await ai.models.generateContent({
          model:
            process.env.GEMINI_MODEL ||
            "gemini-3.6-flash",

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
         PARSE AI RESPONSE
      --------------------------------------------------- */

      const evaluation = JSON.parse(
        response.text
      );

      /* ---------------------------------------------------
         VALIDATE CRITERION COUNT
      --------------------------------------------------- */

      if (
        !Array.isArray(
          evaluation.criteria
        ) ||
        evaluation.criteria.length !==
          criteria.length
      ) {
        throw new Error(
          "Gemini returned an invalid criterion count."
        );
      }

      /* ---------------------------------------------------
         NORMALIZE SCORES
      --------------------------------------------------- */

      const normalized = criteria.map(
        (criterion, index) => {
          const result =
            evaluation.criteria[index];

          const score = Number(
            result.score
          );

          if (
            !Number.isFinite(score) ||
            score < 0 ||
            score > criterion.maxScore
          ) {
            throw new Error(
              `Invalid AI score for ${criterion.name}.`
            );
          }

          return {
            name: criterion.name,

            maxScore:
              criterion.maxScore,

            score,

            reason: String(
              result.reason ||
                "No reason provided."
            ).trim(),
          };
        }
      );

      /* ---------------------------------------------------
         CALCULATE TOTAL SCORE SERVER-SIDE
      --------------------------------------------------- */

      const totalScore =
        normalized.reduce(
          (sum, item) =>
            sum + item.score,
          0
        );

      const maxTotal =
        criteria.reduce(
          (sum, item) =>
            sum + item.maxScore,
          0
        );

      /* ---------------------------------------------------
         REQUIRE 100 TOTAL
      --------------------------------------------------- */

      if (maxTotal !== 100) {
        throw new Error(
          "AI criteria maximum must total exactly 100."
        );
      }

      /* ---------------------------------------------------
         FIND REQUIREMENTS CRITERION
      --------------------------------------------------- */

      const requirementsCriterion =
        normalized.find(
          (item) =>
            item.name
              .toLowerCase()
              .trim() ===
            "requirements"
        );

      /* ---------------------------------------------------
         LOG REQUIREMENTS SCORE
      --------------------------------------------------- */

      if (requirementsCriterion) {
        console.log(
          `Requirements score: ${requirementsCriterion.score}/${requirementsCriterion.maxScore}`
        );
      } else {
        console.warn(
          "WARNING: No 'Requirements' criterion found in this round."
        );
      }

      /* ---------------------------------------------------
         FINAL RESPONSE
      --------------------------------------------------- */

      res.json({
        evaluation: {
          criteria: normalized,

          rawTotalScore:
            totalScore,

          maxTotalScore:
            maxTotal,

          totalScore,

          summary: String(
            evaluation.summary || ""
          ).trim(),
        },

        sourceType: isPdfUrl(fileUrl)
          ? "pdf-converted-to-jpg"
          : "image",

        evaluationUrl,
      });
    } catch (error) {
      console.error(
        "Evaluation error:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "AI evaluation failed.",
      });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

const port = Number(
  process.env.PORT || 5000
);

app.listen(port, () => {
  console.log(
    `ARTIFY AI server running on http://localhost:${port}`
  );
});