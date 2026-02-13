"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Award, DollarSign } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

export default function TopProductsChart() {
  const { products, isLoading } = useAnalytics()

  // Sort by selling price for top/bottom performers
  const sortedByPrice = [...products].sort((a, b) => b.selling_price - a.selling_price)
  const topProducts = sortedByPrice.slice(0, 10)
  const bottomProducts = sortedByPrice.slice(-10).reverse()

  // Calculate margin (selling price - buying price)
  const productsWithMargin = products
    .map((p) => ({
      ...p,
      margin: p.selling_price - p.buying_price,
      marginPercent: p.buying_price > 0 ? ((p.selling_price - p.buying_price) / p.buying_price) * 100 : 0,
    }))
    .sort((a, b) => b.marginPercent - a.marginPercent)
    .slice(0, 10)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No product data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg shadow-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Product Performance</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Best & Worst Performers</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="highest" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="highest" className="font-bold">
              <TrendingUp className="h-4 w-4 mr-2" />
              Highest Price
            </TabsTrigger>
            <TabsTrigger value="margin" className="font-bold">
              <DollarSign className="h-4 w-4 mr-2" />
              Best Margin
            </TabsTrigger>
            <TabsTrigger value="lowest" className="font-bold">
              <TrendingDown className="h-4 w-4 mr-2" />
              Lowest Price
            </TabsTrigger>
          </TabsList>

          {/* Highest Price Tab */}
          <TabsContent value="highest" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis type="number" className="text-xs font-bold" />
                <YAxis
                  dataKey="product_name"
                  type="category"
                  width={150}
                  className="text-xs font-bold"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "2px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="selling_price" radius={[0, 8, 8, 0]}>
                  {topProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#10b981" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 gap-2">
              {topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-500 text-white font-black">#{index + 1}</Badge>
                    <div>
                      <p className="text-sm font-bold">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-emerald-600">{formatCurrency(product.selling_price)}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Best Margin Tab */}
          <TabsContent value="margin" className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {productsWithMargin.slice(0, 10).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-purple-500 text-white font-black">#{index + 1}</Badge>
                    <div>
                      <p className="text-sm font-bold">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cost: {formatCurrency(product.buying_price)} → Sale: {formatCurrency(product.selling_price)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-purple-600">{formatCurrency(product.margin)}</p>
                    <p className="text-xs font-bold text-purple-500">+{product.marginPercent.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Lowest Price Tab */}
          <TabsContent value="lowest" className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bottomProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis type="number" className="text-xs font-bold" />
                <YAxis
                  dataKey="product_name"
                  type="category"
                  width={150}
                  className="text-xs font-bold"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "2px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="selling_price" radius={[0, 8, 8, 0]}>
                  {bottomProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#f59e0b" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-1 gap-2">
              {bottomProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-amber-500 text-white font-black">#{index + 1}</Badge>
                    <div>
                      <p className="text-sm font-bold">{product.product_name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-amber-600">{formatCurrency(product.selling_price)}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}