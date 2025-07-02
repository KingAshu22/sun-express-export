"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, Calendar } from "lucide-react"

export default function Summary() {
  const [stockSummary, setStockSummary] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })
  const [filters, setFilters] = useState({
    itemName: "",
    hsnCode: "",
    partyName: "all",
    startDate: "",
    endDate: "",
    balanceFilter: "all", // all, positive, negative, zero
  })

  // Format amount function
  const formatAmount = (amount) => {
    return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
  }

  // Format date to dd/mm/yyyy
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  useEffect(() => {
    fetchParties()
    fetchStockSummary()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [stockSummary, filters, sortConfig])

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/parties")
      if (response.ok) {
        const data = await response.json()
        setParties(data)
      }
    } catch (error) {
      console.error("Error fetching parties:", error)
    }
  }

  const fetchStockSummary = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filters.partyName && filters.partyName !== "all") queryParams.append("partyName", filters.partyName)
      if (filters.startDate) queryParams.append("startDate", filters.startDate)
      if (filters.endDate) queryParams.append("endDate", filters.endDate)

      const response = await fetch(`/api/stock/summary?${queryParams.toString()}`)
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

  const applyFiltersAndSort = () => {
    let filtered = [...stockSummary]

    // Apply filters
    if (filters.itemName) {
      filtered = filtered.filter((item) => item.itemName.toLowerCase().includes(filters.itemName.toLowerCase()))
    }

    if (filters.hsnCode) {
      filtered = filtered.filter((item) => item.hsnCode.toLowerCase().includes(filters.hsnCode.toLowerCase()))
    }

    if (filters.balanceFilter !== "all") {
      filtered = filtered.filter((item) => {
        const balance = item.currentBalance
        switch (filters.balanceFilter) {
          case "positive":
            return balance > 0
          case "negative":
            return balance < 0
          case "zero":
            return balance === 0
          default:
            return true
        }
      })
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        // Handle numeric values
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue
        }

        // Handle string values
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        return 0
      })
    }

    setFilteredData(filtered)
  }

  const handleSort = (key) => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    )
  }

  const clearFilters = () => {
    setFilters({
      itemName: "",
      hsnCode: "",
      partyName: "all",
      startDate: "",
      endDate: "",
      balanceFilter: "all",
    })
    setSortConfig({ key: null, direction: "asc" })
  }

  const applyDateFilter = () => {
    fetchStockSummary()
  }

  const exportToCSV = async () => {
    try {
      // Generate CSV from current filtered/sorted data
      const csvHeaders = [
        "Item Name",
        "HSN Code",
        "Opening Stock",
        "Total Inward",
        "Total Outward",
        "Current Balance",
        "Average Rate",
        "Stock Value",
      ]

      const csvRows = filteredData.map((item) => [
        item.itemName,
        item.hsnCode,
        formatAmount(item.openingStock),
        formatAmount(item.totalInward),
        formatAmount(item.totalOutward),
        formatAmount(item.currentBalance),
        formatAmount(item.averageRate),
        formatAmount(item.currentBalance * item.averageRate),
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url

      // Create filename with filter info
      let filename = "stock-summary"
      if (filters.partyName && filters.partyName !== "all")
        filename += `-${filters.partyName.replace(/[^a-zA-Z0-9]/g, "")}`
      if (filters.startDate) filename += `-from-${filters.startDate}`
      if (filters.endDate) filename += `-to-${filters.endDate}`
      filename += `-${new Date().toISOString().split("T")[0]}.csv`

      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
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
            Export Filtered CSV ({filteredData.length} items)
          </Button>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Item Name</label>
                <Input
                  placeholder="Search by item name..."
                  value={filters.itemName}
                  onChange={(e) => setFilters((prev) => ({ ...prev, itemName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">HSN Code</label>
                <Input
                  placeholder="Search by HSN code..."
                  value={filters.hsnCode}
                  onChange={(e) => setFilters((prev) => ({ ...prev, hsnCode: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Party Name</label>
                <Select
                  value={filters.partyName}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, partyName: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select party..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    {parties.map((party) => (
                      <SelectItem key={party._id} value={party.name}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Stock Balance</label>
                <Select
                  value={filters.balanceFilter}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, balanceFilter: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="positive">Positive Balance</SelectItem>
                    <SelectItem value="negative">Negative Balance</SelectItem>
                    <SelectItem value="zero">Zero Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={applyDateFilter} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Apply Date Filter
              </Button>
              <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2 bg-transparent">
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredData.length} of {stockSummary.length} items
              {filters.partyName && filters.partyName !== "all" && ` • Party: ${filters.partyName}`}
              {filters.startDate && ` • From: ${formatDate(filters.startDate)}`}
              {filters.endDate && ` • To: ${formatDate(filters.endDate)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Stock Balance</CardTitle>
            <CardDescription>Item-wise stock summary with inward, outward, and balance quantities</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("itemName")}>
                        <div className="flex items-center">
                          Item Name
                          {getSortIcon("itemName")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("hsnCode")}>
                        <div className="flex items-center">
                          HSN Code
                          {getSortIcon("hsnCode")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("openingStock")}
                      >
                        <div className="flex items-center justify-end">
                          Opening Stock
                          {getSortIcon("openingStock")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("totalInward")}
                      >
                        <div className="flex items-center justify-end">
                          Total Inward
                          {getSortIcon("totalInward")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("totalOutward")}
                      >
                        <div className="flex items-center justify-end">
                          Total Outward
                          {getSortIcon("totalOutward")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("currentBalance")}
                      >
                        <div className="flex items-center justify-end">
                          Current Balance
                          {getSortIcon("currentBalance")}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("averageRate")}
                      >
                        <div className="flex items-center justify-end">
                          Average Rate
                          {getSortIcon("averageRate")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Stock Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.hsnCode}</TableCell>
                        <TableCell className="text-right">{formatAmount(item.openingStock)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatAmount(item.totalInward)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatAmount(item.totalOutward)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          <span
                            className={
                              item.currentBalance < 0
                                ? "text-red-600"
                                : item.currentBalance === 0
                                  ? "text-gray-500"
                                  : "text-green-600"
                            }
                          >
                            {formatAmount(item.currentBalance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">₹{formatAmount(item.averageRate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{formatAmount(item.currentBalance * item.averageRate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : stockSummary.length > 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No items match the current filters.</p>
                <Button variant="outline" onClick={clearFilters} className="mt-2 bg-transparent">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No stock data available. Add some stock entries to see the summary.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        {filteredData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredData.length}</div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{formatAmount(filteredData.reduce((sum, item) => sum + item.currentBalance * item.averageRate, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Stock Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredData.filter((item) => item.currentBalance > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Items in Stock</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {filteredData.filter((item) => item.currentBalance <= 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Out of Stock</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
