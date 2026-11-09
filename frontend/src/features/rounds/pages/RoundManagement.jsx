import { emptyRoundForm } from "../roundDefaults.js";
import React, { useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../config/firebase.js";
import { DEFAULT_CRITERIA } from "../../../config/constants.js";
import {
  getRoundState,
  getRoundStateLabel,
  makeRoundId,
} from "../../../utils/rounds.js";
import { RoundForm } from "../components/RoundForm.jsx";

export function RoundManagement({ rounds }) {
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(emptyRoundForm);

  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditingId(null);

    setForm({
      ...emptyRoundForm,
      criteria: DEFAULT_CRITERIA.map((item) => ({
        ...item,
      })),
    });

    setShowForm(true);
  };

  const editRound = (round) => {
    setEditingId(round.id);

    setForm({
      name: round.name || "",
      theme: round.theme || "",
      problemStatement: round.problemStatement || "",
      description: round.description || "",
      guidelines: (round.guidelines || []).join("\n"),
      creativeBrief: Array.isArray(round.creativeBrief)
        ? round.creativeBrief
        : [],
      allowedDesignTypes: round.allowedDesignTypes || ["ui", "poster"],
      enabled: !!round.enabled,
      isFinalRound: !!round.isFinalRound,
      criteria: round.criteria?.length ? round.criteria : DEFAULT_CRITERIA,
    });

    setShowForm(true);
  };

  const disableOtherRounds = async (exceptId) => {
    if (!auth.currentUser) {
      throw new Error("Admin session expired. Please login again.");
    }

    const snapshot = await getDocs(collection(db, "rounds"));

    const updates = [];

    snapshot.forEach((item) => {
      if (item.id !== exceptId && item.data().enabled) {
        updates.push(
          updateDoc(doc(db, "rounds", item.id), {
            enabled: false,
            updatedAt: serverTimestamp(),
          }),
        );
      }
    });

    await Promise.all(updates);
  };

  const saveRound = async () => {
    if (!form.name.trim()) {
      alert("Enter round name.");

      return;
    }

    if (!form.theme.trim()) {
      alert("Enter theme.");
      return;
    }

    if (!form.problemStatement.trim()) {
      alert("Enter problem statement.");

      return;
    }

    if (!form.allowedDesignTypes.length) {
      alert("Select at least one design type.");

      return;
    }

    const criteria = (form.criteria || [])
      .map((item) => ({
        name: String(item.name || "").trim(),

        maxScore: Number(item.maxScore),

        description: String(item.description || "").trim(),
      }))
      .filter((item) => item.name);

    if (!criteria.length) {
      alert("Add at least one AI evaluation criterion.");

      return;
    }

    if (
      criteria.some(
        (item) => !Number.isFinite(item.maxScore) || item.maxScore <= 0,
      )
    ) {
      alert("Every criterion must have a valid maximum score.");

      return;
    }

    const criteriaTotal = criteria.reduce(
      (sum, item) => sum + item.maxScore,
      0,
    );

    if (criteriaTotal !== 100) {
      alert(
        `AI criteria maximum must total exactly 100. Current total: ${criteriaTotal}.`,
      );

      return;
    }

    if (!auth.currentUser) {
      alert("Admin session expired. Please login again.");

      return;
    }

    setSaving(true);

    try {
      let roundId = editingId;

      if (!roundId) {
        roundId = makeRoundId(form.name);
      }

      if (form.enabled) {
        await disableOtherRounds(roundId);
      }

      const data = {
        name: form.name.trim(),

        theme: form.theme.trim(),

        problemStatement: form.problemStatement.trim(),

        description: form.description.trim(),

        guidelines: form.guidelines
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),

        creativeBrief: (form.creativeBrief || [])
          .map((item) => String(item || "").trim())
          .filter(Boolean),

        allowedDesignTypes: form.allowedDesignTypes,

        enabled: form.enabled,

        isFinalRound: form.isFinalRound,

        criteria,

        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "rounds", editingId), data);
      } else {
        await setDoc(doc(db, "rounds", roundId), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyRoundForm);
    } catch (error) {
      console.error(error);

      alert(error.message || "Unable to save round.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRound = async (round) => {
    if (!auth.currentUser) {
      alert("Admin session expired. Please login again.");

      return;
    }

    try {
      if (!round.enabled) {
        await disableOtherRounds(round.id);
      }

      await updateDoc(doc(db, "rounds", round.id), {
        enabled: !round.enabled,

        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);

      alert("Unable to update round.");
    }
  };

  const deleteRound = async (round) => {
    if (!auth.currentUser) {
      alert("Admin session expired. Please login again.");

      return;
    }

    const okay = window.confirm(`Delete ${round.name}? This cannot be undone.`);

    if (!okay) return;

    try {
      await deleteDoc(doc(db, "rounds", round.id));
    } catch (error) {
      console.error(error);

      alert("Unable to delete round.");
    }
  };

  return (
    <section className="admin-page">
      <div className="page-heading-row">
        <div>
          <span className="mini-label">CHALLENGE CONTROL</span>

          <h2>Round Management</h2>

          <p>Create and control unlimited competition rounds.</p>
        </div>

        <button className="primary-btn" onClick={openNew}>
          + Add New Round
        </button>
      </div>

      {showForm && (
        <RoundForm
          form={form}
          setForm={setForm}
          editingId={editingId}
          onSave={saveRound}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          saving={saving}
        />
      )}

      <div className="round-management-list">
        {rounds.length === 0 ? (
          <div className="admin-empty">
            <span>NO ROUNDS</span>

            <p>Create your first round using the button above.</p>
          </div>
        ) : (
          rounds.map((round, index) => {
            const state = getRoundState(round);

            return (
              <div
                className={`round-admin-card ${
                  state === "active" ? "is-active" : ""
                }`}
                key={round.id}
              >
                <div className="round-number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="round-admin-main">
                  <div className="round-admin-title">
                    <div>
                      <span className="mini-label">
                        {round.isFinalRound ? "FINAL ROUND" : "ROUND"}
                      </span>

                      <h3>{round.name}</h3>
                    </div>

                    <span className={`admin-status-pill ${state}`}>
                      {getRoundStateLabel(round)}
                    </span>
                  </div>

                  <div className="round-admin-theme">{round.theme}</div>

                  <div className="round-admin-meta">
                    <span>
                      {(round.allowedDesignTypes || [])
                        .map((type) => (type === "ui" ? "UI" : "POSTER"))
                        .join(" + ")}
                    </span>
                  </div>
                </div>

                <div className="round-admin-actions">
                  <button
                    className={
                      round.enabled ? "round-toggle enabled" : "round-toggle"
                    }
                    onClick={() => toggleRound(round)}
                  >
                    {round.enabled ? "Disable" : "Enable"}
                  </button>

                  <button className="icon-btn" onClick={() => editRound(round)}>
                    Edit
                  </button>

                  <button
                    className="icon-btn danger"
                    onClick={() => deleteRound(round)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
