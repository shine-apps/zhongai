// ============================================================
// 商城服务 — 商品管理、订单管理、积分兑换
// ============================================================

import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm'
import { db } from '../db'
import { mallProducts, mallOrders, mallOrderItems, users, pointAccounts, pointTransactions } from '../db/schema'
import { parsePagination } from '../utils/pagination'
import { v4 as uuidv4 } from 'uuid'

// ============================================================
// 商品管理
// ============================================================

/** 商品列表（公开，status='active'） */
export async function getProductList(params: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(params)

  const conditions = [eq(mallProducts.status, 'active')]

  if (params.keyword) {
    conditions.push(sql`${mallProducts.name} ILIKE ${`%${params.keyword}%`}`)
  }

  if (params.productType) {
    conditions.push(eq(mallProducts.productType, params.productType as string))
  }

  if (params.isFeatured !== undefined && params.isFeatured !== null && params.isFeatured !== '') {
    conditions.push(eq(mallProducts.isFeatured, params.isFeatured === 'true' || params.isFeatured === true))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(mallProducts)
      .where(whereClause)
      .orderBy(asc(mallProducts.sortOrder), desc(mallProducts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mallProducts)
      .where(whereClause),
  ])

  const total = countResult[0]?.count || 0

  return {
    list,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

/** 商品详情 */
export async function getProductById(id: string) {
  const [product] = await db
    .select()
    .from(mallProducts)
    .where(eq(mallProducts.id, id))
    .limit(1)

  if (!product) {
    throw createError({
      statusCode: 404,
      message: '商品不存在',
    })
  }

  return product
}

/** 创建商品（管理端） */
export async function createProduct(data: Record<string, any>) {
  const [product] = await db
    .insert(mallProducts)
    .values({
      name: data.name,
      description: data.description || null,
      coverImage: data.coverImage || null,
      images: data.images || [],
      productType: data.productType,
      activityPointsPrice: data.activityPointsPrice,
      donationPointsPrice: data.donationPointsPrice,
      allowedPointTypes: data.allowedPointTypes || ['activity', 'donation'],
      stock: data.stock ?? -1,
      stockRemaining: data.stock ?? -1,
      isFeatured: data.isFeatured ?? false,
      sortOrder: data.sortOrder ?? 0,
      status: data.status || 'active',
    })
    .returning()

  return product
}

/** 更新商品（管理端） */
export async function updateProduct(id: string, data: Record<string, any>) {
  const [existing] = await db
    .select()
    .from(mallProducts)
    .where(eq(mallProducts.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '商品不存在',
    })
  }

  const forbiddenFields = ['id', 'createdAt']
  const updateData: Record<string, any> = { updatedAt: new Date() }

  for (const [key, value] of Object.entries(data)) {
    if (!forbiddenFields.includes(key) && value !== undefined) {
      updateData[key] = value
    }
  }

  const [updated] = await db
    .update(mallProducts)
    .set(updateData)
    .where(eq(mallProducts.id, id))
    .returning()

  return updated
}

/** 删除/下架商品（管理端，设status='inactive'） */
export async function deleteProduct(id: string) {
  const [existing] = await db
    .select()
    .from(mallProducts)
    .where(eq(mallProducts.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '商品不存在',
    })
  }

  const [updated] = await db
    .update(mallProducts)
    .set({ status: 'inactive', updatedAt: new Date() })
    .where(eq(mallProducts.id, id))
    .returning()

  return updated
}

