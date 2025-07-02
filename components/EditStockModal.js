"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, X } from "lucide-react"

// Add this function at the top of the component
const formatAmount = (amount) => {
  return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
}

export default function EditStockModal({ record, parties, onClose, onSave }) {
  const [formData, setFormData] = useState({
    partyId: record.partyId || "",
    invoiceNumber: record.invoiceNumber || "",
    partyInvoiceNumber: record.partyInvoiceNumber || "",
    purchaseInvoiceNumber: record.purchaseInvoiceNumber || "",
    date: record.date || "",
    items: record.items || [],
    subtotal: record.subtotal || 0,
    cgst: record.cgst || 9,
    sgst: record.sgst || 9,
    igst: record.igst || 0,
    grandTotal: record.grandTotal || 0,
  })
  const [loading, setLoading] = useState(false)
  const [existingItems, setExistingItems] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    fetchExistingItems()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.cgst, formData.sgst, formData.igst])

  const fetchExistingItems = async () => {
    try {
      const response = await fetch("/api/stock/items")
      if (response.ok) {
        const data = await response.json()
        setExistingItems(data)
      }
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.rate - (item.quantity * item.rate * item.discount) / 100
      return sum + itemTotal
    }, 0)

    const cgstAmount = (subtotal * formData.cgst) / 100
    const sgstAmount = (subtotal * formData.sgst) / 100
    const igstAmount = (subtotal * formData.igst) / 100
    const grandTotal = subtotal + cgstAmount + sgstAmount + igstAmount

    setFormData((prev) => ({
      ...prev,
      subtotal,
      grandTotal,
    }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value

    // Auto-fill from existing items
    if (field === "name") {
      const existingItem = existingItems.find((item) => item.name === value)
      if (existingItem) {
        newItems[index].hsnCode = existingItem.hsnCode || ""
        newItems[index].rate = existingItem.rate || ""
      }
    }

    if (field === "quantity" || field === "rate" || field === "discount") {
      const quantity = Number.parseFloat(newItems[index].quantity) || 0
      const rate = Number.parseFloat(newItems[index].rate) || 0
      const discount = Number.parseFloat(newItems[index].discount) || 0
      newItems[index].total = quantity * rate - (quantity * rate * discount) / 100
    }

    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }))
  }

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          hsnCode: "",
          quantity: "",
          rate: "",
          discount: "",
          total: 0,
        },
      ],
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData((prev) => ({
        ...prev,
        items: newItems,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/stock/${record.type}/${record._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Record updated successfully",
        })
        onSave()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPartyType = () => {
    return record.type === "outward" ? "sales" : "purchase"
  }

  const filteredParties = parties.filter((party) => party.type === getPartyType())

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>
              Edit{" "}
              {record.type === "opening"
                ? "Opening Stock"
                : record.type === "inward"
                  ? "Stock Inward"
                  : "Stock Outward"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="party">{record.type === "outward" ? "Sales" : "Purchase"} Party</Label>
              <Select
                value={formData.partyId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, partyId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${record.type === "outward" ? "sales" : "purchase"} party`} />
                </SelectTrigger>
                <SelectContent>
                  {filteredParties.map((party) => (
                    <SelectItem key={party._id} value={party._id}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {record.type === "inward" && (
              <div className="space-y-2">
                <Label htmlFor="partyInvoiceNumber">Party Invoice Number</Label>
                <Input
                  id="partyInvoiceNumber"
                  value={formData.partyInvoiceNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, partyInvoiceNumber: e.target.value }))}
                  placeholder="Party's invoice number"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">
                {record.type === "inward" ? "Our Purchase Invoice No." : "Invoice Number"}
              </Label>
              <Input
                id="invoiceNumber"
                value={record.type === "inward" ? formData.purchaseInvoiceNumber : formData.invoiceNumber}
                onChange={(e) => {
                  if (record.type === "inward") {
                    setFormData((prev) => ({ ...prev, purchaseInvoiceNumber: e.target.value }))
                  } else {
                    setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div className="md:col-span-2">
                      <Label>Item Name</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(index, "name", e.target.value)}
                        list={`items-${index}`}
                        required
                      />
                      <datalist id={`items-${index}`}>
                        {existingItems.map((existingItem, i) => (
                          <option key={i} value={existingItem.name} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <Label>HSN Code</Label>
                      <Input
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Discount %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, "discount", e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Total</Label>
                        <Input value={formatAmount(item.total)} readOnly />
                      </div>
                      {formData.items.length > 1 && (
                        <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">GST Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>CGST %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.cgst}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, cgst: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label>SGST %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.sgst}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sgst: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <Label>IGST %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.igst}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, igst: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Total Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{formatAmount(formData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST ({formData.cgst}%):</span>
                    <span>₹{formatAmount((formData.subtotal * formData.cgst) / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({formData.sgst}%):</span>
                    <span>₹{formatAmount((formData.subtotal * formData.sgst) / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGST ({formData.igst}%):</span>
                    <span>₹{formatAmount((formData.subtotal * formData.igst) / 100)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Grand Total:</span>
                    <span>₹{formatAmount(formData.grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
