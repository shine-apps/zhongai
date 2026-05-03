// ============================================================
// 通用类型定义
// ============================================================

/** 用户角色 */
export type UserRole = 'admin' | 'leader' | 'member'

/** 用户状态 */
export type UserStatus = 'active' | 'inactive' | 'banned'

/** 活动分类 */
export type ActivityCategory =
  | 'meeting'
  | 'training'
  | 'team_building'
  | 'charity'
  | 'competition'
  | 'other'

/** 活动状态 */
export type ActivityStatus =
  | 'draft'
  | 'published'
  | 'ongoing'
  | 'completed'
  | 'cancelled'

/** 报名状态 */
export type RegistrationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'

/** 签到类型 */
export type CheckinType = 'qrcode' | 'location' | 'manual'

/** 捐赠类型 */
export type DonationType =
  | 'money'
  | 'goods'
  | 'service'

/** 审核状态 */
export type ReviewStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

/** 积分类型 */
export type PointType =
  | 'activity'
  | 'donation'
  | 'checkin'
  | 'task'
  | 'bonus'
  | 'deduction'

/** 积分变动类型 */
export type PointChangeType = 'earn' | 'spend' | 'expire' | 'adjust'

/** 积分来源类型 */
export type PointSourceType =
  | 'activity_checkin'
  | 'activity_organize'
  | 'donation'
  | 'task_complete'
  | 'admin_grant'
  | 'admin_deduct'
  | 'sign_in'
  | 'other'

/** 市场帖子类型 */
export type MarketPostType =
  | 'sell'
  | 'buy'
  | 'exchange'
  | 'free'

/** 商品类型 */
export type ProductType =
  | 'physical'
  | 'virtual'
  | 'service'

/** 订单状态 */
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded'

// ============================================================
// 接口定义
// ============================================================

/** JWT Token 载荷 */
export interface AuthUser {
  id: number
  phone?: string
  openid?: string
  role: UserRole
  status: UserStatus
}

/** H3 Event Context 扩展 — 添加 auth 属性 */
export interface H3EventContext {
  auth?: AuthUser
}

/** 分页查询参数 */
export interface PaginationQuery {
  page?: number | string
  pageSize?: number | string
}

/** 分页结果元数据 */
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 微信 code2Session 返回结果 */
export interface WechatSessionResult {
  openid: string
  unionid?: string
  session_key: string
}

/** 文件校验结果 */
export interface FileValidationResult {
  valid: boolean
  message?: string
}
