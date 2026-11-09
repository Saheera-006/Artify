import React, { useState } from "react";
import { getExtension } from "../../../utils/files.js";

export function PreviewModal({ submission, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);

  if (!submission) {
    return null;
  }

  const fileName = submission.fileName || "submission";
  const extension = getExtension(fileName);

  const isImage = /^(png|jpg|jpeg|webp|gif)$/i.test(extension);

  const isPdf = extension === "pdf";

  const totalPdfPages = Math.max(1, Number(submission.filePages || 1));

  /*
   * Cloudinary stores PDFs as image assets. Changing the delivery
   * extension from .pdf to .jpg asks Cloudinary to rasterize a page.
   * pg_<n> selects the requested page. This avoids depending on the
   * browser's PDF viewer and also works when direct PDF delivery is
   * blocked on a free Cloudinary account.
   */
  const getPdfPreviewUrl = (page = 1) => {
    if (!submission.fileUrl) return "";

    let url = submission.fileUrl;

    if (/\.pdf([?#].*)?$/i.test(url)) {
      url = url.replace(/\.pdf(?=([?#]|$))/i, ".jpg");
    } else {
      url = `${url}.jpg`;
    }

    if (url.includes("/image/upload/")) {
      url = url.replace("/image/upload/", `/image/upload/pg_${page}/`);
    }

    return url;
  };

  const downloadFile = async () => {
    if (!submission.fileUrl) {
      alert("File URL is not available.");
      return;
    }

    setDownloading(true);

    try {
      const cleanRegisterNumber = String(
        submission.registerNumber || "register-number",
      )
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, "");

      // For PDFs, use the exact Cloudinary-rendered JPG page used by the preview.
      // Open File and Download therefore behave like normal JPG files.
      let downloadUrl = isPdf ? getPdfPreviewUrl(pdfPage) : submission.fileUrl;

      if (!downloadUrl) {
        throw new Error("Download URL is not available.");
      }

      const extensionForDownload = isPdf ? "jpg" : extension || "png";
      const downloadName = `${
        cleanRegisterNumber || "file"
      }${isPdf ? `_page_${pdfPage}` : ""}.${extensionForDownload}`;

      // Fetch the rendered asset and create a local Blob URL so the browser
      // performs a real download instead of opening the Cloudinary URL.
      const response = await fetch(downloadUrl, {
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`Download failed (${response.status})`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadName;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error("DOWNLOAD ERROR:", error);
      alert(
        isPdf
          ? "PDF page download failed. Please try again."
          : "Unable to download the file. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="preview-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <div className="preview-header">
          <div>
            <span className="mini-label">SUBMISSION</span>

            <h3>{submission.name}</h3>

            <p>
              {submission.registerNumber} · {submission.designType}
            </p>
          </div>

          <div
            className="preview-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <a
              className="secondary-btn"
              href={isPdf ? getPdfPreviewUrl(pdfPage) : submission.fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open File ↗
            </a>

            <button
              className="primary-btn"
              type="button"
              onClick={downloadFile}
              disabled={downloading}
            >
              {downloading ? "Downloading..." : "↓ Download"}
            </button>
          </div>
        </div>

        {isPdf && totalPdfPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              className="secondary-btn"
              type="button"
              disabled={pdfPage <= 1}
              onClick={() => setPdfPage((page) => Math.max(1, page - 1))}
            >
              ← Previous
            </button>

            <span>
              Page {pdfPage} of {totalPdfPages}
            </span>

            <button
              className="secondary-btn"
              type="button"
              disabled={pdfPage >= totalPdfPages}
              onClick={() =>
                setPdfPage((page) => Math.min(totalPdfPages, page + 1))
              }
            >
              Next →
            </button>
          </div>
        )}

        <div
          className="preview-body"
          style={{
            width: "100%",
            height: "calc(100vh - 220px)",
            minHeight: "500px",
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isImage ? (
            <img
              src={submission.fileUrl}
              alt={fileName}
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                margin: "0 auto",
                objectFit: "contain",
              }}
            />
          ) : isPdf ? (
            <div
              style={{
                width: "100%",
                maxWidth: "1000px",
                padding: "24px",
                boxSizing: "border-box",
              }}
            >
              {Array.from(
                { length: totalPdfPages },
                (_, index) => index + 1,
              ).map((page) => (
                <div
                  key={`${submission.fileUrl}-page-${page}`}
                  style={{
                    width: "100%",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "center",
                    scrollMarginTop: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      background: "#fff",
                      borderRadius: "8px",
                      overflow: "hidden",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        color: "#444",
                        background: "#f3f3f3",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      Page {page} of {totalPdfPages}
                    </div>

                    <img
                      src={getPdfPreviewUrl(page)}
                      alt={`${fileName} - page ${page}`}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        margin: "0 auto",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const errorBox = event.currentTarget.nextElementSibling;
                        if (errorBox) {
                          errorBox.style.display = "block";
                        }
                      }}
                    />

                    <div
                      style={{
                        display: "none",
                        textAlign: "center",
                        padding: "30px",
                        color: "#555",
                      }}
                    >
                      Unable to load page {page}.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <iframe
              src={submission.fileUrl}
              title={fileName}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
