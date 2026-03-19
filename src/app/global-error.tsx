"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          backgroundColor: "#0a0a0a",
          color: "#ffffff",
          fontFamily:
            "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 448 }}>
            <div
              style={{
                margin: "0 auto",
                display: "flex",
                height: 64,
                width: 64,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                backgroundColor: "#1a1a1a",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#de1135"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1
              style={{
                marginTop: 24,
                fontSize: 24,
                fontWeight: 600,
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                marginTop: 12,
                fontSize: 16,
                color: "#888888",
              }}
            >
              A critical error occurred. Please try again.
            </p>
            <div
              style={{
                marginTop: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                  padding: "0 20px",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#000000",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  backgroundColor: "#1a1a1a",
                  padding: "0 20px",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#ffffff",
                  textDecoration: "none",
                  border: "none",
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
