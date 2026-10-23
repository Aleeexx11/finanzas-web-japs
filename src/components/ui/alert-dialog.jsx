import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog'
import { cn } from 'cn'

// Confirmation dialog keeps destructive actions explicit and keyboard-accessible.
export const AlertDialog = AlertDialogPrimitive

export function AlertDialogContent({ className, children, ...props }) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/35 data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <AlertDialog.Popup
        className={cn(
          'financial-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-stone-200 bg-white p-6 text-[#18251f] shadow-xl outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialog.Popup>
    </AlertDialog.Portal>
  )
}

export function AlertDialogTitle({ className, ...props }) {
  return <AlertDialog.Title className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
}

export function AlertDialogDescription({ className, ...props }) {
  return <AlertDialog.Description className={cn('mt-2 text-sm leading-6 text-stone-500', className)} {...props} />
}
