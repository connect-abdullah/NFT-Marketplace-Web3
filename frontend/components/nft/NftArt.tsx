"use client";

function mix(seed: number, min: number, span: number) {
  return min + (Math.abs(seed) % span);
}

export function NftArt({
  tokenId,
  className,
}: {
  tokenId: bigint;
  className?: string;
}) {
  const n = Number(tokenId % BigInt(9973));
  const olive = mix(n, 112, 24);
  const ochre = mix(n * 3, 58, 26);
  const stone = mix(n * 7, 78, 16);
  const ink = mix(n * 11, 48, 18);

  const bands = 3 + mix(n, 0, 3);
  const cx = 28 + mix(n * 13, 0, 44);
  const cy = 24 + mix(n * 17, 0, 28);
  const r = 16 + mix(n * 19, 0, 22);
  const tilt = mix(n * 23, -12, 24);

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`sky-${n}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`oklch(0.9 0.04 ${stone})`} />
          <stop offset="100%" stopColor={`oklch(0.78 0.05 ${olive})`} />
        </linearGradient>
        <clipPath id={`frame-${n}`}>
          <rect x="0" y="0" width="100" height="100" />
        </clipPath>
      </defs>
      <rect width="100" height="100" fill={`url(#sky-${n})`} />
      <g clipPath={`url(#frame-${n})`}>
        {Array.from({ length: bands }, (_, index) => (
          <rect
            key={index}
            x="-10"
            y={48 + index * 14}
            width="120"
            height="18"
            fill={`oklch(${0.58 - index * 0.05} 0.08 ${olive})`}
            opacity={0.55}
            transform={`rotate(${tilt * 0.15} 50 70)`}
          />
        ))}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`oklch(0.74 0.12 ${ochre})`}
        />
        <circle
          cx={cx + 8}
          cy={cy + 6}
          r={r * 0.35}
          fill={`oklch(0.86 0.06 ${stone})`}
          opacity="0.7"
        />
        <rect
          x={mix(n * 29, 8, 36)}
          y={mix(n * 31, 52, 18)}
          width={mix(n * 37, 22, 28)}
          height={mix(n * 41, 18, 24)}
          fill={`oklch(0.42 0.05 ${ink})`}
          opacity="0.8"
        />
        <path
          d={`M0 82 Q ${mix(n, 20, 60)} ${68 + mix(n, 0, 12)} 100 88 L100 100 L0 100 Z`}
          fill={`oklch(0.5 0.07 ${olive})`}
        />
      </g>
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        fill="none"
        stroke={`oklch(0.35 0.04 ${ink})`}
        strokeOpacity="0.25"
        strokeWidth="1.2"
      />
    </svg>
  );
}
