import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingDown, AlertTriangle, DollarSign } from "lucide-react"

interface InventorySummary {
  store_id: string
  total_products: number
  total_units: number
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
}

interface InventorySummaryCardsProps {
  summary: InventorySummary | null
  inventoryCount: number
  lowStockCount: number
  outOfStockCount: number
}

export function InventorySummaryCards({ 
  summary, 
  inventoryCount,
  lowStockCount,
  outOfStockCount
}: InventorySummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inventoryCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Products in inventory</p>
        </CardContent>
      </Card>

      <Card className="border-orange-500/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <TrendingDown className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{lowStockCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
          <p className="text-xs text-muted-foreground mt-1">Needs immediate attention</p>
        </CardContent>
      </Card>

      <Card className="border-green-500/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            TZS {summary?.total_value?.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Inventory valuation</p>
        </CardContent>
      </Card>
    </div>
  )
}