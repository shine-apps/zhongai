/** 轮播图 */
export interface Banner {
  id: number
  title: string
  imageUrl: string
  linkType: 'activity' | 'article' | 'url' | 'none'
  linkValue: string
  sortOrder: number
}
