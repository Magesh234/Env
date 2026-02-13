import { inventory_base_url } from "@/lib/api-config"
import type {
  Store,
  Product,
  InventorySummary,
  InventoryItem,
  StockMovement,
  Sale,
  Debt,
  ApiResponse,
} from "./types"

const API_BASE_URL = inventory_base_url

// Authentication helper
const getAuthHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  if (!token) throw new Error("No access token found")
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

// Generic fetch wrapper with error handling
async function fetchApi<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching ${url}:`, error)
    throw error
  }
}

// Store Analytics Fetchers
export async function fetchAllStores(): Promise<Store[]> {
  const response = await fetchApi<ApiResponse<Store[]>>(`${API_BASE_URL}/stores`)
  return response.success ? response.data : []
}

export async function fetchStoreById(storeId: string): Promise<Store | null> {
  try {
    const response = await fetchApi<ApiResponse<Store>>(`${API_BASE_URL}/stores/${storeId}`)
    return response.success ? response.data : null
  } catch {
    return null
  }
}

// Product Analytics Fetchers
export async function fetchAllProducts(): Promise<Product[]> {
  const response = await fetchApi<ApiResponse<Product[]>>(`${API_BASE_URL}/products`)
  return response.success ? response.data : []
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  try {
    const response = await fetchApi<ApiResponse<Product>>(`${API_BASE_URL}/products/${productId}`)
    return response.success ? response.data : null
  } catch {
    return null
  }
}

// Inventory Analytics Fetchers
export async function fetchInventorySummary(storeId: string): Promise<InventorySummary | null> {
  try {
    const response = await fetchApi<ApiResponse<InventorySummary>>(
      `${API_BASE_URL}/inventory/stores/${storeId}/summary`
    )
    return response.success ? response.data : null
  } catch {
    return null
  }
}

export async function fetchStoreInventory(storeId: string): Promise<InventoryItem[]> {
  try {
    const response = await fetchApi<ApiResponse<{ inventories: InventoryItem[] }>>(
      `${API_BASE_URL}/inventory/stores/${storeId}?page_size=1000`
    )
    return response.success && response.data?.inventories ? response.data.inventories : []
  } catch {
    return []
  }
}

export async function fetchStockMovements(
  storeId: string,
  productId?: string,
  pageSize: number = 100
): Promise<StockMovement[]> {
  try {
    const params = new URLSearchParams({
      store_id: storeId,
      page_size: pageSize.toString(),
    })
    
    if (productId) {
      params.append("product_id", productId)
    }

    const response = await fetchApi<ApiResponse<{ movements: StockMovement[] }>>(
      `${API_BASE_URL}/inventory/movements?${params.toString()}`
    )
    return response.success && response.data?.movements ? response.data.movements : []
  } catch {
    return []
  }
}

// Sales Analytics Fetchers
export async function fetchStoreSales(storeId: string): Promise<Sale[]> {
  try {
    const response = await fetchApi<ApiResponse<{ sales: Sale[]; count: number }>>(
      `${API_BASE_URL}/stores/${storeId}/sales`
    )
    return response.success && response.data?.sales ? response.data.sales : []
  } catch {
    return []
  }
}

export async function fetchAllSales(): Promise<Sale[]> {
  try {
    const response = await fetchApi<ApiResponse<Sale[]>>(`${API_BASE_URL}/sales`)
    return response.success ? response.data : []
  } catch {
    return []
  }
}

// Debt Analytics Fetchers
export async function fetchStoreDebts(storeId: string): Promise<Debt[]> {
  try {
    const params = new URLSearchParams({
      store_id: storeId,
      page_size: "1000",
    })

    const response = await fetchApi<ApiResponse<{ debts: Debt[] }>>(
      `${API_BASE_URL}/debts?${params.toString()}`
    )
    return response.success && response.data?.debts ? response.data.debts : []
  } catch {
    return []
  }
}

export async function fetchAllDebts(): Promise<Debt[]> {
  try {
    const response = await fetchApi<ApiResponse<{ debts: Debt[] }>>(`${API_BASE_URL}/debts`)
    return response.success && response.data?.debts ? response.data.debts : []
  } catch {
    return []
  }
}

// Batch fetchers for dashboard
export async function fetchStoreAnalyticsData(storeId: string) {
  const [summary, inventory, sales, debts, movements] = await Promise.all([
    fetchInventorySummary(storeId),
    fetchStoreInventory(storeId),
    fetchStoreSales(storeId),
    fetchStoreDebts(storeId),
    fetchStockMovements(storeId),
  ])

  return {
    summary,
    inventory,
    sales,
    debts,
    movements,
  }
}

export async function fetchAllAnalyticsData() {
  const [stores, products, sales, debts] = await Promise.all([
    fetchAllStores(),
    fetchAllProducts(),
    fetchAllSales(),
    fetchAllDebts(),
  ])

  return {
    stores,
    products,
    sales,
    debts,
  }
}