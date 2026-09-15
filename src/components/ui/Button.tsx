import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

/**
 * The only button in the application. Variants are enumerated here so no page
 * can fork the styling; if a new look is needed it becomes a variant, not a
 * one-off className.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary border border-primary hover:bg-primary-hover',
  secondary: 'bg-card text-foreground border border-border hover:bg-muted',
  ghost: 'bg-transparent text-foreground border border-transparent hover:bg-muted',
  destructive:
    'bg-card text-destructive border border-border hover:bg-destructive hover:text-on-destructive hover:border-destructive',
}

/* Sizes keep every control at or above the 44px touch target except `sm`,
   which is only used inside dense admin tables alongside other controls. */
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const BASE =
  'inline-flex items-center justify-center rounded-md font-medium cursor-pointer ' +
  'transition-colors duration-200 select-none ' +
  'disabled:pointer-events-none disabled:opacity-50'

function classes(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={classes(variant, size, className)} {...props} />
}

/** Same visual language as `Button`, for in-app navigation. */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={classes(variant, size, className)}>
      {children}
    </Link>
  )
}

/** Same visual language as `Button`, for links that leave the application. */
export function ButtonExternal({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  onClick,
}: {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={classes(variant, size, className)}
    >
      {children}
    </a>
  )
}
