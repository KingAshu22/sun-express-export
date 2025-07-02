"use client"

import { useState, useEffect, useRef } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  Filter,
  FileText,
  BarChart3,
  AlertTriangle,
  Archive,
  CheckSquare,
  Square,
  RefreshCw,
  DollarSign,
} from "lucide-react"
import InvoiceModal from "@/components/InvoiceModal"
import EditStockModal from "@/components/EditStockModal"
import PrintableInvoice from "@/components/PrintableInvoice"

export default function Records() {
  const [records, setRecords] = useState([])
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRecords, setSelectedRecords] = useState([])
  const [filters, setFilters] = useState({
    type: "all",
    partyId: "all",
    startDate: "",
    endDate: "",
    itemName: "",
    status: "all",
    minAmount: "",
    maxAmount: "",
  })
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" })
  const printRef = useRef()
  const { toast } = useToast()

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
    fetchRecords()
    fetchParties()
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [filters, sortConfig])

  const fetchRecords = async () => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") queryParams.append(key, value)
      })

      const response = await fetch(`/api/records?${queryParams}`)
      if (response.ok) {
        let data = await response.json()

        // Apply sorting
        data = data.sort((a, b) => {
          let aValue = a[sortConfig.key]
          let bValue = b[sortConfig.key]

          if (sortConfig.key === "date") {
            aValue = new Date(aValue)
            bValue = new Date(bValue)
          } else if (sortConfig.key === "grandTotal") {
            aValue = Number.parseFloat(aValue || 0)
            bValue = Number.parseFloat(bValue || 0)
          }

          if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
          if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
          return 0
        })

        setRecords(data)
      }
    } catch (error) {
      console.error("Error fetching records:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const handleSelectRecord = (recordId) => {
    setSelectedRecords((prev) => (prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]))
  }

  const handleSelectAll = () => {
    setSelectedRecords(selectedRecords.length === records.length ? [] : records.map((record) => record._id))
  }

  const handleView = (record) => {
    setSelectedRecord(record)
    setShowInvoiceModal(true)
  }

  const handleEdit = (record) => {
    setSelectedRecord(record)
    setShowEditModal(true)
  }

  const handleDelete = async (id, type) => {
    if (!confirm("Are you sure you want to delete this record?")) return

    try {
      const response = await fetch(`/api/stock/${type}/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Record deleted successfully",
        })
        fetchRecords()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete record",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select records to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedRecords.length} records?`)) return

    try {
      const deletePromises = selectedRecords.map(async (recordId) => {
        const record = records.find((r) => r._id === recordId)
        if (record) {
          return fetch(`/api/stock/${record.type}/${recordId}`, { method: "DELETE" })
        }
      })

      await Promise.all(deletePromises)

      toast({
        title: "Success",
        description: `${selectedRecords.length} records deleted successfully`,
      })

      setSelectedRecords([])
      fetchRecords()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some records",
        variant: "destructive",
      })
    }
  }

  const handlePrint = (record) => {
    setSelectedRecord(record)
    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    const party = parties.find((p) => p._id === record.partyId)

    const formatAmount = (amount) => {
      return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
    }

    const formatDate = (dateString) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice Print</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .header h1 { font-size: 20px; margin-bottom: 5px; }
        .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .details > div { flex: 1; margin-right: 20px; }
        .details h3 { font-size: 12px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
        .details p { margin-bottom: 3px; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { display: flex; justify-content: flex-end; margin-top: 10px; }
        .totals table { width: 200px; }
        .grand-total { font-weight: bold; background-color: #f0f0f0; }
        .footer { margin-top: 20px; text-align: center; font-size: 8px; border-top: 1px solid #ccc; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SUN EXPRESS EXPORT</h1>
        <p>Stock Management System</p>
        <p><strong>${record.type === "opening" ? "Opening Stock Invoice" : record.type === "inward" ? "Purchase Invoice" : "Sales Invoice"}</strong></p>
      </div>
      
      <div class="details">
        <div>
          <h3>Invoice Details</h3>
          <p><strong>Invoice No:</strong> ${record.type === "inward" ? record.purchaseInvoiceNumber || record.invoiceNumber : record.invoiceNumber}</p>
          ${record.type === "inward" && record.partyInvoiceNumber ? `<p><strong>Party Invoice:</strong> ${record.partyInvoiceNumber}</p>` : ""}
          <p><strong>Date:</strong> ${formatDate(record.date)}</p>
        </div>
        <div>
          <h3>Party Details</h3>
          ${
            party
              ? `
            <p><strong>Name:</strong> ${party.name}</p>
            <p><strong>Address:</strong> ${party.address}</p>
            <p><strong>Contact:</strong> ${party.contact}</p>
            <p><strong>GST:</strong> ${party.gstNumber || "N/A"}</p>
          `
              : "<p>Party details not available</p>"
          }
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="text-center">S.No</th>
            <th>Item Name</th>
            <th>HSN Code</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Disc%</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            record.items
              ?.map(
                (item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.hsnCode}</td>
              <td class="text-right">${formatAmount(item.quantity)}</td>
              <td class="text-right">₹${formatAmount(item.rate)}</td>
              <td class="text-right">${formatAmount(item.discount)}%</td>
              <td class="text-right">₹${formatAmount(item.total)}</td>
            </tr>
          `,
              )
              .join("") || ""
          }
        </tbody>
      </table>
      
      <div class="totals">
        <table>
          <tr><td>Subtotal:</td><td class="text-right">₹${formatAmount(record.subtotal)}</td></tr>
          <tr><td>CGST (${formatAmount(record.cgst)}%):</td><td class="text-right">₹${formatAmount(((record.subtotal || 0) * (record.cgst || 0)) / 100)}</td></tr>
          <tr><td>SGST (${formatAmount(record.sgst)}%):</td><td class="text-right">₹${formatAmount(((record.subtotal || 0) * (record.sgst || 0)) / 100)}</td></tr>
          <tr><td>IGST (${formatAmount(record.igst)}%):</td><td class="text-right">₹${formatAmount(((record.subtotal || 0) * (record.igst || 0)) / 100)}</td></tr>
          <tr class="grand-total"><td><strong>Grand Total:</strong></td><td class="text-right"><strong>₹${formatAmount(record.grandTotal)}</strong></td></tr>
        </table>
      </div>
      
      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>Generated on: ${formatDate(new Date().toISOString())} ${new Date().toLocaleTimeString("en-IN")}</p>
      </div>
    </body>
    </html>
  `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleDownload = async (record) => {
    try {
      // Open the PDF generation page in a new window
      const pdfUrl = `/api/invoice/generate-pdf/${record._id}?type=${record.type}`
      window.open(pdfUrl, "_blank")

      toast({
        title: "Success",
        description: "PDF generation started. Use Ctrl+P or Cmd+P to save as PDF.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      })
    }
  }

  const handleBulkExport = async () => {
    if (selectedRecords.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select records to export",
        variant: "destructive",
      })
      return
    }

    try {
      // Create CSV content
      const csvHeaders = [
        "Invoice Number",
        "Party Invoice Number",
        "Type",
        "Party Name",
        "Date",
        "Items Count",
        "Subtotal",
        "CGST",
        "SGST",
        "IGST",
        "Grand Total",
      ]

      const csvRows = selectedRecords.map((recordId) => {
        const record = records.find((r) => r._id === recordId)
        const party = parties.find((p) => p._id === record?.partyId)

        return [
          record?.invoiceNumber || record?.purchaseInvoiceNumber || "",
          record?.partyInvoiceNumber || "",
          record?.type || "",
          party?.name || "",
          formatDate(record?.date),
          record?.items?.length || 0,
          record?.subtotal ? formatAmount(record.subtotal) : 0,
          record?.cgst ? formatAmount(record.cgst) : 0,
          record?.sgst ? formatAmount(record.sgst) : 0,
          record?.igst ? formatAmount(record.igst) : 0,
          record?.grandTotal ? formatAmount(record.grandTotal) : 0,
        ]
      })

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `selected-records-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: `${selectedRecords.length} records exported successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export records",
        variant: "destructive",
      })
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "opening":
        return "bg-blue-100 text-blue-800"
      case "inward":
        return "bg-green-100 text-green-800"
      case "outward":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPartyName = (partyId) => {
    const party = parties.find((p) => p._id === partyId)
    return party ? party.name : "Unknown Party"
  }

  const getInvoiceNumber = (record) => {
    if (record.type === "inward") {
      return record.purchaseInvoiceNumber || record.invoiceNumber
    }
    return record.invoiceNumber
  }

  const getPartyInvoiceNumber = (record) => {
    if (record.type === "inward" && record.partyInvoiceNumber) {
      return record.partyInvoiceNumber
    }
    return null
  }

  const getTotalValue = () => {
    return records.reduce((sum, record) => sum + (record.grandTotal || 0), 0)
  }

  const getFilteredStats = () => {
    const stats = {
      total: records.length,
      opening: records.filter((r) => r.type === "opening").length,
      inward: records.filter((r) => r.type === "inward").length,
      outward: records.filter((r) => r.type === "outward").length,
      totalValue: getTotalValue(),
    }
    return stats
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

  const stats = getFilteredStats()

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Stock Records</h1>
            <p className="text-gray-600">View and manage all stock transactions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {showAdvancedFilters ? "Hide" : "Show"} Filters
            </Button>
            <Button onClick={fetchRecords} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Opening Stock</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.opening}</p>
                </div>
                <Archive className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Inward</p>
                  <p className="text-2xl font-bold text-green-600">{stats.inward}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stock Outward</p>
                  <p className="text-2xl font-bold text-red-600">{stats.outward}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-purple-600">₹{formatAmount(stats.totalValue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className={showAdvancedFilters ? "" : "hidden"}>
          <CardHeader>
            <CardTitle>Advanced Filters</CardTitle>
            <CardDescription>Filter records by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="opening">Opening Stock</SelectItem>
                    <SelectItem value="inward">Stock Inward</SelectItem>
                    <SelectItem value="outward">Stock Outward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Party</Label>
                <Select
                  value={filters.partyId}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, partyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Parties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    {parties.map((party) => (
                      <SelectItem key={party._id} value={party._id}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  placeholder="Search item..."
                  value={filters.itemName}
                  onChange={(e) => setFilters((prev) => ({ ...prev, itemName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Amount</Label>
                <Input
                  type="number"
                  placeholder="Minimum amount"
                  value={filters.minAmount}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Amount</Label>
                <Input
                  type="number"
                  placeholder="Maximum amount"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxAmount: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedRecords.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{selectedRecords.length} record(s) selected</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBulkExport} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Records ({records.length})</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAll} className="flex items-center gap-2">
                  {selectedRecords.length === records.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Select All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRecords.length === records.length && records.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("invoiceNumber")}
                      >
                        Our Invoice No.{" "}
                        {sortConfig.key === "invoiceNumber" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Party Invoice No.</TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("type")}>
                        Type {sortConfig.key === "type" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("date")}>
                        Date {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("grandTotal")}
                      >
                        Total Amount {sortConfig.key === "grandTotal" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record._id} className={selectedRecords.includes(record._id) ? "bg-blue-50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRecords.includes(record._id)}
                            onCheckedChange={() => handleSelectRecord(record._id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{getInvoiceNumber(record)}</TableCell>
                        <TableCell className="text-gray-600">{getPartyInvoiceNumber(record) || "-"}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(record.type)}>
                            {record.type === "opening" ? "Opening" : record.type === "inward" ? "Inward" : "Outward"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getPartyName(record.partyId)}</TableCell>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.items?.length || 0} items</TableCell>
                        <TableCell className="text-right font-medium">₹{formatAmount(record.grandTotal)}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleView(record)} title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePrint(record)} title="Print">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(record)} title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record._id, record.type)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No records found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hidden printable component */}
        {selectedRecord && (
          <PrintableInvoice
            ref={printRef}
            record={selectedRecord}
            party={parties.find((p) => p._id === selectedRecord.partyId)}
          />
        )}

        {/* Modals */}
        {showInvoiceModal && selectedRecord && (
          <InvoiceModal
            record={selectedRecord}
            party={parties.find((p) => p._id === selectedRecord.partyId)}
            onClose={() => {
              setShowInvoiceModal(false)
              setSelectedRecord(null)
            }}
          />
        )}

        {showEditModal && selectedRecord && (
          <EditStockModal
            record={selectedRecord}
            parties={parties}
            onClose={() => {
              setShowEditModal(false)
              setSelectedRecord(null)
            }}
            onSave={() => {
              fetchRecords()
              setShowEditModal(false)
              setSelectedRecord(null)
            }}
          />
        )}
      </div>
    </Layout>
  )
}
