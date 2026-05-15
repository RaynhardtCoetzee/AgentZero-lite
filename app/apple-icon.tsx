import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#0a0a0a",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          {[0.9, 0.4, 0.9, 0.4, 1, 0.4, 0.9, 0.4, 0.9].map((opacity, i) => (
            <div
              key={i}
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: `rgba(200, 241, 53, ${opacity})`,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
