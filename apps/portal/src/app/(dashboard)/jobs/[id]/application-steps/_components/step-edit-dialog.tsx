"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function StepEditDialog({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="step-edit-dialog-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "24px",
        background: "rgba(15, 23, 42, 0.55)"
      }}
    >
      <div
        className="form-panel"
        style={{ maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <h2 id="step-edit-dialog-title">{title}</h2>
          <button type="button" className="back-link" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
