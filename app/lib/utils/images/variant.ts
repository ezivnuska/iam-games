// app/lib/utils/images/variant.ts

import type { Image } from "@/app/lib/definitions/image";

export function getBestVariant(
  image: Image | null | undefined,
  desiredWidth: number
): { url: string; width: number; height: number } | null {
  if (!image?.variants?.length) return null;

  return image.variants.reduce((closest, current) => {
    if (!current.width) return closest;
    return Math.abs(current.width - desiredWidth) < Math.abs((closest.width ?? 0) - desiredWidth)
      ? current
      : closest;
  }, image.variants[0]);
}

export function getVariantBySize(
  image: Image | null | undefined,
  sizeName: string
): { url: string; width: number; height: number; size?: string } | null {
  if (!image?.variants?.length) return null;
  return image.variants.find(v => v.size === sizeName) || image.variants[0];
}

export const IMAGE_SIZES = {
  AVATAR_SMALL: 40,
  AVATAR_MEDIUM: 80,
  AVATAR_LARGE: 120,
  THUMBNAIL: 200,
  CARD: 400,
  CONTENT: 800,
  FULL: 1200,
} as const;
