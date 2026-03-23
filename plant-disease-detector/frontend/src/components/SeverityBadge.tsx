interface Props {
  severity: 'Low' | 'Medium' | 'High'
}

const config = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
}

export default function SeverityBadge({ severity }: Props) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config[severity]}`}>
      {severity} Severity
    </span>
  )
}
