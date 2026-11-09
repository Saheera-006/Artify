export function timestampToMillis(value) {
  if (!value) return 0;

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value.seconds) {
    return value.seconds * 1000;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
}

export function formatDateTime(value) {
  const millis = timestampToMillis(value);

  if (!millis) return "—";

  return new Date(millis).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(value) {
  const millis = timestampToMillis(value);

  if (!millis) return "—";

  return new Date(millis).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
