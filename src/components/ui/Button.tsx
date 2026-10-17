import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

/**
 * The only button in the application. Variants are enumerated here so no page
 * can fork the styling; if a new look is needed it becomes a variant, not a
 * one-off className.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'inverse' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'
export type ButtonShape = 'default' | 'pill'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary border border-primary shadow-tile hover:bg-primary-hover',
  secondary:
    'bg-card text-foreground border border-border hover:bg-surface hover:border-border-strong',
  /* Tertiary actions: the brand wash, no outline, no shadow. */
  soft: 'bg-primary-subtle text-primary border border-primary-line hover:border-primary',
  ghost: 'bg-transparent text-foreground border border-transparent hover:bg-surface',
  /* For a control sitting on a filled `featured` tile, where `primary` would
     vanish into the surface behind it. */
  inverse: 'bg-on-featured text-featured border border-on-featured hover:bg-on-featured-muted',
  destructive:
    'bg-card text-destructive border border-border hover:bg-destructive hover:text-on-destructive hover:border-destructive',
}

/* Sizes keep every control at or above the 44px touch target except `sm`,
   which is only used inside dense admin tables alongside other controls. */
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-11 w-11 p-0',
}

const SHAPES: Record<ButtonShape, string> = {
  default: 'rounded-md',
  pill: 'rounded-full',
}

const BASE =
  'inline-flex items-center justify-center font-medium cursor-pointer ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-200 select-none ' +
  'disabled:pointer-events-none disabled:opacity-50'

function classes(variant: ButtonVariant, size: ButtonSize, shape: ButtonShape, className?: string) {
  return cn(BASE, SHAPES[shape], VARIANTS[variant], SIZES[size], className)
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
}

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={classes(variant, size, shape, className)} {...props} />
}

/** Same visual language as `Button`, for in-app navigation. */
export function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className,
  children,
  ...rest
}: {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  return (
    <Link to={to} className={classes(variant, size, shape, className)} {...rest}>
      {children}
    </Link>
  )
}

/** Same visual language as `Button`, for links that leave the application. */
export function ButtonExternal({
  href,
  variant = 'primary',
  size = 'md',
  shape = 'default',
  className,
  children,
  onClick,
}: {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
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
      className={classes(variant, size, shape, className)}
    >
      {children}
    </a>
  )
}
