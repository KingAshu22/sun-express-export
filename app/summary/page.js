"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download } from "lucide-react"

export default function Summary() {
  const [stockSummary, setStockSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStockSummary()
  }, [])

  const fetchStockSummary = async () => {
    try {
      const response = await fetch("/api/stock/summary")
      if (response.ok) {
        const data = await response.json()
        setStockSummary(data)
      }
    } catch (error) {
      console.error("Error fetching stock summary:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = async () => {
    try {
      const response = await fetch("/api/export/csv")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `stock-summary-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Stock Summary</h1>
            <p className="text-gray-600">Overview of all stock movements and current balance</p>
          </div>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Stock Balance</CardTitle>
            <CardDescription>Item-wise stock summary with inward, outward, and balance quantities</CardDescription>
          </CardHeader>
          <CardContent>
            {stockSummary.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead className="text-right">Opening Stock</TableHead>
                    <TableHead className="text-right">Total Inward</TableHead>
                    <TableHead className="text-right">Total Outward</TableHead>
                    <TableHead className="text-right">Current Balance</TableHead>
                    <TableHead className="text-right">Average Rate</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockSummary.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell>{item.hsnCode}</TableCell>
                      <TableCell className="text-right">{item.openingStock}</TableCell>
                      <TableCell className="text-right text-green-600">{item.totalInward}</TableCell>
                      <TableCell className="text-right text-red-600">{item.totalOutward}</TableCell>
                      <TableCell className="text-right font-semibold">
                        <span className={item.currentBalance < 0 ? "text-red-600" : "text-green-600"}>
                          {item.currentBalance}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₹{item.averageRate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        ₹{(item.currentBalance * item.averageRate).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No stock data available. Add some stock entries to see the summary.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
