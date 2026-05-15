import { ImageResponse } from "next/og";

function Dot({ opacity }: { opacity: number }) {
  return (
    <div
      style={{
        width: 110,
        height: 110,
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
          width: 512,
          height: 512,
          background: "#0a0a0a",
          borderRadius: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 290,
            height: 290,
            display: "flex",
            flexWrap: "wrap",
            gap: 30,
          }}
        >
          {([0.9, 0.4, 0.9, 0.4, 1, 0.4, 0.9, 0.4, 0.9] as const).map((opacity, i) => (
            <Dot key={i} opacity={opacity} />
          ))}
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
