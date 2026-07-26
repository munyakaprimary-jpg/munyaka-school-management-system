"use client";

import { toast } from "sonner";
import { type ToasterProps } from "@/types";

export function SonnerToast({
  title,
  description,
  action,
  toastId,
}: ToasterProps) {
  return (
    <div className="flex flex-col gap-2">
      {title && <div className="font-medium">{title}</div>}
      {description && <div className="text-sm opacity-80">{description}</div>}
      {action && (
        <button
          onClick={() => toast.action(toastId, action.label, action.onClick)}
          className="text-xs underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}