"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "20px",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#0a0a0a",
            color: "#e5e5e5",
          }}
        >
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Something went wrong</h1>
          <p style={{ marginBottom: "24px", color: "#a3a3a3" }}>
            We apologize for the inconvenience. The error has been reported.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ marginTop: "16px", fontSize: "12px", color: "#737373" }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
