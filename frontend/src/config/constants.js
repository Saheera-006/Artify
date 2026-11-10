export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const DEFAULT_CRITERIA = [
  {
    name: "Creativity",
    maxScore: 20,
    description: "Originality and creative approach.",
  },
  {
    name: "Visual Design",
    maxScore: 20,
    description: "Layout, hierarchy, typography, color and visual consistency.",
  },
  {
    name: "Relevance",
    maxScore: 20,
    description:
      "How well the design addresses the round theme and problem statement.",
  },
  {
    name: "Content Quality",
    maxScore: 20,
    description: "Clarity, completeness and quality of visible content.",
  },
  {
    name: "Technical Quality",
    maxScore: 20,
    description: "Execution quality, readability and visible technical polish.",
  },
];

export const AI_API_URL =
  "https://artify-backend-83sy.onrender.com";
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];

export const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "pdf"];

export const DEPARTMENTS = [
  "CSE A",
  "CSE B",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
];

export const YEARS = ["I Year", "II Year", "III Year", "IV Year"];
