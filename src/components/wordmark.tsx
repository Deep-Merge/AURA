import Image from "next/image";
import logo from "../../logo.png";

export function Wordmark({
  className,
  labelled = false,
  priority = false,
}: {
  variant?: "full" | "compact" | "footer" | "mark";
  tone?: "ink" | "light";
  className?: string;
  labelled?: boolean;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt={labelled ? "AURA, Curated Journeys" : ""}
      className={className}
      sizes="220px"
      priority={priority}
      unoptimized
    />
  );
}
