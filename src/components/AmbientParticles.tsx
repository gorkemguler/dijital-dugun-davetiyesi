import React from 'react';
import { TemplateTheme } from '../data/templates';

interface AmbientParticlesProps {
  theme: TemplateTheme;
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 96}%`,
  delay: `${(i * 1.3) % 12}s`,
  duration: `${14 + (i % 8) * 2}s`,
  size: 6 + (i % 4) * 3,
}));

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({ theme }) => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      aria-hidden="true"
    >
      {PARTICLES.map((p) => {
        if (theme.particleType === 'gold-sparkles') {
          return (
            <span
              key={p.id}
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
              className="animate-float-slow absolute -top-6 rounded-full bg-gradient-to-br from-[#F7E7CE] via-[#D4AF37] to-[#9A7209] opacity-35 shadow-[0_0_8px_rgba(212,175,55,0.6)]"
            />
          );
        }

        if (theme.particleType === 'night-stars') {
          return (
            <span
              key={p.id}
              style={{
                left: p.left,
                top: `${(p.id * 23) % 92}%`,
                animationDelay: p.delay,
                width: `${Math.max(3, p.size - 4)}px`,
                height: `${Math.max(3, p.size - 4)}px`,
              }}
              className="animate-pulse absolute rounded-full bg-[#F5D6C1] opacity-40 shadow-[0_0_10px_#E5B899]"
            />
          );
        }

        if (theme.particleType === 'rose-petals') {
          return (
            <span
              key={p.id}
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: `${p.size + 4}px`,
                height: `${p.size + 1}px`,
              }}
              className="animate-float-slow absolute -top-6 rounded-tl-full rounded-br-full bg-gradient-to-br from-[#F9CED8] to-[#D47A92] opacity-35 rotate-45"
            />
          );
        }

        if (theme.particleType === 'botanical-leaves') {
          return (
            <span
              key={p.id}
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: `${p.size + 3}px`,
                height: `${p.size}px`,
              }}
              className="animate-float-slow absolute -top-6 rounded-tr-full rounded-bl-full bg-[#6B8567]/25 rotate-12"
            />
          );
        }

        if (theme.particleType === 'aegean-breeze') {
          return (
            <span
              key={p.id}
              style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
              className="animate-float-slow absolute -top-6 rounded-full border border-[#3B82F6]/30 bg-[#93C5FD]/15"
            />
          );
        }

        return null;
      })}
    </div>
  );
};
