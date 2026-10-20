import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cn } from 'cn'

// Dialog primitives share the Base UI behavior and shadcn-style presentation.
export const Dialog = DialogPrimitive

export function DialogContent({ className, children, ...props }) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/35 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-6 text-[#18251f] shadow-xl outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('mb-5 space-y-1.5', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <Dialog.Title className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <Dialog.Description className={cn('text-sm leading-6 text-stone-500', className)} {...props} />
}
