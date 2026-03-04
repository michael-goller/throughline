interface Props {
  className?: string
}

export default function ClassificationMark({ className = '' }: Props) {
  return (
    <div
      className={`absolute bottom-4 right-6 text-text-muted text-xs font-normal ${className}`}
    >
      Classification: Avery Dennison - Confidential
    </div>
  )
}
