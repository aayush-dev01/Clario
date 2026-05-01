/* Purpose: Prefer real profile photo, fallback to deterministic AvatarSVG. */
"use client";

import React from "react";
import { AvatarSVG } from "@/components/ui/AvatarSVG";

type ProfileAvatarProps = {
  seed: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
  imgClassName?: string;
  alt?: string;
};

export function ProfileAvatar({
  seed,
  imageUrl,
  size = 48,
  className = "",
  imgClassName = "",
  alt,
}: ProfileAvatarProps) {
  if (imageUrl) {
    // We intentionally use <img> because Clerk image URLs are often remote and
    // Next/Image requires domain allowlisting.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={alt ?? `${seed} avatar`}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className} ${imgClassName}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return <AvatarSVG seed={seed} size={size} className={className} />;
}

