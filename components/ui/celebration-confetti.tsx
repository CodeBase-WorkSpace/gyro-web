"use client";

import {useEffect, useState} from "react";

import {cn} from "@/lib/utils";

const pieces = Array.from({length: 28}, (_, index) => ({
  id: index,
  left: `${4 + ((index * 37) % 92)}%`,
  delay: `${(index % 7) * 70}ms`,
  duration: `${900 + (index % 5) * 120}ms`,
  color: ["bg-primary", "bg-emerald-400", "bg-amber-400", "bg-sky-400", "bg-fuchsia-400"][index % 5],
  rotate: `${(index * 47) % 180}deg`,
}));

export function CelebrationConfetti({active, className}: {active: boolean; className?: string}) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) { setVisible(false); return; }
    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-[100] overflow-hidden motion-reduce:hidden", className)}
      aria-hidden="true"
    >
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={cn("absolute top-[-1rem] h-4 w-2 rounded-sm opacity-0 shadow-sm", piece.color)}
          style={{
            left: piece.left,
            rotate: piece.rotate,
            animation: `celebration-confetti-fall ${piece.duration} cubic-bezier(.2,.8,.3,1) ${piece.delay} forwards`,
          }}
        />
      ))}
    </div>
  );
}
