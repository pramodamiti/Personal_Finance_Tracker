import clsx from 'clsx';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type FinanceCardProps = {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  layoutId?: string;
  reveal?: boolean;
} & Omit<HTMLMotionProps<'article'>, 'children'>;


export function FinanceCard({
  children,
  className,
  interactive = true,
  layoutId,
  reveal = true,
  ...props
}: FinanceCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      layout={interactive}
      layoutId={layoutId}
      initial={
        reveal
          ? prefersReducedMotion
            ? { opacity: 0.9 }
            : { opacity: 0, y: 24, scale: 0.985 }
          : false
      }
      animate={
        reveal
          ? prefersReducedMotion
            ? { opacity: 1 }
            : { opacity: 1, y: 0, scale: 1 }
          : undefined
      }
      className={clsx(
        'card transform-gpu will-change-transform transition-all duration-500 ease-in-out',
        interactive &&
          'cursor-pointer shadow-sm hover:shadow-premium hover:dark:border-white/20',
        className
      )}
      whileHover={
        interactive && !prefersReducedMotion
          ? {
              scale: 1.025,
              y: -8,
              rotateX: 1.5
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
        damping: 20,
        mass: 0.9
      }}
      {...props}
    >
      {children}
    </motion.article>
  );
}
