"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2 } from "lucide-react"

export default function StockInward() {
  const formatAmount = (amount) => {
    return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
  }
  const [parties, setParties] = useState([])
  const [existingItems, setExistingItems] = useState([])
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("")
  const [formData, setFormData] = useState({
    partyId: "",
    partyInvoiceNumber: "", // Party's invoice number
    purchaseInvoiceNumber: "", // Our purchase invoice number
    date: new Date().toISOString().split("T")[0],
    items: [
      {
        name: "",
        hsnCode: "",
        quantity: "",
        rate: "",
        discount: "",
        total: 0,
      },
    ],
    subtotal: 0,
    cgst: 9,
    sgst: 9,
    igst: 0,
    grandTotal: 0,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchParties()
    fetchExistingItems()
    fetchNextInvoiceNumber()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.cgst, formData.sgst, formData.igst])

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/parties?type=purchase")
      if (response.ok) {
        const data = await response.json()
        setParties(data)
      }
    } catch (error) {
      console.error("Error fetching parties:", error)
    }
  }

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

  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await fetch("/api/invoice/next-number?type=purchase")
      if (response.ok) {
        const data = await response.json()
        setNextInvoiceNumber(data.invoiceNumber)
        setFormData((prev) => ({ ...prev, purchaseInvoiceNumber: data.invoiceNumber }))
      }
    } catch (error) {
      console.error("Error fetching next invoice number:", error)
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
      const response = await fetch("/api/stock/inward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stock inward added successfully",
        })
        // Reset form and fetch new invoice number
        setFormData({
          partyId: "",
          partyInvoiceNumber: "",
          purchaseInvoiceNumber: "",
          date: new Date().toISOString().split("T")[0],
          items: [
            {
              name: "",
              hsnCode: "",
              quantity: "",
              rate: "",
              discount: "",
              total: 0,
            },
          ],
          subtotal: 0,
          cgst: 9,
          sgst: 9,
          igst: 0,
          grandTotal: 0,
        })
        await fetchNextInvoiceNumber()
        fetchExistingItems()
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stock Inward</h1>
          <p className="text-gray-600">Add incoming stock with invoice details</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Stock Inward</CardTitle>
            <CardDescription>Enter invoice details and items</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="party">Purchase Party</Label>
                  <Select
                    value={formData.partyId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, partyId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase party" />
                    </SelectTrigger>
                    <SelectContent>
                      {parties.map((party) => (
                        <SelectItem key={party._id} value={party._id}>
                          {party.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partyInvoiceNumber">Party Invoice Number</Label>
                  <Input
                    id="partyInvoiceNumber"
                    value={formData.partyInvoiceNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, partyInvoiceNumber: e.target.value }))}
                    placeholder="Enter party's invoice number"
                    required
                  />
                  <p className="text-sm text-gray-500">Invoice number from supplier</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseInvoiceNumber">Our Purchase Invoice No.</Label>
                  <Input
                    id="purchaseInvoiceNumber"
                    value={formData.purchaseInvoiceNumber}
                    readOnly
                    className="bg-gray-50"
                  />
                  <p className="text-sm text-gray-500">Auto-generated: {nextInvoiceNumber}</p>
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
                  <CardHeader>
                    <CardTitle>GST Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                  <CardHeader>
                    <CardTitle>Total Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                  </CardContent>
                </Card>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : "Add Stock Inward"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
