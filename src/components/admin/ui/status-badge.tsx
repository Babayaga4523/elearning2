'use client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig = {
  COMPLETED:   { label: 'Selesai',     class: 'bg-[#ECFDF3] text-[#027A48] border-none' },
  FAILED:      { label: 'Gagal',       class: 'bg-[#FEF3F2] text-[#B42318] border-none' },
  IN_PROGRESS: { label: 'Berlangsung', class: 'bg-[#F0F9FF] text-[#026AA2] border-none' },
  ENROLLED:    { label: 'Terdaftar',   class: 'bg-[#FFFAEB] text-[#B54708] border-none' },
  PENDING:     { label: 'Menunggu',    class: 'bg-[#F8F9FB] text-[#475467] border-none' },
  REJECTED:    { label: 'Ditolak',     class: 'bg-[#FEF3F2] text-[#B42318] border-none' },
  PUBLISHED:   { label: 'Aktif',       class: 'bg-[#ECFDF3] text-[#027A48] border-none' },
  DRAFT:       { label: 'Draft',       class: 'bg-[#FFFAEB] text-[#B54708] border-none' },
}

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status] ?? { label: status, class: 'bg-[#F8F9FB] text-[#475467] border-none' }
  return (
    <Badge variant="outline" className={cn('text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md font-["DM_Sans"] shadow-none', config.class)}>
      {config.label}
    </Badge>
  )
}
