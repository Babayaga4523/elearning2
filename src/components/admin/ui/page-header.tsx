interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  badge?: string
}

export function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between font-['DM_Sans']">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight font-['Lexend_Deca']">
            {title}
          </h1>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF3] text-[#027A48]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[13px] sm:text-sm text-[#475467] font-medium leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
