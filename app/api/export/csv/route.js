import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function GET() {
  try {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    // Get all parties for reference
    const parties = await db.collection("parties").find({}).toArray()
    const partyMap = new Map(parties.map((party) => [party._id.toString(), party]))

    // Get all records
    const [openingStock, stockInward, stockOutward] = await Promise.all([
      db.collection("opening_stock").find({}).toArray(),
      db.collection("stock_inward").find({}).toArray(),
      db.collection("stock_outward").find({}).toArray(),
    ])

    // Combine all records with type
    const allRecords = [
      ...openingStock.map((record) => ({ ...record, type: "opening" })),
      ...stockInward.map((record) => ({ ...record, type: "inward" })),
      ...stockOutward.map((record) => ({ ...record, type: "outward" })),
    ]

    // Sort by date (newest first)
    allRecords.sort((a, b) => new Date(b.date) - new Date(a.date))

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

    // Create CSV headers
    const csvHeaders = [
      "Type",
      "Invoice Number",
      "Party Invoice Number",
      "Party Name",
      "Date",
      "Items Count",
      "Subtotal",
      "CGST %",
      "SGST %",
      "IGST %",
      "Grand Total",
    ]

    // Create CSV rows
    const csvRows = allRecords.map((record) => {
      const party = partyMap.get(record.partyId)
      const invoiceNumber =
        record.type === "inward" ? record.purchaseInvoiceNumber || record.invoiceNumber : record.invoiceNumber

      return [
        record.type === "opening" ? "Opening Stock" : record.type === "inward" ? "Stock Inward" : "Stock Outward",
        invoiceNumber || "",
        record.partyInvoiceNumber || "",
        party?.name || "Unknown Party",
        formatDate(record.date),
        record.items?.length || 0,
        formatAmount(record.subtotal),
        formatAmount(record.cgst),
        formatAmount(record.sgst),
        formatAmount(record.igst),
        formatAmount(record.grandTotal),
      ]
    })

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    await client.close()

    // Create response with CSV content
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="stock-summary-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })

    return response
  } catch (error) {
    console.error("Error exporting CSV:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
