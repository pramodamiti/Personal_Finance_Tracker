import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useThemeStore } from '../store/themeStore';

type TransitionMode = 'dark' | 'light' | null;

const stars = [
  { top: '5%', left: '8%', delay: '0s', width: '190px', duration: '2.8s' },
  { top: '12%', left: '16%', delay: '0.25s', width: '150px', duration: '2.5s' },
  { top: '3%', left: '28%', delay: '0.4s', width: '210px', duration: '3s' },
  { top: '18%', left: '36%', delay: '0.12s', width: '140px', duration: '2.4s' },
  { top: '9%', left: '44%', delay: '0.35s', width: '170px', duration: '2.7s' },
  { top: '22%', left: '52%', delay: '0.45s', width: '190px', duration: '2.9s' },
  { top: '6%', left: '60%', delay: '0.18s', width: '160px', duration: '2.6s' },
  { top: '26%', left: '68%', delay: '0.5s', width: '200px', duration: '3s' },
  { top: '14%', left: '74%', delay: '0.08s', width: '150px', duration: '2.5s' },
  { top: '4%', left: '80%', delay: '0.55s', width: '180px', duration: '2.8s' },
  { top: '20%', left: '86%', delay: '0.3s', width: '160px', duration: '2.6s' },
  { top: '10%', left: '90%', delay: '0.6s', width: '140px', duration: '2.4s' },
  { top: '24%', left: '12%', delay: '0.65s', width: '170px', duration: '2.7s' },
  { top: '2%', left: '52%', delay: '0.7s', width: '220px', duration: '3.1s' },
  { top: '16%', left: '4%', delay: '0.75s', width: '160px', duration: '2.6s' }
];

const birds = [
  { top: '28%', left: '48%', delay: '0.12s' },
  { top: '34%', left: '56%', delay: '0.26s' },
  { top: '24%', left: '64%', delay: '0.4s' },
  { top: '38%', left: '52%', delay: '0.2s' },
  { top: '30%', left: '72%', delay: '0.48s' },
  { top: '42%', left: '60%', delay: '0.34s' },
  { top: '32%', left: '80%', delay: '0.6s' }
];

export function ThemeTransition() {
  const theme = useThemeStore((s) => s.theme);
  const prefersReducedMotion = useReducedMotion();
  const previousTheme = useRef(theme);
  const [mode, setMode] = useState<TransitionMode>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      previousTheme.current = theme;
      return;
    }

    if (previousTheme.current !== theme) {
      setMode(theme);
      const timeout = window.setTimeout(() => setMode(null), 4200);
      previousTheme.current = theme;
      return () => window.clearTimeout(timeout);
    }

    previousTheme.current = theme;
    return;
  }, [theme, prefersReducedMotion]);

  if (!mode) {
    return null;
  }

  return (
    <div className={`theme-transition ${mode === 'dark' ? 'theme-transition-dark' : 'theme-transition-light'}`}>
      {mode === 'dark' ? (
        <>
          {stars.map((star, index) => (
            <span
              key={`star-${index}`}
              className="theme-star"
              style={{
                top: star.top,
                left: star.left,
                width: star.width,
                animationDelay: star.delay,
                animationDuration: star.duration
              }}
            />
          ))}
        </>
      ) : (
        <>
          <div className="theme-sun" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <span
                key={`ray-${index}`}
                className="theme-sun-ray"
                style={
                  {
                    '--ray-rotate': `${index * 45}deg`,
                    '--ray-length': index % 2 === 0 ? '18px' : '10px'
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          {birds.map((bird, index) => (
            <span
              key={`bird-${index}`}
              className="theme-bird"
              style={{ top: bird.top, left: bird.left, animationDelay: bird.delay }}
            />
          ))}
        </>
      )}
    </div>
  );
}
