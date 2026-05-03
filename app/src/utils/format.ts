/**
 * 日期格式化
 * @param date 日期（Date 对象、时间戳或日期字符串）
 * @param format 格式模板，默认 'YYYY-MM-DD HH:mm'
 */
export function formatDate(date: Date | number | string, format: string = 'YYYY-MM-DD HH:mm'): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 金额格式化
 * @param amount 金额数值
 * @returns 带 ¥ 符号、保留2位小数的字符串
 */
export function formatMoney(amount: number): string {
  if (amount === null || amount === undefined) return '¥0.00'
  return '¥' + Number(amount).toFixed(2)
}

/**
 * 积分格式化
 * @param points 积分数值
 * @param type 类型：'earn' 获取（加 "+" 前缀），其他不加工
 */
export function formatPoints(points: number, type?: 'earn' | 'spend'): string {
  if (points === null || points === undefined) return '0'
  if (type === 'earn') {
    return '+' + points
  }
  return String(points)
}

/**
 * 时长格式化
 * @param seconds 秒数
 * @returns 格式化字符串，如 "1:32" 表示1分32秒，超过1小时显示 "1:32:00"
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')

  if (h > 0) {
    return `${h}:${mm}:${ss}`
  }
  return `${m}:${ss}`
}

/**
 * 距离格式化
 * @param meters 米数
 * @returns 格式化字符串，如 "50m"、"1.2km"
 */
export function formatDistance(meters: number): string {
  if (meters === null || meters === undefined) return '0m'

  if (meters < 1000) {
    return Math.round(meters) + 'm'
  }
  return (meters / 1000).toFixed(1) + 'km'
}
