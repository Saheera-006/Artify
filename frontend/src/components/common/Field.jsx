import React from "react";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  children,
}) {
  return (
    <label className="form-field">
      <span>{label}</span>

      {children || (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}
