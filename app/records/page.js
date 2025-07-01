"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Eye, Edit, Trash2, Download, Printer } from "lucide-react"
import InvoiceModal from "@/components/InvoiceModal"
import EditStockModal from "@/components/EditStockModal"

export default function Records() {
  const [records, setRecords] = useState([])
  const [parties, setParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: "all",
    partyId: "all",
    startDate: "",
    endDate: "",
    itemName: "",
  })
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecords()
    fetchParties()
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [filters])

  const fetchRecords = async () => {
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") queryParams.append(key, value)
      })

      const response = await fetch(`/api/records?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
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

  const handlePrint = (record) => {
    setSelectedRecord(record)
    setShowInvoiceModal(true)
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleDownload = async (record) => {
    try {
      const response = await fetch(`/api/invoice/download/${record._id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `invoice-${record.invoiceNumber}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading invoice:", error)
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
        <div>
          <h1 className="text-3xl font-bold">Stock Records</h1>
          <p className="text-gray-600">View and manage all stock transactions</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter records by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  placeholder="Search item..."
                  value={filters.itemName}
                  onChange={(e) => setFilters((prev) => ({ ...prev, itemName: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell className="font-medium">{record.invoiceNumber}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(record.type)}>
                          {record.type === "opening" ? "Opening" : record.type === "inward" ? "Inward" : "Outward"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPartyName(record.partyId)}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>{record.items?.length || 0} items</TableCell>
                      <TableCell className="text-right">₹{record.grandTotal?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handlePrint(record)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(record)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(record._id, record.type)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No records found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>

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
