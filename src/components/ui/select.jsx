import { cn } from 'cn'

// Native select styled to match the project's shadcn/ui form controls.
export function Select({ className, children, ...props }) {
  return (
    <select
      data-slot="select"
      className={cn(
        'flex h-10 w-full appearance-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-[#18251f] outline-none transition focus-visible:border-[#6d9d79] focus-visible:ring-4 focus-visible:ring-[#6d9d79]/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