/** 管理端商品列表（所有状态） */
export async function getAllProducts(params: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(params)

  const conditions = []

  if (params.keyword) {
    conditions.push(sql`${mallProducts.name} ILIKE ${`%${params.keyword}%`}`)
  }

  if (params.productType) {
    conditions.push(eq(mallProducts.productType, params.productType as string))
  }

  if (params.status) {
    conditions.push(eq(mallProducts.status, params.status as string))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(mallProducts)
      .where(whereClause)
      .orderBy(asc(mallProducts.sortOrder), desc(mallProducts.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mallProducts)
      .where(whereClause),
  ])

  const total = countResult[0]?.count || 0

  return {
    list,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ============================================================
// 订单管理
// ============================================================

/** 生成订单号：ZH + 时间戳 + 随机4位 */
function generateOrderNo(): string {
  const timestamp = Date.now().toString().slice(-10)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ZH${timestamp}${random}`
}

/** 创建兑换订单 */
export async function createOrder(userId: string, data: Record<string, any>) {
  const { items, shippingName, shippingPhone, shippingAddress, remark } = data

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      message: '订单商品不能为空',
    })
  }

  if (!shippingName || !shippingPhone || !shippingAddress) {
    throw createError({
      statusCode: 400,
      message: '收货信息不完整',
    })
  }

  // 1. 查询所有商品，验证存在且 active
  const productIds = items.map((item: any) => item.productId)
  const products = await db
    .select()
    .from(mallProducts)
    .where(inArray(mallProducts.id, productIds))

  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw createError({
        statusCode: 404,
        message: `商品不存在: ${item.productId}`,
      })
    }
    if (product.status !== 'active') {
      throw createError({
        statusCode: 400,
        message: `商品已下架: ${product.name}`,
      })
    }
    // 验证 pointTypeUsed 在 allowedPointTypes 中
    if (!product.allowedPointTypes || !product.allowedPointTypes.includes(item.pointTypeUsed)) {
      throw createError({
        statusCode: 400,
        message: `商品 "${product.name}" 不支持使用 ${item.pointTypeUsed} 积分兑换`,
      })
    }
    // 验证库存
    if (product.stockRemaining !== -1 && product.stockRemaining! < item.quantity) {
      throw createError({
        statusCode: 400,
        message: `商品 "${product.name}" 库存不足`,
      })
    }
  }

  // 2. 计算总积分消耗
  let totalActivityPoints = 0
  let totalDonationPoints = 0
  const orderItemsData: any[] = []

  for (const item of items) {
    const product = productMap.get(item.productId)!
    const activityCost = item.pointTypeUsed === 'activity'
      ? product.activityPointsPrice * item.quantity
      : 0
    const donationCost = item.pointTypeUsed === 'donation'
      ? product.donationPointsPrice * item.quantity
      : 0

    totalActivityPoints += activityCost
    totalDonationPoints += donationCost

    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      productImage: product.coverImage,
      quantity: item.quantity,
      activityPointsCost: activityCost,
      donationPointsCost: donationCost,
      pointTypeUsed: item.pointTypeUsed,
    })
  }

  // 3. 验证用户积分余额
  const [account] = await db
    .select()
    .from(pointAccounts)
    .where(eq(pointAccounts.userId, userId))
    .limit(1)

  if (!account) {
    throw createError({
      statusCode: 400,
      message: '积分账户不存在，请先参与活动获取积分',
    })
  }

  if ((account.activityPointsBalance || 0) < totalActivityPoints) {
    throw createError({
      statusCode: 400,
      message: `活动积分余额不足，需要 ${totalActivityPoints}，当前余额 ${account.activityPointsBalance || 0}`,
    })
  }

  if ((account.donationPointsBalance || 0) < totalDonationPoints) {
    throw createError({
      statusCode: 400,
      message: `捐助积分余额不足，需要 ${totalDonationPoints}，当前余额 ${account.donationPointsBalance || 0}`,
    })
  }

  // 4. 在数据库事务中完成所有操作
  const order = await db.transaction(async (tx) => {
    const orderNo = generateOrderNo()

    // a. 扣减活动积分
    if (totalActivityPoints > 0) {
      const [updatedAccount] = await tx
        .update(pointAccounts)
        .set({
          activityPointsBalance: sql`${pointAccounts.activityPointsBalance} - ${totalActivityPoints}`,
          updatedAt: new Date(),
        })
        .where(eq(pointAccounts.userId, userId))
        .returning()

      // 插入积分流水
      await tx.insert(pointTransactions).values({
        userId,
        pointType: 'activity',
        changeType: 'spend',
        amount: -totalActivityPoints,
        balanceAfter: updatedAccount.activityPointsBalance!,
        sourceType: 'mall_order',
        sourceId: orderNo,
        description: `商城兑换 - 订单 ${orderNo}`,
      })
    }

    // b. 扣减捐助积分
    if (totalDonationPoints > 0) {
      const [updatedAccount] = await tx
        .update(pointAccounts)
        .set({
          donationPointsBalance: sql`${pointAccounts.donationPointsBalance} - ${totalDonationPoints}`,
          updatedAt: new Date(),
        })
        .where(eq(pointAccounts.userId, userId))
        .returning()

      // 插入积分流水
      await tx.insert(pointTransactions).values({
        userId,
        pointType: 'donation',
        changeType: 'spend',
        amount: -totalDonationPoints,
        balanceAfter: updatedAccount.donationPointsBalance!,
        sourceType: 'mall_order',
        sourceId: orderNo,
        description: `商城兑换 - 订单 ${orderNo}`,
      })
    }

    // c. 创建订单
    const [newOrder] = await tx
      .insert(mallOrders)
      .values({
        orderNo,
        userId,
        totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
        activityPointsUsed: totalActivityPoints,
        donationPointsUsed: totalDonationPoints,
        status: 'pending',
        shippingName,
        shippingPhone,
        shippingAddress,
        remark: remark || null,
      })
      .returning()

    // d. 创建订单明细
    for (const itemData of orderItemsData) {
      await tx.insert(mallOrderItems).values({
        orderId: newOrder.id,
        ...itemData,
      })
    }

    // e. 更新商品库存
    for (const item of items) {
      const product = productMap.get(item.productId)!
      if (product.stockRemaining !== -1) {
        await tx
          .update(mallProducts)
          .set({
            stockRemaining: sql`${mallProducts.stockRemaining} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(mallProducts.id, item.productId))
      }
    }

    return newOrder
  })

  return order
}

