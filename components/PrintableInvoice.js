"use client"

import { forwardRef } from "react"

const formatAmount = (amount) => {
  return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
}

const PrintableInvoice = forwardRef(({ record, party }, ref) => {
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

  const getOurInvoiceNumber = () => {
    if (record.type === "inward") {
      return record.purchaseInvoiceNumber || record.invoiceNumber
    }
    return record.invoiceNumber
  }

  return (
    <div ref={ref} className="printable-invoice">
      <style jsx>{`
        .printable-invoice {
          display: none;
        }
        
        @media print {
          .printable-invoice {
            display: block !important;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 10mm;
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
            background: white;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .print-header h1 {
            font-size: 18px;
            margin: 0 0 5px 0;
            font-weight: bold;
          }
          
          .print-header p {
            margin: 2px 0;
            font-size: 9px;
          }
          
          .print-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            gap: 20px;
          }
          
          .print-details > div {
            flex: 1;
          }
          
          .print-details h3 {
            font-size: 11px;
            margin: 0 0 8px 0;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            font-weight: bold;
          }
          
          .print-details p {
            margin: 3px 0;
            font-size: 9px;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 8px;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 4px 3px;
            text-align: left;
          }
          
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 8px;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-center {
            text-align: center;
          }
          
          .print-totals {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
          }
          
          .totals-table {
            width: 60mm;
            border-collapse: collapse;
            font-size: 9px;
          }
          
          .totals-table td {
            border: 1px solid #000;
            padding: 3px 5px;
          }
          
          .grand-total {
            font-weight: bold;
            background-color: #f0f0f0;
          }
          
          .print-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
          
          .company-info {
            margin-top: 15px;
            font-size: 8px;
            text-align: center;
          }
          
          /* Hide everything else when printing */
          body * {
            visibility: hidden;
          }
          
          .printable-invoice,
          .printable-invoice * {
            visibility: visible;
          }
          
          .printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>

      <div className="print-header">
        <h1>SUN EXPRESS EXPORT</h1>
        <p>Stock Management System</p>
        <p>
          <strong>{getTypeTitle(record.type)}</strong>
        </p>
      </div>

      <div className="print-details">
        <div>
          <h3>Invoice Details</h3>
          <p>
            <strong>Our Invoice No:</strong> {getOurInvoiceNumber()}
          </p>
          {record.type === "inward" && record.partyInvoiceNumber && (
            <p>
              <strong>Party Invoice No:</strong> {record.partyInvoiceNumber}
            </p>
          )}
          <p>
            <strong>Date:</strong> {new Date(record.date).toLocaleDateString("en-IN")}
          </p>
          <p>
            <strong>Type:</strong> {getTypeTitle(record.type)}
          </p>
        </div>
        <div>
          <h3>{record.type === "outward" ? "Customer Details" : "Supplier Details"}</h3>
          {party ? (
            <>
              <p>
                <strong>Name:</strong> {party.name}
              </p>
              <p>
                <strong>Address:</strong> {party.address}
              </p>
              <p>
                <strong>Contact:</strong> {party.contact}
              </p>
              <p>
                <strong>Email:</strong> {party.email}
              </p>
              <p>
                <strong>GST No:</strong> {party.gstNumber || "N/A"}
              </p>
            </>
          ) : (
            <p>Party details not available</p>
          )}
        </div>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th className="text-center" style={{ width: "8%" }}>
              S.No
            </th>
            <th style={{ width: "30%" }}>Item Name</th>
            <th style={{ width: "15%" }}>HSN Code</th>
            <th className="text-right" style={{ width: "10%" }}>
              Qty
            </th>
            <th className="text-right" style={{ width: "12%" }}>
              Rate (₹)
            </th>
            <th className="text-right" style={{ width: "10%" }}>
              Disc %
            </th>
            <th className="text-right" style={{ width: "15%" }}>
              Total (₹)
            </th>
          </tr>
        </thead>
        <tbody>
          {record.items?.map((item, index) => (
            <tr key={index}>
              <td className="text-center">{index + 1}</td>
              <td>{item.name}</td>
              <td>{item.hsnCode}</td>
              <td className="text-right">{formatAmount(item.quantity)}</td>
              <td className="text-right">₹{formatAmount(item.rate)}</td>
              <td className="text-right">{formatAmount(item.discount)}</td>
              <td className="text-right">₹{formatAmount(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="print-totals">
        <table className="totals-table">
          <tr>
            <td>
              <strong>Subtotal:</strong>
            </td>
            <td className="text-right">₹{formatAmount(record.subtotal)}</td>
          </tr>
          <tr>
            <td>
              <strong>CGST ({formatAmount(record.cgst)}%):</strong>
            </td>
            <td className="text-right">₹{formatAmount(((record.subtotal || 0) * (record.cgst || 0)) / 100)}</td>
          </tr>
          <tr>
            <td>
              <strong>SGST ({formatAmount(record.sgst)}%):</strong>
            </td>
            <td className="text-right">₹{formatAmount(((record.subtotal || 0) * (record.sgst || 0)) / 100)}</td>
          </tr>
          <tr>
            <td>
              <strong>IGST ({formatAmount(record.igst)}%):</strong>
            </td>
            <td className="text-right">₹{formatAmount(((record.subtotal || 0) * (record.igst || 0)) / 100)}</td>
          </tr>
          <tr className="grand-total">
            <td>
              <strong>Grand Total:</strong>
            </td>
            <td className="text-right">
              <strong>₹{formatAmount(record.grandTotal)}</strong>
            </td>
          </tr>
        </table>
      </div>

      <div className="print-footer">
        <p>
          <strong>Thank you for your business!</strong>
        </p>
        <p>This is a computer generated invoice.</p>
      </div>

      <div className="company-info">
        <p>
          Generated on: {new Date().toLocaleDateString("en-IN")} at {new Date().toLocaleTimeString("en-IN")}
        </p>
        <p>Sun Express Export - Stock Management System</p>
      </div>
    </div>
  )
})

PrintableInvoice.displayName = "PrintableInvoice"

export default PrintableInvoice
