/**
 * MarkedScriptPDF
 *
 * A clean, print-friendly wrapper around a fully-marked StudentSubmission.
 * Renders the header (school name, student, exam, score) followed by a
 * per-question breakdown (question, student's answer, correct answer key,
 * awarded marks, teacher feedback).
 *
 * The outer wrapper has id `marked-script-pdf` and every per-submission
 * copy also exposes an id `script-pdf-{submission.id}` so html2pdf.js can
 * target a specific record when exporting.
 *
 * The component is intentionally minimal and inline-styled so the PDF
 * output is portable and self-contained — no Tailwind classes are
 * translated by html2canvas if they ever fail to load inside the iframe
 * the PDF generator creates.
 */

import React from "react";
import type { Question } from "@/types/questions";
import type { StudentSubmission } from "@/types/assessment";

interface MarkedScriptPDFProps {
  submission: StudentSubmission;
  /**
   * Optional list of full question objects. When provided, each question
   * is rendered with its prompt, student's answer, correct answer key,
   * awarded marks, and (optional) teacher feedback. If omitted, the
   * component falls back to a "raw" view that just lists
   * answers/marks/feedback keys.
   */
  questions?: Question[];
  /** Override the school name shown in the header. */
  schoolName?: string;
}

const PALETTE = {
  primary: "#4338ca",     // indigo-700
  primaryDark: "#312e81",  // indigo-900
  accent: "#0d9488",       // teal-600
  text: "#0f172a",         // slate-900
  muted: "#475569",        // slate-600
  light: "#f8fafc",        // slate-50
  border: "#e2e8f0",       // slate-200
  success: "#15803d",      // green-700
  successBg: "#dcfce7",    // green-100
  warning: "#b45309",      // amber-700
  warningBg: "#fef3c7",    // amber-100
  danger: "#b91c1c",       // red-700
  dangerBg: "#fee2e2",     // red-100
  info: "#1d4ed8",         // blue-700
  infoBg: "#dbeafe",       // blue-100
};

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function gradeFromPct(pct: number): { letter: string; label: string; bg: string; fg: string } {
  if (pct >= 80) return { letter: "A", label: "Exceeds Expectations", bg: PALETTE.successBg, fg: PALETTE.success };
  if (pct >= 60) return { letter: "B", label: "Meets Expectations", bg: PALETTE.infoBg, fg: PALETTE.info };
  if (pct >= 40) return { letter: "C", label: "Approaches Expectations", bg: PALETTE.warningBg, fg: PALETTE.warning };
  return { letter: "D", label: "Below Expectations", bg: PALETTE.dangerBg, fg: PALETTE.danger };
}

