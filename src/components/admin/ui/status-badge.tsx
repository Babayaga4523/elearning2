'use client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig = {
  COMPLETED:   { label: 'Selesai',     class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED:      { label: 'Gagal',       class: 'bg-rose-50 text-rose-700 border-rose-200' },
  IN_PROGRESS: { label: 'Berlangsung', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ENROLLED:    { label: 'Terdaftar',   class: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING:     { label: 'Menunggu',    class: 'bg-slate-50 text-slate-600 border-slate-200' },
  REJECTED:    { label: 'Ditolak',     class: 'bg-rose-100 text-rose-800 border-rose-300' },
  PUBLISHED:   { label: 'Aktif',       class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DRAFT:       { label: 'Draft',       class: 'bg-slate-50 text-slate-600 border-slate-200' },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status] ?? { label: status, class: 'bg-slate-50 text-slate-600' }
  return (
    <Badge variant="outline" className={cn('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md', config.class)}>
      {config.label}
    </Badge>
  )
}
