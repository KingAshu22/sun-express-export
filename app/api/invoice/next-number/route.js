import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "purchase"

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    let lastInvoiceNumber = null
    let nextNumber = 1

    if (type === "purchase") {
      // Check opening stock and stock inward collections for purchase invoices
      // For opening stock, check invoiceNumber field
      const openingStock = await db
        .collection("opening_stock")
        .find({ invoiceNumber: { $regex: /^PI\d+$/ } })
        .sort({ invoiceNumber: -1 })
        .limit(1)
        .toArray()

      // For stock inward, check purchaseInvoiceNumber field
      const stockInward = await db
        .collection("stock_inward")
        .find({ purchaseInvoiceNumber: { $regex: /^PI\d+$/ } })
        .sort({ purchaseInvoiceNumber: -1 })
        .limit(1)
        .toArray()

      // Get the highest invoice number from both collections
      const allInvoices = []

      if (openingStock.length > 0) {
        allInvoices.push({ invoiceNumber: openingStock[0].invoiceNumber })
      }

      if (stockInward.length > 0) {
        allInvoices.push({ invoiceNumber: stockInward[0].purchaseInvoiceNumber })
      }

      if (allInvoices.length > 0) {
        // Sort by invoice number to get the highest
        allInvoices.sort((a, b) => {
          const numA = Number.parseInt(a.invoiceNumber.replace("PI", ""))
          const numB = Number.parseInt(b.invoiceNumber.replace("PI", ""))
          return numB - numA
        })
        lastInvoiceNumber = allInvoices[0].invoiceNumber
      }
    } else if (type === "sales") {
      // Check stock outward collection for sales invoices
      const stockOutward = await db
        .collection("stock_outward")
        .find({ invoiceNumber: { $regex: /^SI\d+$/ } })
        .sort({ invoiceNumber: -1 })
        .limit(1)
        .toArray()

      if (stockOutward.length > 0) {
        lastInvoiceNumber = stockOutward[0].invoiceNumber
      }
    }

    // Extract number from last invoice and increment
    if (lastInvoiceNumber) {
      const prefix = type === "purchase" ? "PI" : "SI"
      const lastNumber = Number.parseInt(lastInvoiceNumber.replace(prefix, ""))
      nextNumber = lastNumber + 1
    }

    await client.close()

    const prefix = type === "purchase" ? "PI" : "SI"
    const invoiceNumber = `${prefix}${String(nextNumber).padStart(4, "0")}`

    return NextResponse.json({ invoiceNumber })
  } catch (error) {
    console.error("Error generating invoice number:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
