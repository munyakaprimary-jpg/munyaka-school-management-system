"use client";

import { SonnerToast } from "./sonner";
import { useToast } from "@/hooks/use-toast";

export const Toaster = () => {
  const { toasts } = useToast();

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        padding: "1rem",
        gap: "0.5rem",
        justifyContent: "end",
        alignItems: "end",
        zIndex: 2147483647,
      }}
    >
      {toasts.map((toast) => (
        <SonnerToast
          key={toast.id}
          action={toast.action}
          description={toast.description}
          title={toast.title}
          toastId={toast.id}
        />
      ))}
    </div>
  );
};