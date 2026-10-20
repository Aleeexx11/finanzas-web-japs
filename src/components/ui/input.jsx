import { cn } from 'cn'

// Shared shadcn-style input used by filters and the expense editor.
export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-10 w-full min-w-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-[#18251f] outline-none transition placeholder:text-stone-400 focus-visible:border-[#6d9d79] focus-visible:ring-4 focus-visible:ring-[#6d9d79]/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
