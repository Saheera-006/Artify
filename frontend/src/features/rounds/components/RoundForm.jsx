import React from "react";

export function RoundForm({
  form,
  setForm,
  editingId,
  onSave,
  onCancel,
  saving,
}) {
  const toggleType = (type) => {
    setForm((current) => {
      const exists = current.allowedDesignTypes.includes(type);

      const next = exists
        ? current.allowedDesignTypes.filter((item) => item !== type)
        : [...current.allowedDesignTypes, type];

      return {
        ...current,
        allowedDesignTypes: next,
      };
    });
  };

  return (
    <div className="round-form-card">
      <div className="panel-heading">
        <div>
          <span className="mini-label">
            {editingId ? "EDIT ROUND" : "NEW ROUND"}
          </span>

          <h3>{editingId ? "Update challenge" : "Create a new challenge"}</h3>
        </div>

        <button className="icon-btn" onClick={onCancel} type="button">
          ×
        </button>
      </div>

      <div className="round-form-grid">
        <label className="form-field">
          <span>Round Name / Number</span>

          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            placeholder="Round 1"
          />
        </label>

        <label className="form-field">
          <span>Theme</span>

          <input
            value={form.theme}
            onChange={(e) =>
              setForm({
                ...form,
                theme: e.target.value,
              })
            }
            placeholder="Enter round theme"
          />
        </label>

        <label className="form-field full-field">
          <span>Problem Statement</span>

          <textarea
            value={form.problemStatement}
            onChange={(e) =>
              setForm({
                ...form,
                problemStatement: e.target.value,
              })
            }
            placeholder="Enter the problem statement..."
          />
        </label>

        <div className="form-field full-field">
          <div className="criteria-editor-header creative-brief-editor-header">
            <div>
              <span>THE CREATIVE BRIEF</span>
              <small>
                Add the key requirements participants should include in their
                design.
              </small>
            </div>
            <button
              type="button"
              className="secondary-btn small-btn"
              onClick={() =>
                setForm({
                  ...form,
                  creativeBrief: [...(form.creativeBrief || []), ""],
                })
              }
            >
              + Add Requirement
            </button>
          </div>
          <div className="creative-brief-editor">
            {(form.creativeBrief || []).map((item, index) => (
              <div className="creative-brief-admin-row" key={index}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <input
                  value={item}
                  placeholder="Example: Restaurant name"
                  onChange={(e) => {
                    const creativeBrief = [...(form.creativeBrief || [])];
                    creativeBrief[index] = e.target.value;
                    setForm({ ...form, creativeBrief });
                  }}
                />
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() =>
                    setForm({
                      ...form,
                      creativeBrief: (form.creativeBrief || []).filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                  aria-label="Remove requirement"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {(form.creativeBrief || []).length === 0 && (
            <div className="creative-brief-empty">
              No requirements added yet. Use “+ Add Requirement”.
            </div>
          )}
        </div>

        <label className="form-field full-field">
          <span>Description (Optional)</span>

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            placeholder="Short description..."
          />
        </label>

        <label className="form-field full-field">
          <span>Guidelines</span>

          <textarea
            value={form.guidelines}
            onChange={(e) =>
              setForm({
                ...form,
                guidelines: e.target.value,
              })
            }
            placeholder={
              "Enter one guideline per line\nOriginal work only\nSubmit before deadline"
            }
          />
        </label>

        <div className="form-field">
          <span>Allowed Design Types</span>

          <div className="admin-type-options">
            <button
              type="button"
              className={
                form.allowedDesignTypes.includes("ui") ? "selected" : ""
              }
              onClick={() => toggleType("ui")}
            >
              UI Design
            </button>

            <button
              type="button"
              className={
                form.allowedDesignTypes.includes("poster") ? "selected" : ""
              }
              onClick={() => toggleType("poster")}
            >
              Poster Design
            </button>
          </div>
        </div>

        <div className="form-field full-field">
          <div className="criteria-editor-header">
            <div>
              <span>AI Evaluation Criteria</span>

              <small>
                These criteria are sent to Gemini for every submission in this
                round.
              </small>
            </div>

            <button
              type="button"
              className="secondary-btn small-btn"
              onClick={() =>
                setForm({
                  ...form,
                  criteria: [
                    ...(form.criteria || []),
                    {
                      name: "",
                      maxScore: 10,
                      description: "",
                    },
                  ],
                })
              }
            >
              + Add Criterion
            </button>
          </div>

          <div className="criteria-editor">
            {(form.criteria || []).map((criterion, index) => (
              <div className="criteria-row" key={index}>
                <input
                  value={criterion.name}
                  placeholder="Criterion name"
                  onChange={(e) => {
                    const criteria = [...(form.criteria || [])];

                    criteria[index] = {
                      ...criteria[index],
                      name: e.target.value,
                    };

                    setForm({
                      ...form,
                      criteria,
                    });
                  }}
                />

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={criterion.maxScore}
                  placeholder="Max"
                  onChange={(e) => {
                    const criteria = [...(form.criteria || [])];

                    criteria[index] = {
                      ...criteria[index],
                      maxScore: Number(e.target.value),
                    };

                    setForm({
                      ...form,
                      criteria,
                    });
                  }}
                />

                <input
                  value={criterion.description}
                  placeholder="What should Gemini look for?"
                  onChange={(e) => {
                    const criteria = [...(form.criteria || [])];

                    criteria[index] = {
                      ...criteria[index],
                      description: e.target.value,
                    };

                    setForm({
                      ...form,
                      criteria,
                    });
                  }}
                />

                <button
                  type="button"
                  className="icon-btn danger"
                  disabled={(form.criteria || []).length <= 1}
                  onClick={() => {
                    const criteria = (form.criteria || []).filter(
                      (_, i) => i !== index,
                    );

                    setForm({
                      ...form,
                      criteria,
                    });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="round-switches">
          <label className="switch-row">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  enabled: e.target.checked,
                })
              }
            />

            <span className="fake-switch" />

            <div>
              <strong>Enable Round</strong>

              <small>Only one round should be enabled at a time.</small>
            </div>
          </label>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={form.isFinalRound}
              onChange={(e) =>
                setForm({
                  ...form,
                  isFinalRound: e.target.checked,
                })
              }
            />

            <span className="fake-switch" />

            <div>
              <strong>Final Round</strong>

              <small>Mark this as the final stage.</small>
            </div>
          </label>
        </div>
      </div>

      <div className="panel-actions">
        <button className="secondary-btn" onClick={onCancel} type="button">
          Cancel
        </button>

        <button
          className="primary-btn"
          onClick={onSave}
          disabled={saving}
          type="button"
        >
          {saving ? "Saving..." : "Save Round"}

          <span>→</span>
        </button>
      </div>
    </div>
  );
}
