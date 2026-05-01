"use client";

/**
 * SketchButton.tsx
 * A button component with a hand-drawn SVG border that redraws itself on hover.
 */
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SketchButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const SketchButton = ({
  children,
  variant = "primary",
  onClick,
  href,
  className = "",
  disabled,
  type,
}: SketchButtonProps) => {
  const isPrimary = variant === "primary";

  const baseWrapperStyles = `relative inline-flex items-center justify-center px-6 py-3 font-medium text-lg focus:outline-none focus:ring-2 focus:ring-ink-faint focus:ring-offset-2 focus:ring-offset-warm-white ${className}`;

  const textStyles = isPrimary ? "text-warm-white" : "text-ink";
  const bgStyles = isPrimary ? "bg-ink" : "bg-transparent";

  // Outline drawing interaction
  const PATH_LENGTH = 280;

  const content = (
    <>
      <span className={`relative z-10 ${textStyles}`}>{children}</span>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <motion.path
          d="M 2 2 L 98 4 L 96 98 L 4 96 Z"
          fill={isPrimary ? "currentColor" : "none"}
          className={isPrimary ? "text-ink" : "text-transparent"}
          vectorEffect="non-scaling-stroke"
        />
        <motion.path
          d="M 3 5 C 10 3, 90 2, 97 4 C 99 20, 96 80, 95 95 C 80 97, 20 99, 5 97 C 2 80, 4 20, 3 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink"
          strokeDasharray={PATH_LENGTH}
          variants={{
            initial: { strokeDashoffset: PATH_LENGTH },
            hover: { 
              strokeDashoffset: 0, 
              transition: { duration: 0.4, ease: "easeOut" } 
            },
          }}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </>
  );

  const wrapperProps = {
    className: `${baseWrapperStyles} ${bgStyles}`,
    onClick,
    initial: "initial",
    whileHover: "hover",
    whileTap: disabled ? undefined : { scale: 0.96 },
    variants: {
      initial: { scale: 1, rotate: 0 },
      hover: disabled ? {} : { scale: 1.02, rotate: -0.5, transition: { duration: 0.2 } },
    },
    disabled,
  };

  if (href) {
    return (
      <Link href={href} legacyBehavior passHref>
        <motion.a {...wrapperProps}>{content}</motion.a>
      </Link>
    );
  }

  return <motion.button {...wrapperProps} type={type}>{content}</motion.button>;
};
