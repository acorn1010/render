import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"
import {PropsWithChildren} from "react";

type InnerAvatarProps =
    Pick<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>, 'className' | 'onClick'> & {
  src?: string,
};

type AvatarProps = PropsWithChildren<InnerAvatarProps>;

const avatarStyle = cn`
  relative
  flex
  h-10
  w-10
  shrink-0
  overflow-hidden
  rounded-full

  focus:outline-none
  focus:ring-2
  focus:ring-slate-400
  focus:ring-offset-2
`;

export const Avatar = React.forwardRef<React.ElementRef<typeof AvatarPrimitive.Root>, AvatarProps>((props, ref) => {
  const {children, className, src, ...rest} = props;
  return (
      <AvatarPrimitive.Root ref={ref} className={cn(avatarStyle, className)} tabIndex={rest.onClick && 0} {...rest}>
        <AvatarImage src={src} />
        {children && <AvatarFallback>{children}</AvatarFallback>}
      </AvatarPrimitive.Root>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn("aspect-square h-full w-full", className)}
        {...props}
    />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700",
            className
        )}
        {...props}
    />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName
