import { auraPath, lockupView, markPath, markWavePath, subtitlePath, wavePath } from "./logo-paths";

type Variant = "full" | "compact" | "footer" | "mark";
type Tone = "ink" | "light";

const tones = {
  ink: { ink: "#14212B", accent: "#0068AD" },
  light: { ink: "#FFFFFF", accent: "#0068AD" },
};

export function Wordmark({
  variant = "full",
  tone = "ink",
  className,
  labelled = false,
}: {
  variant?: Variant;
  tone?: Tone;
  className?: string;
  labelled?: boolean;
}) {
  const { ink, accent } = tones[tone];
  const label = labelled ? "AURA, Curated Journeys" : undefined;

  if (variant === "mark") {
    return (
      <svg className={className} viewBox="0 0 32 32" role={labelled ? "img" : undefined} aria-label={label} aria-hidden={labelled ? undefined : true}>
        <path fill={ink} d={markPath} />
        <path d={markWavePath} fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  const compact = variant === "compact";
  const height = compact ? lockupView.compactHeight : lockupView.height;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${lockupView.width} ${height}`}
      role={labelled ? "img" : undefined}
      aria-label={label}
      aria-hidden={labelled ? undefined : true}
    >
      <path fill={ink} d={auraPath} />
      <path d={wavePath} fill="none" stroke={accent} strokeWidth="1.35" strokeLinecap="round" />
      {compact ? null : <path fill={ink} d={subtitlePath} />}
    </svg>
  );
}
