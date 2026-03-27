import clsx from 'clsx';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
};

export function MotionButton({
  children,
  className,
  type = 'button',
  variant = 'primary',
  ...props
}: MotionButtonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      className={clsx('transform-gpu will-change-transform', variant === 'primary' ? 'btn-primary' : 'btn-secondary', className)}
      whileHover={
        prefersReducedMotion
          ? undefined
          : {
              scale: 1.02,
              y: -4
            }
      }
      whileTap={
        prefersReducedMotion
          ? undefined
          : {
              scale: 0.98
            }
      }
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
