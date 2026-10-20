import { cn } from 'cn'

// Small semantic table primitives following the shadcn/ui Table API.
export function Table({ className, ...props }) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-stone-100', className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return <tr className={cn('border-b border-stone-100 transition-colors hover:bg-stone-50/70', className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return <th className={cn('h-11 px-4 text-left align-middle text-xs font-semibold text-stone-500', className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td className={cn('px-4 py-3.5 align-middle text-sm', className)} {...props} />
}
