import { DEFAULT_CRITERIA } from "../../config/constants.js";

export const emptyRoundForm = {
  name: "",
  theme: "",
  problemStatement: "",
  description: "",
  guidelines: "",
  creativeBrief: [],
  allowedDesignTypes: ["ui", "poster"],
  enabled: false,
  isFinalRound: false,
  criteria: DEFAULT_CRITERIA,
};
