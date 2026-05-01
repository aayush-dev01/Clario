/* AvatarSVG.tsx — Deterministic hand-drawn face avatar generated from a seed string. */
import React from "react";

interface AvatarSVGProps {
  seed: string;
  size?: number;
  className?: string;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export const AvatarSVG = ({ seed, size = 48, className = "" }: AvatarSVGProps) => {
  const h = hashCode(seed);
  
  // Specific character overrides to hit exactly the visual specs
  const override = seed.toLowerCase().trim();
  
  // Defaults based on hash
  let faceShape = h % 3; // 0: round, 1: wide, 2: narrow
  let hairStyle = h % 5; // 0: short straight, 1: wavy, 2: curly, 3: no hair, 4: bun
  let eyeShape = h % 3; // 0: dots, 1: lines, 2: ovals
  let eyebrowAngle = h % 3; // 0: flat, 1: slight arch, 2: arched
  let mouthExpression = h % 3; // 0: gentle smile, 1: straight upturn, 2: fuller curve
  let optionals = h % 3; // 0: none, 1: glasses, 2: freckles

  // Overrides
  if (override.includes("maya")) {
    hairStyle = 1; // wavy
    optionals = 1; // glasses
    faceShape = 0;
    eyeShape = 0;
    eyebrowAngle = 1;
    mouthExpression = 0;
  } else if (override.includes("david")) {
    hairStyle = 0; // short straight
    eyebrowAngle = 2; // strong eyebrows
    optionals = 0; 
    faceShape = 1;
    eyeShape = 0;
    mouthExpression = 1;
  } else if (override.includes("sarah")) {
    hairStyle = 4; // bun
    optionals = 0;
    faceShape = 2;
    eyeShape = 2;
    eyebrowAngle = 1;
    mouthExpression = 2;
  } else if (override.includes("james")) {
    hairStyle = 3; // no hair
    optionals = 1; // glasses
    faceShape = 0;
    eyeShape = 0;
    eyebrowAngle = 0;
    mouthExpression = 1;
  } else if (override.includes("priya")) {
    hairStyle = 2; // curly
    optionals = 0;
    faceShape = 1;
    eyeShape = 0;
    eyebrowAngle = 1;
    mouthExpression = 2;
  } else if (override.includes("alex")) {
    hairStyle = 1; // wavy
    optionals = 2; // freckles
    faceShape = 2;
    eyeShape = 0;
    eyebrowAngle = 1;
    mouthExpression = 0;
  }

  // Draw Logic
  // Center is 50,50
  const cx = 50, cy = 52;
  const rx = faceShape === 0 ? 32 : faceShape === 1 ? 36 : 28;
  const ry = faceShape === 0 ? 34 : faceShape === 1 ? 32 : 36;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`text-ink ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#F2F0EB" stroke="none" />

      {/* Face Shape */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />

      {/* Hair Styles */}
      {hairStyle === 0 && (
        <path d={`M ${cx - rx + 4} ${cy - 10} Q ${cx} ${cy - ry - 6} ${cx + rx - 4} ${cy - 10}`} />
      )}
      {hairStyle === 1 && ( // Wavy
        <path d={`M ${cx - rx} ${cy} Q ${cx - rx/2} ${cy - ry} ${cx} ${cy - ry + 4} T ${cx + rx} ${cy}`} />
      )}
      {hairStyle === 2 && ( // Curly
        <path d={`M ${cx - rx} ${cy - 10} C ${cx - rx - 10} ${cy - 30}, ${cx + rx + 10} ${cy - 30}, ${cx + rx} ${cy - 10}`} strokeDasharray="4 6" strokeWidth="4" strokeLinecap="round" />
      )}
      {hairStyle === 3 && ( // No hair (just add an ear line or leave empty)
        <>
          <path d={`M ${cx - rx} ${cy} Q ${cx - rx - 4} ${cy - 5} ${cx - rx} ${cy - 10}`} />
          <path d={`M ${cx + rx} ${cy} Q ${cx + rx + 4} ${cy - 5} ${cx + rx} ${cy - 10}`} />
        </>
      )}
      {hairStyle === 4 && ( // Bun
        <>
          <path d={`M ${cx - rx + 4} ${cy - 15} Q ${cx} ${cy - ry - 4} ${cx + rx - 4} ${cy - 15}`} />
          <circle cx={cx} cy={cy - ry - 8} r="8" />
        </>
      )}

      {/* Eyebrows */}
      {eyebrowAngle === 0 && (
        <>
          <line x1={cx - 16} y1={cy - 12} x2={cx - 6} y2={cy - 12} />
          <line x1={cx + 6} y1={cy - 12} x2={cx + 16} y2={cy - 12} />
        </>
      )}
      {eyebrowAngle === 1 && (
        <>
          <path d={`M ${cx - 16} ${cy - 10} Q ${cx - 11} ${cy - 14} ${cx - 6} ${cy - 10}`} />
          <path d={`M ${cx + 6} ${cy - 10} Q ${cx + 11} ${cy - 14} ${cx + 16} ${cy - 10}`} />
        </>
      )}
      {eyebrowAngle === 2 && ( // Arched/strong
        <>
          <path d={`M ${cx - 18} ${cy - 8} L ${cx - 11} ${cy - 14} L ${cx - 4} ${cy - 10}`} strokeWidth="2.5" />
          <path d={`M ${cx + 4} ${cy - 10} L ${cx + 11} ${cy - 14} L ${cx + 18} ${cy - 8}`} strokeWidth="2.5" />
        </>
      )}

      {/* Eyes */}
      {eyeShape === 0 && (
        <>
          <circle cx={cx - 12} cy={cy - 2} r="2" fill="currentColor" stroke="none" />
          <circle cx={cx + 12} cy={cy - 2} r="2" fill="currentColor" stroke="none" />
        </>
      )}
      {eyeShape === 1 && (
        <>
          <line x1={cx - 15} y1={cy - 2} x2={cx - 9} y2={cy - 2} />
          <line x1={cx + 9} y1={cy - 2} x2={cx + 15} y2={cy - 2} />
        </>
      )}
      {eyeShape === 2 && (
        <>
          <ellipse cx={cx - 12} cy={cy - 2} rx="2" ry="3" fill="currentColor" stroke="none" />
          <ellipse cx={cx + 12} cy={cy - 2} rx="2" ry="3" fill="currentColor" stroke="none" />
        </>
      )}

      {/* Mouth */}
      {mouthExpression === 0 && ( // Gentle smile
        <path d={`M ${cx - 8} ${cy + 14} Q ${cx} ${cy + 22} ${cx + 8} ${cy + 14}`} />
      )}
      {mouthExpression === 1 && ( // Straight with slight upturn
        <path d={`M ${cx - 7} ${cy + 16} Q ${cx} ${cy + 18} ${cx + 7} ${cy + 16}`} />
      )}
      {mouthExpression === 2 && ( // Fuller curve
        <path d={`M ${cx - 9} ${cy + 14} C ${cx - 2} ${cy + 22}, ${cx + 2} ${cy + 22}, ${cx + 9} ${cy + 14}`} />
      )}

      {/* Optionals */}
      {optionals === 1 && ( // Glasses
        <>
          <circle cx={cx - 12} cy={cy - 2} r="6" />
          <circle cx={cx + 12} cy={cy - 2} r="6" />
          <line x1={cx - 6} y1={cy - 2} x2={cx + 6} y2={cy - 2} />
        </>
      )}
      {optionals === 2 && ( // Freckles
        <>
          <circle cx={cx - 14} cy={cy + 6} r="0.5" fill="currentColor" stroke="none" />
          <circle cx={cx - 18} cy={cy + 8} r="0.5" fill="currentColor" stroke="none" />
          <circle cx={cx - 10} cy={cy + 8} r="0.5" fill="currentColor" stroke="none" />
          
          <circle cx={cx + 14} cy={cy + 6} r="0.5" fill="currentColor" stroke="none" />
          <circle cx={cx + 18} cy={cy + 8} r="0.5" fill="currentColor" stroke="none" />
          <circle cx={cx + 10} cy={cy + 8} r="0.5" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
};
