/**
 * API Configuration
 * Central configuration for all backend API endpoints
 */

// Base URL for the backend API
// Change this to your actual backend URL when connecting
//export const auth_base_url = 'http://172.17.88.170:8080/api/v1'
//export const audit_base_url = 'http://172.17.88.170:8083/api/v1'
//export const inventory_base_url = 'http://172.17.88.170:8082/api/v1'
//export const notifications_base_url = 'http://172.17.88.170:8085/api/v1'
//export const image_base_url = "http://172.17.88.170:8081/api/v1"
//export const subscription_base_url = 'http://172.17.88.170:8086/api/v1'
// export const auth_base_url = 'https://auth.wekeza.space/api/v1'
// export const audit_base_url = 'https://audit.wekeza.space/api/v1'
// export const inventory_base_url = 'https://inventory.wekeza.space/api/v1'
// export const notifications_base_url = 'https://notifications.wekeza.space/api/v1'
//export const subscription_base_url =  'https://subscription.wekeza.space/api/v1'
export const auth_base_url = 'https://auth-dk-dev.kuzo.co.tz/api/v1'
export const audit_base_url = 'https://audit-dk-dev.kuzo.co.tz/api/v1'
export const inventory_base_url = 'https://inventory-dk-dev.kuzo.co.tz/api/v1'
export const notifications_base_url = 'https://notification-dk-dev.kuzo.co.tz/api/v1'
export const subscription_base_url = 'https://subscription-dk-dev.kuzo.co.tz/api/v1'
export const image_base_url = "https://image-dk-dev.kuzo.co.tz/api/v1"

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${auth_base_url}/auth/login`,
    logout: `${auth_base_url}/auth/logout`,
    refresh: `${auth_base_url}/auth/refresh`,
    initiateReset: `${auth_base_url}/auth/initiate-reset`,
    completeReset: `${auth_base_url}/auth/complete-reset`,
    resetInstructions: `${auth_base_url}/auth/reset-instructions`,
    register: `${auth_base_url}/auth/register`,
    validate: `${auth_base_url}/api/v1/auth/validate`,
    forgotPassword: `${auth_base_url}/api/v1/auth/forgot-password`,
    resetPassword: `${auth_base_url}/api/v1/auth/reset-password`,
    verifyEmail: `${auth_base_url}/api/v1/auth/verify-email`,
    resendVerification: `${auth_base_url}/api/v1/auth/resend-verification`,
  },

  // Users
  users: {
    list: `${auth_base_url}/users`,
    detail: (id: string) => `${auth_base_url}/users/${id}`,
    create: `${auth_base_url}/business/users`,
    update: (id: string) => `${auth_base_url}/users/${id}`,
    delete: (id: string) => `${auth_base_url}/users/${id}`,
  },

  // Stores
  stores: {
    list: `${inventory_base_url}/stores`,
    detail: (id: string) => `${inventory_base_url}/stores/${id}`,
    create: `${inventory_base_url}/stores`,
    update: (id: string) => `${inventory_base_url}/stores/${id}`,
    delete: (id: string) => `${inventory_base_url}/stores/${id}`,
  },

  // Products
  products: {
    list: `${inventory_base_url}/products`,
    detail: (id: string) => `${inventory_base_url}/products/${id}`,
    create: `${inventory_base_url}/products`,
    update: (id: string) => `${inventory_base_url}/products/${id}`,
    delete: (id: string) => `${inventory_base_url}/products/${id}`,
  },

  // Inventory
  inventory: {
    list: `${inventory_base_url}/inventory`,
    detail: (id: string) => `${inventory_base_url}/inventory/${id}`,
    adjust: `${inventory_base_url}/inventory/adjust`,
    transfer: `${inventory_base_url}/inventory/transfer`,
  },

  // Sales
  sales: {
    list: `${inventory_base_url}/sales`,
    detail: (id: string) => `${inventory_base_url}/sales/${id}`,
    create: `${inventory_base_url}/sales`,
    update: (id: string) => `${inventory_base_url}/sales/${id}`,
    delete: (id: string) => `${inventory_base_url}/sales/${id}`,
  },

  // Clients
  clients: {
    list: `${inventory_base_url}/clients`,
    detail: (id: string) => `${inventory_base_url}/clients/${id}`,
    create: `${inventory_base_url}/clients`,
    update: (id: string) => `${inventory_base_url}/clients/${id}`,
    delete: (id: string) => `${inventory_base_url}/clients/${id}`,
  },

  // Debts
  debts: {
    list: `${inventory_base_url}/debts`,
    detail: (id: string) => `${inventory_base_url}/debts/${id}`,
    create: `${inventory_base_url}/debts`,
    update: (id: string) => `${inventory_base_url}/debts/${id}`,
    payment: `${inventory_base_url}/debts/payment`,
  },

  // Purchase Orders
  purchaseOrders: {
    list: `${inventory_base_url}/purchase-orders`,
    detail: (id: string) => `${inventory_base_url}/purchase-orders/${id}`,
    create: `${inventory_base_url}/purchase-orders`,
    update: (id: string) => `${inventory_base_url}/purchase-orders/${id}`,
    approve: (id: string) => `${inventory_base_url}/purchase-orders/${id}/approve`,
    receive: (id: string) => `${inventory_base_url}/purchase-orders/${id}/receive`,
  },

  // Stock Transfer
  stockTransfer: {
    list: `${inventory_base_url}/stock-transfer`,
    detail: (id: string) => `${inventory_base_url}/stock-transfer/${id}`,
    create: `${inventory_base_url}/stock-transfer`,
    approve: (id: string) => `${inventory_base_url}/stock-transfer/${id}/approve`,
    complete: (id: string) => `${inventory_base_url}/stock-transfer/${id}/complete`,
  },

  // Reports
  reports: {
    sales: `${inventory_base_url}/reports/sales`,
    inventory: `${inventory_base_url}/reports/inventory`,
    financial: `${inventory_base_url}/reports/financial`,
  },

  // Notifications
  notifications: {
    list: `${notifications_base_url}/notifications`,
    markRead: (id: string) => `${notifications_base_url}/notifications/${id}/read`,
    markAllRead: `${notifications_base_url}/notifications/read-all`,
  },
}

// Helper function to get authorization headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token")
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

// Helper function for API calls
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  return response.json()
}