/** 管理端订单列表 */
export async function getOrderList(params: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(params)

  const conditions = []

  if (params.status) {
    conditions.push(eq(mallOrders.status, params.status as string))
  }

  if (params.keyword) {
    conditions.push(sql`(
      ${mallOrders.orderNo} ILIKE ${`%${params.keyword}%`}
      OR ${users.nickname} ILIKE ${`%${params.keyword}%`}
      OR ${mallOrders.shippingName} ILIKE ${`%${params.keyword}%`}
    )`)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [list, countResult] = await Promise.all([
    db
      .select({
        id: mallOrders.id,
        orderNo: mallOrders.orderNo,
        userId: mallOrders.userId,
        userNickname: users.nickname,
        totalItems: mallOrders.totalItems,
        activityPointsUsed: mallOrders.activityPointsUsed,
        donationPointsUsed: mallOrders.donationPointsUsed,
        status: mallOrders.status,
        shippingName: mallOrders.shippingName,
        shippingPhone: mallOrders.shippingPhone,
        shippingAddress: mallOrders.shippingAddress,
        remark: mallOrders.remark,
        adminRemark: mallOrders.adminRemark,
        createdAt: mallOrders.createdAt,
        updatedAt: mallOrders.updatedAt,
      })
      .from(mallOrders)
      .leftJoin(users, eq(mallOrders.userId, users.id))
      .where(whereClause)
      .orderBy(desc(mallOrders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mallOrders)
      .leftJoin(users, eq(mallOrders.userId, users.id))
      .where(whereClause),
  ])

  const total = countResult[0]?.count || 0

  return {
    list,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

/** 我的订单 */
export async function getMyOrders(userId: string, params: Record<string, any>) {
  const { page, pageSize, limit, offset } = parsePagination(params)

  const conditions = [eq(mallOrders.userId, userId)]

  if (params.status) {
    conditions.push(eq(mallOrders.status, params.status as string))
  }

  const whereClause = and(...conditions)

  const [list, countResult] = await Promise.all([
    db
      .select()
      .from(mallOrders)
      .where(whereClause)
      .orderBy(desc(mallOrders.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(mallOrders)
      .where(whereClause),
  ])

  const total = countResult[0]?.count || 0

  return {
    list,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

/** 订单详情（含订单明细） */
export async function getOrderById(id: string) {
  const [order] = await db
    .select()
    .from(mallOrders)
    .where(eq(mallOrders.id, id))
    .limit(1)

  if (!order) {
    throw createError({
      statusCode: 404,
      message: '订单不存在',
    })
  }

  // 查询订单明细
  const orderItems = await db
    .select()
    .from(mallOrderItems)
    .where(eq(mallOrderItems.orderId, id))

  return {
    ...order,
    items: orderItems,
  }
}

/** 更新订单状态 */
export async function updateOrderStatus(id: string, status: string, adminRemark?: string) {
  const [existing] = await db
    .select()
    .from(mallOrders)
    .where(eq(mallOrders.id, id))
    .limit(1)

  if (!existing) {
    throw createError({
      statusCode: 404,
      message: '订单不存在',
    })
  }

  // 状态流转校验
  const validTransitions: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  }

  const allowedNext = validTransitions[existing.status] || []
  if (!allowedNext.includes(status)) {
    throw createError({
      statusCode: 400,
      message: `订单状态不允许从 "${existing.status}" 变更为 "${status}"`,
    })
  }

  // 取消订单时退还积分
  if (status === 'cancelled') {
    await db.transaction(async (tx) => {
      // 退还活动积分
      if (existing.activityPointsUsed && existing.activityPointsUsed > 0) {
        const [updatedAccount] = await tx
          .update(pointAccounts)
          .set({
            activityPointsBalance: sql`${pointAccounts.activityPointsBalance} + ${existing.activityPointsUsed}`,
            updatedAt: new Date(),
          })
          .where(eq(pointAccounts.userId, existing.userId))
          .returning()

        await tx.insert(pointTransactions).values({
          userId: existing.userId,
          pointType: 'activity',
          changeType: 'earn',
          amount: existing.activityPointsUsed,
          balanceAfter: updatedAccount.activityPointsBalance!,
          sourceType: 'mall_order_cancel',
          sourceId: existing.orderNo,
          description: `订单取消退还积分 - ${existing.orderNo}`,
        })
      }

      // 退还捐助积分
      if (existing.donationPointsUsed && existing.donationPointsUsed > 0) {
        const [updatedAccount] = await tx
          .update(pointAccounts)
          .set({
            donationPointsBalance: sql`${pointAccounts.donationPointsBalance} + ${existing.donationPointsUsed}`,
            updatedAt: new Date(),
          })
          .where(eq(pointAccounts.userId, existing.userId))
          .returning()

        await tx.insert(pointTransactions).values({
          userId: existing.userId,
          pointType: 'donation',
          changeType: 'earn',
          amount: existing.donationPointsUsed,
          balanceAfter: updatedAccount.donationPointsBalance!,
          sourceType: 'mall_order_cancel',
          sourceId: existing.orderNo,
          description: `订单取消退还积分 - ${existing.orderNo}`,
        })
      }

      // 恢复商品库存
      const orderItems = await tx
        .select()
        .from(mallOrderItems)
        .where(eq(mallOrderItems.orderId, id))

      for (const item of orderItems) {
        await tx
          .update(mallProducts)
          .set({
            stockRemaining: sql`${mallProducts.stockRemaining} + ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(mallProducts.id, item.productId))
      }
    })
  }

  // 更新订单状态
  const updateData: Record<string, any> = {
    status,
    updatedAt: new Date(),
  }

  if (adminRemark !== undefined) {
    updateData.adminRemark = adminRemark
  }

  const [updated] = await db
    .update(mallOrders)
    .set(updateData)
    .where(eq(mallOrders.id, id))
    .returning()

  return updated
}
