"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, Download, X } from "lucide-react"

export default function InvoiceModal({ record, party, onClose }) {
  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
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

  const getTypeTitle = (type) => {
    switch (type) {
      case "opening":
        return "Opening Stock Invoice"
      case "inward":
        return "Purchase Invoice"
      case "outward":
        return "Sales Invoice"
      default:
        return "Invoice"
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{getTypeTitle(record.type)}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="invoice-content bg-white p-8 print:p-0">
          {/* Company Header */}
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-3xl font-bold text-blue-600">Sun Express Export</h1>
            <p className="text-gray-600 mt-2">Stock Management System</p>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Invoice Details</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Invoice No:</span> {record.invoiceNumber}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {new Date(record.date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {getTypeTitle(record.type)}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Party Details</h3>
              {party ? (
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Name:</span> {party.name}
                  </p>
                  <p>
                    <span className="font-medium">Address:</span> {party.address}
                  </p>
                  <p>
                    <span className="font-medium">Contact:</span> {party.contact}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {party.email}
                  </p>
                  {party.gstNumber && (
                    <p>
                      <span className="font-medium">GST No:</span> {party.gstNumber}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Party details not available</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Items</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Item Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">HSN Code</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Rate</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Discount %</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {record.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{item.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.hsnCode}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      ₹{Number.parseFloat(item.rate).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.discount || 0}%</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      ₹{Number.parseFloat(item.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="space-y-2 border border-gray-300 p-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{Number.parseFloat(record.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST ({record.cgst || 0}%):</span>
                  <span>₹{((record.subtotal * (record.cgst || 0)) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({record.sgst || 0}%):</span>
                  <span>₹{((record.subtotal * (record.sgst || 0)) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IGST ({record.igst || 0}%):</span>
                  <span>₹{((record.subtotal * (record.igst || 0)) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Grand Total:</span>
                  <span>₹{Number.parseFloat(record.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-gray-600">
            <p>Thank you for your business!</p>
            <p className="text-sm mt-2">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
