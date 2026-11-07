import Image from "next/image";
import type { Photo as PhotoType } from "@/lib/catalog";

export function Photo({
  photo,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 70vw",
}: {
  photo: PhotoType;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      fill
      priority={priority}
      sizes={sizes}
      style={{ objectFit: "cover" }}
    />
  );
}

export function Credit({ photo }: { photo: PhotoType }) {
  return <p className="credit">{photo.credit}</p>;
}
