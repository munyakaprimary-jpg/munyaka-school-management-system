/**
 * Question Renderer
 *
 * Renders a Question with dynamic ordering for context, image, prompt and
 * answer options / structured response. The image position is read from
 * the question's `imagePosition` property:
 *   - "above":   image first
 *   - "between": image between context and prompt (only meaningful when
 *                contextStatement exists; otherwise treated as "below")
 *   - "below":   image after prompt (default)
 *
 * The same component drives online views and the print / PDF renderer so
 * that layouts stay in sync.
 */

import React from "react";
import type { Question, ImagePosition } from "@/types/questions";
import { cn } from "@/lib/utils";

export interface QuestionRendererProps {
  question: Question;
  /** Number shown before the question (e.g. 1, 2, 3). Optional. */
  number?: number;
  /** Visual variant — "card" for student views, "paper" for print/PDF. */
  variant?: "card" | "paper";
  /** Optional className for the outer container. */
  className?: string;
  /** Optional override text for the score label, e.g. "[5 marks]". */
  scoreLabel?: string;
  /** Optional override prompt style. */
  promptClassName?: string;
  /** Optional override context style. */
  contextClassName?: string;
  /** Optional override image style. */
  imageClassName?: string;
  /** Render the answer options / response area. */
  renderOptions?: () => React.ReactNode;
  renderStructured?: () => React.ReactNode;
  /** Render the model answer / marking key (for preview/marking views). */
  renderModelAnswer?: () => React.ReactNode;
  /** Render the answer line (paper variant typically uses this). */
  renderAnswerLine?: () => React.ReactNode;
}

const resolvePosition = (q: Question): ImagePosition => q.imagePosition || "below";

/**
 * Renders the image in the requested position. Returns null if no image.
 */
const renderImage = (
  question: Question,
  position: ImagePosition,
  imageClassName: string
): React.ReactNode => {
  if (!question.imageUrl) return null;
  return (
    <div className={cn("flex justify-center my-2", position === "above" ? "mt-0" : "")}>
      <img
        src={question.imageUrl}
        alt="Question diagram"
        className={imageClassName}
      />
    </div>
  );
};

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  number,
  variant = "card",
  className,
  scoreLabel,
  promptClassName,
  contextClassName,
  imageClassName,
  renderOptions,
  renderStructured,
  renderModelAnswer,
  renderAnswerLine,
}) => {
  const position = resolvePosition(question);

  // Default classes per variant
  const defaultContextCls =
    variant === "card"
      ? "text-sm text-slate-600 italic leading-relaxed mb-3 px-4 py-3 bg-violet-50/50 border-l-4 border-violet-300 rounded-r-xl"
      : "pp-ctx-stmt";

  const defaultPromptCls =
    variant === "card"
      ? "text-base sm:text-lg font-bold text-slate-800 leading-relaxed"
      : "pp-q-p";

  const defaultImageCls =
    variant === "card"
      ? "max-h-72 rounded-2xl border border-slate-200 object-contain shadow-sm"
      : "pp-q-img-inner";

  const contextCls = contextClassName || defaultContextCls;
  const promptCls = promptClassName || defaultPromptCls;
  const imgCls = imageClassName || defaultImageCls;

  // Build content blocks in the requested dynamic order
  const blocks: React.ReactNode[] = [];
  const push = (key: string, node: React.ReactNode) => blocks.push(<React.Fragment key={key}>{node}</React.Fragment>);

  // 1) Image at top
  if (position === "above") {
    push("image-above", renderImage(question, position, imgCls));
  }

  // 2) Context statement (if present)
  if (question.contextStatement && (question.contextStatement ?? '').trim()) {
    push("context", <div className={contextCls}>{question.contextStatement}</div>);
  }

  // 3) Image between context and prompt
  if (position === "between") {
    push("image-between", renderImage(question, position, imgCls));
  }

  // 4) Question prompt with optional number prefix
  push("prompt", (
    <div className={cn("flex items-start gap-2", variant === "paper" ? "pp-q-hdr" : "")}>
      {number !== undefined && (
        <span className={cn("font-bold", variant === "paper" ? "pp-q-n" : "text-slate-400")}>
          {number}.
        </span>
      )}
      <p className={cn("flex-1", promptCls)}>{question.prompt}</p>
      {scoreLabel && (
        <span className={cn("text-xs font-medium", variant === "paper" ? "pp-q-pt" : "text-slate-400 whitespace-nowrap")}>
          {scoreLabel}
        </span>
      )}
    </div>
  ));

  // 5) Image below prompt
  if (position === "below") {
    push("image-below", renderImage(question, position, imgCls));
  }

  // 6) Answer options (MCQ)
  if (renderOptions) {
    push("options", renderOptions());
  }

  // 7) Structured response area
  if (renderStructured) {
    push("structured", renderStructured());
  }

  // 8) Answer line (for paper variant)
  if (renderAnswerLine) {
    push("answer-line", renderAnswerLine());
  }

  // 9) Model answer (preview / marking views)
  if (renderModelAnswer) {
    push("model-answer", renderModelAnswer());
  }

  return (
    <div className={cn("space-y-3", className)}>
      {blocks}
    </div>
  );
};

export default QuestionRenderer;
