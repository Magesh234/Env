import type {
  Store,
  Product,
  Sale,
  Debt,
  StockMovement,
  InventoryItem,
  StoreGrowthData,
  StorePerformanceData,
  ProductDistributionData,
  StockHealthData,
  SalesOverviewData,
  PaymentMethodData,
  DebtAgingData,
} from "./types"

// Helper to safely get string from nullable field
const getStringValue = (field: { String: string; Valid: boolean } | string | undefined): string => {
  if (!field) return ""
  if (typeof field === "string") return field
  return field.Valid ? field.String : ""
}

// Date grouping helpers
export function groupByMonth(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString("en-US", { month: "short", year: "numeric" })
}

export function groupByWeek(dateString: string): string {
  const date = new Date(dateString)
  const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)
  return `Week ${weekNumber}, ${date.toLocaleString("en-US", { month: "short", year: "numeric" })}`
}

export function groupByDay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// Store Analytics Processors
export function processStoreGrowth(stores: Store[]): StoreGrowthData[] {
  const monthlyData = new Map<string, number>()

  // Sort stores by creation date
  const sortedStores = [...stores].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  sortedStores.forEach((store) => {
    const month = groupByMonth(store.created_at)
    monthlyData.set(month, (monthlyData.get(month) || 0) + 1)
  })

  const result: StoreGrowthData[] = []
  let cumulative = 0

  Array.from(monthlyData.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .forEach(([month, count]) => {
      cumulative += count
      result.push({
        month,
        stores: count,
        cumulative,
      })
    })

  return result
}

export function processStorePerformance(
  stores: Store[],
  allSales: Sale[],
  allInventory: InventoryItem[],
  allDebts: Debt[]
): StorePerformanceData[] {
  return stores.map((store) => {
    const storeSales = allSales.filter((s) => s.store_id === store.id)
    const storeInventory = allInventory.filter((i) => i.store_id === store.id)
    const storeDebts = allDebts.filter((d) => d.store_id === store.id)

    return {
      store_name: store.store_name,
      total_sales: storeSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
      total_inventory_value: storeInventory.reduce((sum, i) => sum + (Number(i.inventory_value) || 0), 0),
      total_debts: storeDebts.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0),
      product_count: storeInventory.length,
      sales_count: storeSales.length,
    }
  })
}

// Product Analytics Processors
export function processProductDistribution(products: Product[]): ProductDistributionData[] {
  const categoryMap = new Map<string, { count: number; value: number }>()

  products.forEach((product) => {
    const category = product.category || "Uncategorized"
    const existing = categoryMap.get(category) || { count: 0, value: 0 }
    categoryMap.set(category, {
      count: existing.count + 1,
      value: existing.value + (Number(product.selling_price) || 0),
    })
  })

  const totalProducts = products.length
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
      percentage: (data.count / totalProducts) * 100,
    }))
    .sort((a, b) => b.count - a.count)
}

export function processProductTrends(products: Product[], groupBy: "day" | "week" | "month" = "month") {
  const groupFn = groupBy === "day" ? groupByDay : groupBy === "week" ? groupByWeek : groupByMonth
  const trendData = new Map<string, number>()

  products.forEach((product) => {
    const period = groupFn(product.created_at)
    trendData.set(period, (trendData.get(period) || 0) + 1)
  })

  return Array.from(trendData.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([period, count]) => ({ period, count }))
}

// Inventory Analytics Processors
export function processStockHealth(inventory: InventoryItem[]): {
  in_stock: number
  low_stock: number
  out_of_stock: number
  total_value: number
} {
  return {
    in_stock: inventory.filter((i) => i.current_stock > 0 && !i.is_low_stock).length,
    low_stock: inventory.filter((i) => i.is_low_stock && i.current_stock > 0).length,
    out_of_stock: inventory.filter((i) => i.current_stock === 0).length,
    total_value: inventory.reduce((sum, i) => sum + (Number(i.inventory_value) || 0), 0),
  }
}

export function processStockMovementsByType(movements: StockMovement[]) {
  const typeMap = new Map<string, { in: number; out: number; value: number }>()

  movements.forEach((movement) => {
    const type = movement.movement_type
    const existing = typeMap.get(type) || { in: 0, out: 0, value: 0 }
    
    if (movement.quantity > 0) {
      typeMap.set(type, {
        ...existing,
        in: existing.in + Math.abs(movement.quantity),
        value: existing.value + Math.abs(movement.total_cost || 0),
      })
    } else {
      typeMap.set(type, {
        ...existing,
        out: existing.out + Math.abs(movement.quantity),
        value: existing.value + Math.abs(movement.total_cost || 0),
      })
    }
  })

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    in: data.in,
    out: data.out,
    net: data.in - data.out,
    value: data.value,
  }))
}

