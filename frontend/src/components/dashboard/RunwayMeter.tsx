import { motion, useReducedMotion } from 'framer-motion';
import type { CSSProperties } from 'react';

type RunwayMeterProps = {
  score: number;
  label: string;
  detail: string;
};

export function RunwayMeter({ score, label, detail }: RunwayMeterProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeScore = Math.max(0, Math.min(100, Number.isFinite(score) ? score : 0));

  return (
    <div className="runway-meter-shell">
      <motion.div
        className="runway-meter-ring"
        style={
          {
            '--meter-value': `${safeScore}%`
          } as CSSProperties
        }
        initial={prefersReducedMotion ? false : { rotate: -40, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      >
        <div className="runway-meter-core">
          <div className="runway-meter-value">{safeScore}</div>
          <div className="runway-meter-label">{label}</div>
        </div>
      </motion.div>
      <p className="runway-meter-detail">{detail}</p>
    </div>
  );
}
