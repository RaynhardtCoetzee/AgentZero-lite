import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#0a0a0a",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
          }}
        >
          {[0.9, 0.4, 0.9, 0.4, 1, 0.4, 0.9, 0.4, 0.9].map((opacity, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4,
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
