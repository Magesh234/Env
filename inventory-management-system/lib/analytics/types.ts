// Analytics Data Types

export interface Store {
  id: string
  store_name: string
  store_code: string
  store_type: string
  created_at: string
  is_active: boolean
  city?: { String: string; Valid: boolean } | string
  region?: { String: string; Valid: boolean } | string
  country: string
}

export interface Product {
  id: string
  sku: string
  product_name: string
  category?: string
  buying_price: number
  selling_price: number
  created_at: string
  is_active: boolean
  brand?: { String: string; Valid: boolean } | string
}

export interface InventorySummary {
  store_id: string
  total_products: number
  total_units: number
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
  last_updated: string
}

export interface InventoryItem {
  id: string
  store_id: string
  product_id: string
  sku: string
  product_name: string
  current_stock: number
  reorder_level: number
  buying_price: number
  selling_price: number
  is_low_stock: boolean
  inventory_value: number
}

export interface StockMovement {
  id: string
  store_id: string
  product_id: string
  movement_type: string
  quantity: number
  previous_stock: number
  new_stock: number
  unit_cost: number
  total_cost: number
  notes: string
  performed_at: string
  product_name?: string
}

export interface Sale {
  id: string
  store_id: string
  invoice_number: string
  invoice_date: string
  client_name: string
  total_amount: number
  amount_paid: number
  balance_due: number
  payment_status: string
  payment_method: { String: string; Valid: boolean } | string
  created_at: string
}

export interface Debt {
  id: string
  store_id: string
  client_name: string
  invoice_number: string
  total_amount: number
  amount_paid: number
  balance_due: number
  due_date: string
  debt_status: string
  days_overdue: number
  created_at: string
  is_overdue: boolean
}

// Processed Analytics Data
export interface StoreGrowthData {
  month: string
  stores: number
  cumulative: number
}

export interface StorePerformanceData {
  store_name: string
  total_sales: number
  total_inventory_value: number
  total_debts: number
  product_count: number
  sales_count: number
}

export interface ProductDistributionData {
  category: string
  count: number
  value: number
  percentage: number
}

export interface StockHealthData {
  date: string
  in_stock: number
  low_stock: number
  out_of_stock: number
  total_value: number
}

export interface SalesOverviewData {
  date: string
  sales: number
  transactions: number
  average: number
}

export interface PaymentMethodData {
  method: string
  count: number
  amount: number
  percentage: number
}

export interface DebtAgingData {
  range: string
  count: number
  amount: number
  percentage: number
}

export interface TimeRange {
  label: string
  value: string
  days: number
}

export interface AnalyticsFilters {
  storeId?: string
  dateFrom?: string
  dateTo?: string
  timeRange: TimeRange
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}