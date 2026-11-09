export function getRoundState(round) {
  if (!round) return "none";

  // Round availability is controlled only by the admin Enable/Disable switch.
  return round.enabled ? "active" : "disabled";
}

export function getRoundStateLabel(round) {
  const state = getRoundState(round);

  const labels = {
    active: "OPEN",
    upcoming: "UPCOMING",
    closed: "CLOSED",
    disabled: "DISABLED",
    none: "NO ROUND",
  };

  return labels[state] || "—";
}

export function makeRoundId(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now()
  );
}
