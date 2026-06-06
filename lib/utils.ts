const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDate(dateStr: string, long = false): string {
  const d = new Date(dateStr)
  return long
    ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
    : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
