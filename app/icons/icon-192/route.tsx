import { ImageResponse } from "next/og";

function Dot({ opacity }: { opacity: number }) {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: `rgba(200, 241, 53, ${opacity})`,
      }}
    />
  );
}

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "#0a0a0a",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 108,
            height: 108,
            display: "flex",
            flexWrap: "wrap",
            gap: 11,
          }}
        >
          {([0.9, 0.4, 0.9, 0.4, 1, 0.4, 0.9, 0.4, 0.9] as const).map((opacity, i) => (
            <Dot key={i} opacity={opacity} />
          ))}
        </div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
