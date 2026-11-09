export function getExtension(filename = "") {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isValidRegisterNumber(value) {
  return /^\d{12}$/.test(value);
}

export function downloadCSV(filename, rows) {
  if (!rows.length) {
    alert("No data available.");
    return;
  }

  const headers = Object.keys(rows[0]);

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCSV(row[header])).join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
