import { format } from 'date-fns'

export function useFormatDate() {
  return (date: string | Date | null | undefined, pattern = 'yyyy-MM-dd HH:mm'): string => {
    if (!date) return ''
    return format(new Date(date), pattern)
  }
}

export const formatDate = (date: string | Date | null | undefined, pattern = 'yyyy-MM-dd HH:mm'): string => {
  if (!date) return ''
  return format(new Date(date), pattern)
}
