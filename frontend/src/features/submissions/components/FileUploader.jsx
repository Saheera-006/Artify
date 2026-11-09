import React, { useState } from "react";
import {
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
  ALLOWED_EXTENSIONS,
} from "../../../config/constants.js";
import { getExtension } from "../../../utils/files.js";

export function FileUploader({ file, setFile, disabled }) {
  const [dragging, setDragging] = useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const extension = getExtension(selectedFile.name);

    if (
      !ALLOWED_TYPES.includes(selectedFile.type) &&
      !ALLOWED_EXTENSIONS.includes(extension)
    ) {
      alert("Only PNG, JPG, JPEG or PDF files are allowed.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("Maximum file size is 10 MB.");
      return;
    }

    setFile(selectedFile);
  };

  return (
    <div
      className={`file-uploader ${
        dragging ? "dragging" : ""
      } ${disabled ? "disabled" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();

        if (!disabled) {
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();

        setDragging(false);

        if (!disabled) {
          handleFile(event.dataTransfer.files?.[0]);
        }
      }}
    >
      <input
        id="design-upload"
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {!file ? (
        <label htmlFor="design-upload" className="upload-content">
          <div className="upload-icon">↑</div>

          <strong>
            Drop your design here or <span>browse</span>
          </strong>

          <small>PNG, JPG, JPEG or PDF · Maximum 10 MB</small>
        </label>
      ) : (
        <div className="selected-file">
          <div className="file-symbol">FILE</div>

          <div>
            <strong>{file.name}</strong>

            <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
          </div>

          {!disabled && (
            <button type="button" onClick={() => setFile(null)}>
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
