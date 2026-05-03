import { get, post, del } from '@/utils/request'
import type { Activity, ActivityRegistration, ActivityCheckin, GalleryItem } from '@/types/activity'
import type { PaginatedData } from '@/types/api'

/**
 * 活动列表
 * @param params 查询参数（page, pageSize, category, status 等）
 */
export function getActivityList(params?: Record<string, any>): Promise<PaginatedData<Activity>> {
  return get<PaginatedData<Activity>>('/activities', params)
}

/**
 * 活动详情
 * @param id 活动 ID
 */
export function getActivityDetail(id: number): Promise<Activity> {
  return get<Activity>(`/activities/${id}`)
}

/**
 * 报名活动
 * @param activityId 活动 ID
 */
export function registerActivity(activityId: number): Promise<ActivityRegistration> {
  return post<ActivityRegistration>(`/activities/${activityId}/register`)
}

/**
 * 取消报名
 * @param activityId 活动 ID
 */
export function cancelRegistration(activityId: number): Promise<void> {
  return del<void>(`/activities/${activityId}/register`)
}

/**
 * GPS 签到
 * @param activityId 活动 ID
 * @param lat 纬度
 * @param lng 经度
 */
export function checkin(activityId: number, lat: number, lng: number): Promise<ActivityCheckin> {
  return post<ActivityCheckin>(`/activities/${activityId}/checkin`, { latitude: lat, longitude: lng })
}

/**
 * 活动相册
 * @param activityId 活动 ID
 * @param params 分页参数
 */
export function getActivityGallery(activityId: number, params?: Record<string, any>): Promise<PaginatedData<GalleryItem>> {
  return get<PaginatedData<GalleryItem>>(`/activities/${activityId}/gallery`, params)
}
