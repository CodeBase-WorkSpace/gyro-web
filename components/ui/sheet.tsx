"use client"

import * as React from "react"
import {Dialog as DialogPrimitive} from "@base-ui/react/dialog"
import {cva, type VariantProps} from "class-variance-authority"
import {XIcon} from "lucide-react"

import {buttonVariants} from "@/components/ui/button"
import {cn} from "@/lib/utils"

const Sheet = DialogPrimitive.Root

const SheetTrigger = DialogPrimitive.Trigger

const SheetPortal = DialogPrimitive.Portal

const SheetClose = DialogPrimitive.Close

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-150 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border bg-background text-foreground shadow-2xl outline-none transition-transform duration-200 ease-out motion-reduce:transition-none",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 max-h-[90svh] border-b data-[ending-style]:-translate-y-full data-[starting-style]:-translate-y-full",
        bottom:
          "inset-x-0 bottom-0 h-svh max-h-svh rounded-t-3xl border-t data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
        left: "inset-y-0 left-0 h-svh w-3/4 max-w-md border-r data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full sm:max-w-lg",
        right:
          "inset-y-0 right-0 h-svh w-3/4 max-w-md border-l data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full sm:max-w-lg",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

function SheetContent({
  side = "right",
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup> &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean
  }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            aria-label="بستن"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-sm" }),
              "absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] [&_svg]:m-0"
            )}
          >
            <XIcon />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 text-right", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-lg font-semibold leading-none", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
