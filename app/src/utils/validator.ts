/** 手机号正则 */
const PHONE_REG = /^1[3-9]\d{9}$/

/** 身份证号正则（18位） */
const ID_CARD_REG = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

/** URL 正则 */
const URL_REG = /^https?:\/\/.+/i

/**
 * 手机号校验
 * @param phone 手机号字符串
 */
export function isPhone(phone: string): boolean {
  return PHONE_REG.test(phone)
}

/**
 * 身份证号校验（18位）
 * @param idCard 身份证号字符串
 */
export function isIdCard(idCard: string): boolean {
  return ID_CARD_REG.test(idCard)
}

/**
 * 空值校验
 * @param value 任意值
 * @returns true 表示为空（null、undefined、空字符串、纯空白字符串、空数组）
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

/**
 * URL 校验
 * @param url URL 字符串
 */
export function isUrl(url: string): boolean {
  return URL_REG.test(url)
}
