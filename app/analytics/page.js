"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, BarChart3, RefreshCw } from "lucide-react"

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("month")
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  })

  const formatAmount = (amount) => {
    return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period })
      if (customRange.startDate && customRange.endDate) {
        params.append("startDate", customRange.startDate)
        params.append("endDate", customRange.endDate)
      }

      const response = await fetch(`/api/reports/analytics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomRangeSubmit = () => {
    if (customRange.startDate && customRange.endDate) {
      fetchAnalytics()
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </Layout>
    )
  }

  if (!analytics) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Failed to load analytics</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Custom Date Range */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={customRange.startDate}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={customRange.endDate}
                  onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <Button onClick={handleCustomRangeSubmit}>Apply Range</Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-blue-600">₹{formatAmount(analytics.summary.totalPurchases)}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">₹{formatAmount(analytics.summary.totalSales)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
                  <p
                    className={`text-2xl font-bold ${analytics.summary.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    ₹{formatAmount(analytics.summary.profit)}
                  </p>
                </div>
                {analytics.summary.profit >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                  <p
                    className={`text-2xl font-bold ${analytics.summary.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatAmount(analytics.summary.profitMargin)}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.summary.totalTransactions}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
              <CardDescription>Best performing products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topItems.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.hsnCode}</TableCell>
                      <TableCell className="text-right">{formatAmount(item.quantity)}</TableCell>
                      <TableCell className="text-right">₹{formatAmount(item.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Top Business Partners</CardTitle>
              <CardDescription>Highest value customers and suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Party Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topParties.slice(0, 5).map((party, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{party.name}</TableCell>
                      <TableCell>
                        <Badge variant={party.type === "purchase" ? "default" : "secondary"}>
                          {party.type === "purchase" ? "Supplier" : "Customer"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{party.transactionCount}</TableCell>
                      <TableCell className="text-right">₹{formatAmount(party.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Sales and purchase trends over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Purchases</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.monthlyTrends.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">₹{formatAmount(month.purchases)}</TableCell>
                      <TableCell className="text-right">₹{formatAmount(month.sales)}</TableCell>
                      <TableCell className="text-right">{month.transactions}</TableCell>
                      <TableCell
                        className={`text-right ${(month.sales - month.purchases) >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        ₹{formatAmount(month.sales - month.purchases)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
