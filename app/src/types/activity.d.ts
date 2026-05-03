/** 活动 */
export interface Activity {
  id: number
  title: string
  category: string
  description: string
  coverImage: string
  startTime: string
  endTime: string
  location: string
  latitude: number
  longitude: number
  maxParticipants: number
  currentParticipants: number
  rewardPoints: number
  status: number
  organizerId: number
}

/** 活动报名记录 */
export interface ActivityRegistration {
  id: number
  activityId: number
  userId: number
  status: number
  remark: string
  createdAt: string
}

/** 活动签到记录 */
export interface ActivityCheckin {
  id: number
  activityId: number
  userId: number
  checkinType: string
  latitude: number
  longitude: number
  checkinTime: string
  verified: boolean
  pointsGranted: number
}

/** 相册项 */
export interface GalleryItem {
  id: number
  activityId: number
  mediaType: 'image' | 'video'
  fileUrl: string
  thumbnailUrl: string
  width: number
  height: number
  duration: number
  sortOrder: number
}