export function processStockMovementTimeline(
  movements: StockMovement[],
  groupBy: "day" | "week" | "month" = "day"
) {
  const groupFn = groupBy === "day" ? groupByDay : groupBy === "week" ? groupByWeek : groupByMonth
  const timelineData = new Map<string, { in: number; out: number }>()

  movements.forEach((movement) => {
    const period = groupFn(movement.performed_at)
    const existing = timelineData.get(period) || { in: 0, out: 0 }
    
    if (movement.quantity > 0) {
      timelineData.set(period, { ...existing, in: existing.in + movement.quantity })
    } else {
      timelineData.set(period, { ...existing, out: existing.out + Math.abs(movement.quantity) })
    }
  })

  return Array.from(timelineData.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([period, data]) => ({ period, ...data, net: data.in - data.out }))
}

// Sales Analytics Processors
export function processSalesOverview(sales: Sale[], groupBy: "day" | "week" | "month" = "day"): SalesOverviewData[] {
  const groupFn = groupBy === "day" ? groupByDay : groupBy === "week" ? groupByWeek : groupByMonth
  const salesData = new Map<string, { total: number; count: number }>()

  sales.forEach((sale) => {
    const period = groupFn(sale.invoice_date)
    const existing = salesData.get(period) || { total: 0, count: 0 }
    salesData.set(period, {
      total: existing.total + (Number(sale.total_amount) || 0),
      count: existing.count + 1,
    })
  })

  return Array.from(salesData.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, data]) => ({
      date,
      sales: data.total,
      transactions: data.count,
      average: data.count > 0 ? data.total / data.count : 0,
    }))
}

export function processPaymentMethods(sales: Sale[]): PaymentMethodData[] {
  const methodMap = new Map<string, { count: number; amount: number }>()

  sales.forEach((sale) => {
    const method = getStringValue(sale.payment_method) || "Unknown"
    const existing = methodMap.get(method) || { count: 0, amount: 0 }
    methodMap.set(method, {
      count: existing.count + 1,
      amount: existing.amount + (Number(sale.total_amount) || 0),
    })
  })

  const totalAmount = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)

  return Array.from(methodMap.entries())
    .map(([method, data]) => ({
      method: method.replace("_", " ").toUpperCase(),
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

// Debt Analytics Processors
export function processDebtAging(debts: Debt[]): DebtAgingData[] {
  const ranges = [
    { label: "Current (0-30 days)", min: 0, max: 30 },
    { label: "31-60 days", min: 31, max: 60 },
    { label: "61-90 days", min: 61, max: 90 },
    { label: "Over 90 days", min: 91, max: Infinity },
  ]

  const agingData = ranges.map((range) => {
    const debtsInRange = debts.filter((d) => d.days_overdue >= range.min && d.days_overdue <= range.max)
    return {
      range: range.label,
      count: debtsInRange.length,
      amount: debtsInRange.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0),
      percentage: 0, // Will calculate after
    }
  })

  const totalAmount = agingData.reduce((sum, d) => sum + d.amount, 0)
  agingData.forEach((d) => {
    d.percentage = totalAmount > 0 ? (d.amount / totalAmount) * 100 : 0
  })

  return agingData
}

export function calculateCollectionRate(debts: Debt[]): number {
  const totalAmount = debts.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0)
  const paidAmount = debts.reduce((sum, d) => sum + (Number(d.amount_paid) || 0), 0)
  return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
}

export function processDebtTimeline(debts: Debt[], groupBy: "day" | "week" | "month" = "month") {
  const groupFn = groupBy === "day" ? groupByDay : groupBy === "week" ? groupByWeek : groupByMonth
  const timelineData = new Map<string, { count: number; amount: number }>()

  debts.forEach((debt) => {
    const period = groupFn(debt.created_at)
    const existing = timelineData.get(period) || { count: 0, amount: 0 }
    timelineData.set(period, {
      count: existing.count + 1,
      amount: existing.amount + (Number(debt.balance_due) || 0),
    })
  })

  return Array.from(timelineData.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([period, data]) => ({ period, ...data }))
}