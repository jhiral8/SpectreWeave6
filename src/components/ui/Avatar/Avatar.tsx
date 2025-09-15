import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const Avatar = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => {
    const avatarClassName = cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className,
    )

    return <div className={avatarClassName} ref={ref} {...rest} />
  },
)

Avatar.displayName = 'Avatar'

export const AvatarImage = forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...rest }, ref) => {
    const imageClassName = cn('aspect-square h-full w-full', className)

    return <img className={imageClassName} ref={ref} {...rest} />
  },
)

AvatarImage.displayName = 'AvatarImage'

export const AvatarFallback = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => {
    const fallbackClassName = cn(
      'flex h-full w-full items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800',
      className,
    )

    return <div className={fallbackClassName} ref={ref} {...rest} />
  },
)

AvatarFallback.displayName = 'AvatarFallback'