import {ImageResponse} from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#07100e",
          color: "#eef8f5",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "space-between",
          padding: "70px",
          width: "100%",
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 26, width: 650}}>
          <div style={{alignItems: "center", display: "flex", gap: 18}}>
            <div
              style={{
                alignItems: "center",
                background: "#08110f",
                border: "1px solid #18302b",
                borderRadius: 18,
                boxShadow: "0 18px 40px rgba(0, 169, 131, 0.2)",
                display: "flex",
                height: 72,
                justifyContent: "center",
                width: 72,
              }}
            >
              <div
                style={{
                  borderBottom: "10px solid #35ddcb",
                  borderLeft: "10px solid #35ddcb",
                  borderRadius: "16px 0 0 16px",
                  borderTop: "10px solid #35ddcb",
                  display: "flex",
                  height: 44,
                  position: "relative",
                  width: 46,
                }}
              >
                <div
                  style={{
                    background: "#718882",
                    borderRadius: 999,
                    height: 5,
                    position: "absolute",
                    right: 6,
                    top: 9,
                    width: 25,
                  }}
                />
                <div
                  style={{
                    background: "#718882",
                    borderRadius: 999,
                    height: 5,
                    position: "absolute",
                    right: 6,
                    top: 20,
                    width: 31,
                  }}
                />
                <div
                  style={{
                    background: "#718882",
                    borderRadius: 999,
                    height: 5,
                    position: "absolute",
                    right: 6,
                    top: 31,
                    width: 25,
                  }}
                />
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column"}}>
              <strong style={{fontSize: 42}}>gyrohealth.ir</strong>
              <span style={{color: "#92aaa4", fontSize: 24}}>Calm nutrition ledger</span>
            </div>
          </div>
          <h1 style={{fontSize: 76, lineHeight: 1.08, margin: 0}}>
            Fast food logging. Calm progress.
          </h1>
          <p style={{color: "#a9bbb6", fontSize: 30, lineHeight: 1.45, margin: 0}}>
            Daily calories, goals, routines, and weekly review in a focused product experience.
          </p>
        </div>
        <div
          style={{
            alignItems: "center",
            border: "1px solid #24413b",
            borderRadius: 44,
            display: "flex",
            flexDirection: "column",
            gap: 22,
            padding: 28,
            width: 330,
          }}
        >
          <div style={{border: "10px solid #00a983", borderRadius: 999, height: 190, width: 190}}/>
          <div style={{background: "#0d1916", borderRadius: 24, height: 42, width: "100%"}}/>
          <div style={{background: "#0d1916", borderRadius: 24, height: 42, width: "82%"}}/>
          <div style={{background: "#00a983", borderRadius: 24, height: 42, width: "70%"}}/>
        </div>
      </div>
    ),
    size,
  );
}
