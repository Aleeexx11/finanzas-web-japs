import { cn } from 'cn'

// Shared shadcn-style textarea for multiline form fields.
export function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-20 w-full resize-y rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-[#18251f] outline-none transition placeholder:text-stone-400 focus-visible:border-[#6d9d79] focus-visible:ring-4 focus-visible:ring-[#6d9d79]/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-400',
        className,
      )}
      {...props}
    />
  )
}