const MarkedScriptPDF: React.FC<MarkedScriptPDFProps> = ({
  submission,
  questions,
  schoolName = "Munyaka Portal",
}) => {
  const grade = gradeFromPct(submission.percentage);

  // Build a fast lookup from questionId -> Question (for those that exist).
  const questionMap: Record<string, Question> = {};
  if (questions) {
    questions.forEach((q) => {
      questionMap[q.id] = q;
    });
  }

  return (
    <div
      id="marked-script-pdf"
      data-testid="marked-script-pdf"
      style={{
        width: "210mm",            // A4 width
        minHeight: "297mm",
        background: "#ffffff",
        color: PALETTE.text,
        fontFamily:
          "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        fontSize: "12pt",
        lineHeight: 1.5,
        boxSizing: "border-box",
        padding: "0",
      }}
    >
      {/* Per-submission target so html2pdf can serialise just this copy */}
      <div id={`script-pdf-${submission.id}`}>
        {/* ── Header band ─────────────────────────────────────────────────── */}
        <header
          style={{
            background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)`,
            color: "#ffffff",
            padding: "18mm 12mm 12mm 12mm",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "9pt",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                  margin: 0,
                }}
              >
                Marked Assessment Script
              </p>
              <h1
                style={{
                  fontSize: "22pt",
                  fontWeight: 800,
                  margin: "4px 0 2px 0",
                  letterSpacing: "-0.01em",
                }}
              >
                {schoolName}
              </h1>
              <p
                style={{
                  fontSize: "11pt",
                  opacity: 0.85,
                  margin: 0,
                }}
              >
                {submission.examTitle}
              </p>
            </div>
            <div
              style={{
                textAlign: "right",
                minWidth: "120px",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 14px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <p
                  style={{
                    fontSize: "9pt",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    opacity: 0.75,
                    margin: 0,
                  }}
                >
                  Final Score
                </p>
                <p
                  style={{
                    fontSize: "28pt",
                    fontWeight: 800,
                    margin: "2px 0 0 0",
                    lineHeight: 1,
                  }}
                >
                  {submission.percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "10px",
              marginTop: "14px",
            }}
          >
            <MetaCell label="Student Name" value={submission.studentName} />
            <MetaCell label="Admission No." value={submission.admissionNo} />
            <MetaCell label="Submitted" value={fmtDate(submission.submittedAt)} />
            <MetaCell
              label="Grade"
              value={
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    background: grade.bg,
                    color: grade.fg,
                    fontWeight: 700,
                    fontSize: "10pt",
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{grade.letter}</span>
                  <span style={{ fontSize: "9pt" }}>· {grade.label}</span>
                </span>
              }
            />
          </div>

          {/* Score line */}
          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: "rgba(255,255,255,0.12)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "10pt",
            }}
          >
            <span>
              <strong style={{ fontSize: "12pt" }}>
                {submission.score}
              </strong>
              <span style={{ opacity: 0.7 }}> / {submission.totalPoints} points</span>
            </span>
            <span style={{ opacity: 0.7 }}>
              {questions
                ? `${questions.length} question${questions.length === 1 ? "" : "s"}`
                : `${Object.keys(submission.answers).length} response${Object.keys(submission.answers).length === 1 ? "" : "s"}`}
            </span>
          </div>
        </header>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <main
          style={{
            padding: "10mm 12mm 12mm 12mm",
            background: "#ffffff",
          }}
        >
          <h2
            style={{
              fontSize: "13pt",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: PALETTE.primary,
              margin: "0 0 8px 0",
              borderBottom: `2px solid ${PALETTE.primary}`,
              paddingBottom: "4px",
              display: "inline-block",
            }}
          >
            Question-by-Question Breakdown
          </h2>

          {/* If we have full question objects, render the rich view. */}
          {questions && questions.length > 0 ? (
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: "10px 0 0 0",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {questions.map((q, idx) => {
                const studentAnswer = submission.answers[q.id];
                const awarded = submission.marks[q.id];
                const comment = submission.feedback?.[q.id];

                const maxPoints = q.points ?? 0;
                const earned = typeof awarded === "number" ? awarded : 0;
                const isFull = earned === maxPoints && maxPoints > 0;
                const isZero = earned === 0;

                // For MCQ, derive the human-friendly student/correct labels.
                let studentAnswerText: React.ReactNode = "—";
                let correctAnswerText: string = "—";
                if (q.type === "mcq") {
                  const sel = q.options?.find((o) => o.id === studentAnswer);
                  studentAnswerText = sel
                    ? `${sel.label}. ${sel.text || "(empty)"}`
                    : "No answer";
                  const correct = q.options?.find(
                    (o) => o.id === q.correctOptionId
                  );
                  correctAnswerText = correct
                    ? `${correct.label}. ${correct.text || "(empty)"}`
                    : "—";
                } else {
                  studentAnswerText =
                    typeof studentAnswer === "string" && studentAnswer.trim()
                      ? studentAnswer
                      : "No answer";
                  correctAnswerText = q.modelAnswer?.trim() || "—";
                }

                return (
                  <li
                    key={q.id}
                    style={{
                      border: `1px solid ${PALETTE.border}`,
                      borderRadius: "12px",
                      padding: "10px 12px",
                      background: PALETTE.light,
                      pageBreakInside: "avoid",
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "9pt",
                            fontWeight: 800,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: PALETTE.muted,
                            margin: 0,
                          }}
                        >
                          Question {idx + 1} · {q.type === "mcq" ? "MCQ" : "Structured"}
                        </p>
                        <p
                          style={{
                            fontSize: "12pt",
                            fontWeight: 700,
                            margin: "2px 0 0 0",
                            color: PALETTE.text,
                          }}
                        >
                          {q.prompt || "(No prompt)"}
                        </p>
                        {q.imageUrl && (
                          <div style={{ textAlign: "center", marginTop: "8px" }}>
                            <img
                              src={q.imageUrl}
                              alt="Question diagram"
                              style={{
                                maxHeight: "180px",
                                maxWidth: "100%",
                                objectFit: "contain",
                                border: "1px solid #ddd",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          background: isFull
                            ? PALETTE.successBg
                            : isZero
                            ? PALETTE.dangerBg
                            : PALETTE.warningBg,
                          color: isFull
                            ? PALETTE.success
                            : isZero
                            ? PALETTE.danger
                            : PALETTE.warning,
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontWeight: 800,
                          fontSize: "11pt",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {earned}/{maxPoints} PT
                      </div>
                    </div>

                    {/* Body — student's answer / correct answer */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        marginTop: "4px",
                      }}
                    >
                      <div
                        style={{
                          background: "#ffffff",
                          border: `1px solid ${PALETTE.border}`,
                          borderLeft: `4px solid ${PALETTE.info}`,
                          borderRadius: "8px",
                          padding: "8px 10px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "8pt",
                            fontWeight: 800,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: PALETTE.info,
                            margin: 0,
                          }}
                        >
                          Student's Answer
                        </p>
                        <p
                          style={{
                            fontSize: "11pt",
                            margin: "4px 0 0 0",
                            whiteSpace: "pre-wrap",
                            color: PALETTE.text,
                          }}
                        >
                          {studentAnswerText}
                        </p>
                      </div>
                      <div
                        style={{
                          background: "#ffffff",
                          border: `1px solid ${PALETTE.border}`,
                          borderLeft: `4px solid ${PALETTE.success}`,
                          borderRadius: "8px",
                          padding: "8px 10px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "8pt",
                            fontWeight: 800,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: PALETTE.success,
                            margin: 0,
                          }}
                        >
                          Correct Answer Key
                        </p>
                        <p
                          style={{
                            fontSize: "11pt",
                            margin: "4px 0 0 0",
                            whiteSpace: "pre-wrap",
                            color: PALETTE.text,
                          }}
                        >
                          {correctAnswerText}
                        </p>
                      </div>
                    </div>

                    {/* Teacher feedback */}
                    <div
                      style={{
                        marginTop: "6px",
                        background: "#ffffff",
                        border: `1px dashed ${PALETTE.border}`,
                        borderRadius: "8px",
                        padding: "8px 10px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "8pt",
                          fontWeight: 800,
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          color: PALETTE.muted,
                          margin: 0,
                        }}
                      >
                        Teacher Feedback
                      </p>
                      <p
                        style={{
                          fontSize: "10.5pt",
                          fontStyle: comment ? "normal" : "italic",
                          color: comment ? PALETTE.text : PALETTE.muted,
                          margin: "4px 0 0 0",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {comment?.trim()
                          ? comment
                          : "— No comment recorded —"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            // Fallback: render the raw answers/marks/feedback maps.
            <FallbackBreakdown
              answers={submission.answers}
              marks={submission.marks}
              feedback={submission.feedback}
            />
          )}

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <footer
            style={{
              marginTop: "14px",
              paddingTop: "10px",
              borderTop: `1px solid ${PALETTE.border}`,
              display: "flex",
              justifyContent: "space-between",
              fontSize: "9pt",
              color: PALETTE.muted,
            }}
          >
            <span>Generated by {schoolName} · Marked Script Report</span>
            <span>Printed {fmtDate(new Date().toISOString())}</span>
          </footer>
        </main>
      </div>
    </div>
  );
};

const MetaCell: React.FC<{
  label: string;
  value: React.ReactNode;
}> = ({ label, value }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.12)",
      borderRadius: "10px",
      padding: "8px 10px",
    }}
  >
    <p
      style={{
        fontSize: "8pt",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        opacity: 0.7,
        margin: 0,
      }}
    >
      {label}
    </p>
    <p
      style={{
        fontSize: "11pt",
        fontWeight: 700,
        margin: "2px 0 0 0",
        color: "#ffffff",
      }}
    >
      {value}
    </p>
  </div>
);

const FallbackBreakdown: React.FC<{
  answers: Record<string, any>;
  marks: Record<string, number>;
  feedback?: Record<string, string>;
}> = ({ answers, marks, feedback }) => {
  const ids = Array.from(
    new Set([...Object.keys(answers), ...Object.keys(marks)])
  );
  if (ids.length === 0) {
    return (
      <p
        style={{
          fontSize: "11pt",
          fontStyle: "italic",
          color: PALETTE.muted,
        }}
      >
        No question-level breakdown available for this submission.
      </p>
    );
  }
  return (
    <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {ids.map((qid, idx) => {
        const ans = answers[qid];
        const mark = marks[qid];
        const comment = feedback?.[qid];
        return (
          <li
            key={qid}
            style={{
              border: `1px solid ${PALETTE.border}`,
              borderRadius: "10px",
              padding: "8px 10px",
              marginBottom: "6px",
              background: PALETTE.light,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <strong style={{ fontSize: "11pt" }}>Question {idx + 1}</strong>
              <span
                style={{
                  background: PALETTE.primary,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "10pt",
                }}
              >
                {typeof mark === "number" ? `${mark} PT` : "—"}
              </span>
            </div>
            <p style={{ margin: "4px 0", fontSize: "10.5pt" }}>
              <strong>Answer:</strong>{" "}
              {typeof ans === "string" ? ans : JSON.stringify(ans)}
            </p>
            {comment?.trim() && (
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: "10.5pt",
                  color: PALETTE.muted,
                }}
              >
                <strong>Comment:</strong> {comment}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default MarkedScriptPDF;
