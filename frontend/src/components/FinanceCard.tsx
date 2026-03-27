import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import type { HTMLAttributes, ReactNode } from 'react';

type FinanceCardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  layoutId?: string;
} & HTMLAttributes<HTMLElement>;

export function FinanceCard({
  children,
  className,
  interactive = false,
  layoutId,
  ...props
}: FinanceCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      layout={interactive}
      layoutId={layoutId}
      className={clsx(
        'card transform-gpu will-change-transform transition-all duration-500 ease-in-out',
        interactive &&
          'cursor-pointer shadow-sm hover:-translate-y-1 hover:shadow-premium hover:dark:border-white/20',
        className
      )}
      whileHover={
        interactive && !prefersReducedMotion
          ? {
              scale: 1.02,
              y: -4
            }
          : undefined
      }
      whileTap={
        interactive && !prefersReducedMotion
          ? {
              scale: 0.98
            }
          : undefined
      }
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20
      }}
      {...props}
    >
      {children}
    </motion.article>
  );
}
