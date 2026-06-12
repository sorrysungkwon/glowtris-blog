export default function MI({ icon, size = 14 }: { icon: string; size?: number }) {
  return (
    <span
      className="material-icons-round"
      style={{ fontSize: `${size}px`, verticalAlign: 'middle', lineHeight: 1, userSelect: 'none' }}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}
