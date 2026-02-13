"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Define a Store interface
interface Store {
  id: string
  name: string
}

// Define the shape of our context
interface StoreContextType {
  selectedStore: string
  setSelectedStore: (storeId: string) => void
  storeName: string
  setStoreName: (name: string) => void
  currentStore: Store | null  // Add this for compatibility
}

// Create the context with undefined as initial value
const StoreContext = createContext<StoreContextType | undefined>(undefined)

// Custom hook to use the store context
export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}

// Provider component props
interface StoreProviderProps {
  children: ReactNode
}

// Provider component that wraps your app
export const StoreProvider = ({ children }: StoreProviderProps) => {
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [storeName, setStoreName] = useState<string>('')

  // Load from localStorage on mount (so selection persists across page refreshes)
  useEffect(() => {
    const savedStoreId = localStorage.getItem('selectedStoreId')
    const savedStoreName = localStorage.getItem('selectedStoreName')
    
    if (savedStoreId) {
      setSelectedStore(savedStoreId)
    }
    if (savedStoreName) {
      setStoreName(savedStoreName)
    }
  }, [])

  // Save to localStorage whenever store changes
  const handleSetSelectedStore = (storeId: string) => {
    setSelectedStore(storeId)
    localStorage.setItem('selectedStoreId', storeId)
  }

  const handleSetStoreName = (name: string) => {
    setStoreName(name)
    localStorage.setItem('selectedStoreName', name)
  }

  // Create currentStore object for compatibility
  const currentStore: Store | null = selectedStore && storeName 
    ? { id: selectedStore, name: storeName }
    : null

  const value: StoreContextType = {
    selectedStore,
    setSelectedStore: handleSetSelectedStore,
    storeName,
    setStoreName: handleSetStoreName,
    currentStore,  
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}