interface Props {
  severity: string
}

const config: Record<string, { bg: string; dot: string; label: string }> = {
  None:   { bg: 'bg-gray-100 text-gray-600 border-gray-200',     dot: 'bg-gray-400',    label: 'None'   },
  Low:    { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Low'    },
  Medium: { bg: 'bg-amber-100 text-amber-700 border-amber-200',  dot: 'bg-amber-500',   label: 'Medium' },
  High:   { bg: 'bg-red-100 text-red-700 border-red-200',        dot: 'bg-red-500',     label: 'High'   },
}

export default function SeverityBadge({ severity }: Props) {
  const c = config[severity] ?? config.Medium
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label} Severity
    </span>
  )
}
