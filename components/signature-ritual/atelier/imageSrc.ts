import type { StaticImageData } from "next/image";

/** Next.js static imports are `StaticImageData`; Vite used `string`. Normalize for `<img src>`. */
export function imageSrc(src: string | StaticImageData): string {
  return typeof src === "string" ? src : src.src;
}
