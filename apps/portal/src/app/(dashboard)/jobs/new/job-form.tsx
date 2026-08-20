"use client";

import { useActionState, useRef, useEffect } from "react";
import { createJobPosting } from "../actions";
import type { JobPostingState } from "../types";

const initialState: JobPostingState = {};

export function JobPostingForm() {
  const [state, formAction, isPending] = useActionState(createJobPosting, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="form-panel">
      <div>
        <h2>New Job Posting</h2>
        <p className="muted">This posting will be visible to everyone on the public Jobs page.</p>
      </div>

      {state.error && (
        <div className="alert-error" role="alert">
          ⚠️ {state.error}
        </div>
      )}

      {state.success && (
        <div className="alert-success" role="status">
          ✅ {state.success}
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        className="form-panel"
        style={{ padding: 0, border: "none", boxShadow: "none" }}
      >
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-control"
              placeholder="e.g. Senior Backend Engineer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              name="department"
              type="text"
              className="form-control"
              placeholder="e.g. Engineering (Optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              className="form-control"
              placeholder="e.g. Rawalpindi / Remote (Optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="employmentType">Employment Type</label>
            <select
              id="employmentType"
              name="employmentType"
              className="form-control"
              defaultValue=""
            >
              <option value="">Not specified</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Job Description *</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            placeholder="Responsibilities, requirements, and any other details candidates should know."
            rows={8}
            required
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ marginTop: "4px" }}>
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? "Adding Job Steps..." : "Add Job Steps"}
          </button>
        </div>
      </form>
    </div>
  );
}
