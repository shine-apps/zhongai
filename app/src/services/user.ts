import { get, post, patch } from '@/utils/request'
import type { UserInfo } from '@/types/user'

/**
 * 获取当前用户信息
 */
export function getMyInfo(): Promise<UserInfo> {
  return get<UserInfo>('/user/me')
}

/**
 * 更新个人信息
 * @param data 要更新的字段
 */
export function updateMyInfo(data: Partial<Pick<UserInfo, 'nickname' | 'avatarUrl' | 'realName'>>): Promise<UserInfo> {
  return patch<UserInfo>('/user/me', data)
}

/**
 * 提交实名认证
 * @param realName 真实姓名
 * @param idCardNo 身份证号
 */
export function submitRealName(realName: string, idCardNo: string): Promise<void> {
  return post<void>('/user/realname', { realName, idCardNo })
}
