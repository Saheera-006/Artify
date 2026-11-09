import { timestampToMillis } from "./dates.js";

export function getScore(submission) {
  if (typeof submission.finalScore === "number") {
    return submission.finalScore;
  }

  if (typeof submission.marks === "number") {
    return submission.marks;
  }

  if (typeof submission.aiScore === "number") {
    return submission.aiScore;
  }

  return null;
}

export function sortSubmissions(items, sortType) {
  return [...items].sort((a, b) => {
    const scoreA = getScore(a);

    const scoreB = getScore(b);

    const marksA = typeof scoreA === "number" ? scoreA : -Infinity;

    const marksB = typeof scoreB === "number" ? scoreB : -Infinity;

    const timeA =
      timestampToMillis(a.submittedAt) ||
      timestampToMillis(a.submittedAtClient);

    const timeB =
      timestampToMillis(b.submittedAt) ||
      timestampToMillis(b.submittedAtClient);

    if (sortType === "marks") {
      if (marksB !== marksA) {
        return marksB - marksA;
      }

      return timeA - timeB;
    }

    if (sortType === "earliest") {
      return timeA - timeB;
    }

    if (sortType === "latest") {
      return timeB - timeA;
    }

    if (sortType === "name") {
      return (a.name || "").localeCompare(b.name || "");
    }

    if (sortType === "department") {
      return (a.department || "").localeCompare(b.department || "");
    }

    return 0;
  });
}
