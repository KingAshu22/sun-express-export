"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function OpeningStockInvoice() {
  const params = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/stock/opening/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setInvoice(data)
      }
    } catch (error) {
      console.error("Error fetching invoice:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/invoice/opening/${params.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `opening-stock-${params.id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading invoice:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Invoice not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 print:hidden">
          <Link href="/stock/opening">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Opening Stock
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <Card className="print:shadow-none print:border-none">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold">Sun Express Export</CardTitle>
            <p className="text-gray-600">Purchase Invoice - Opening Stock</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <div className="text-sm">
                  <p className="font-medium">{invoice.partyName}</p>
                  <p>{invoice.partyAddress}</p>
                  <p>Contact: {invoice.partyContact}</p>
                  <p>Email: {invoice.partyEmail}</p>
                  <p>GST: {invoice.partyGstNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  <p>
                    <strong>Invoice No:</strong> {invoice.invoiceNumber}
                  </p>
                  <p>
                    <strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Type:</strong> Opening Stock
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">S.No</th>
                    <th className="border border-gray-300 p-2 text-left">Item Name</th>
                    <th className="border border-gray-300 p-2 text-left">HSN Code</th>
                    <th className="border border-gray-300 p-2 text-right">Qty</th>
                    <th className="border border-gray-300 p-2 text-right">Rate</th>
                    <th className="border border-gray-300 p-2 text-right">Discount %</th>
                    <th className="border border-gray-300 p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{index + 1}</td>
                      <td className="border border-gray-300 p-2">{item.name}</td>
                      <td className="border border-gray-300 p-2">{item.hsnCode}</td>
                      <td className="border border-gray-300 p-2 text-right">{item.quantity}</td>
                      <td className="border border-gray-300 p-2 text-right">
                        ₹{Number.parseFloat(item.rate).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">{item.discount || 0}%</td>
                      <td className="border border-gray-300 p-2 text-right">₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div></div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST ({invoice.cgst}%):</span>
                  <span>₹{((invoice.subtotal * invoice.cgst) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({invoice.sgst}%):</span>
                  <span>₹{((invoice.subtotal * invoice.sgst) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGST ({invoice.igst}%):</span>
                  <span>₹{((invoice.subtotal * invoice.igst) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Thank you for your business!</p>
              <p>This is a computer generated invoice.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
