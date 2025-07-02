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

    // Get the latest invoice number for the specified type
    let latestInvoice = null
    const prefix = type === "purchase" ? "PUR" : "SAL"

    if (type === "purchase") {
      // Check both opening stock and stock inward
      const openingStock = await db.collection("opening_stock").find({}).sort({ createdAt: -1 }).limit(1).toArray()
      const stockInward = await db.collection("stock_inward").find({}).sort({ createdAt: -1 }).limit(1).toArray()

      const allInvoices = [...openingStock, ...stockInward]
      if (allInvoices.length > 0) {
        latestInvoice = allInvoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      }
    } else {
      // Check stock outward
      const stockOutward = await db.collection("stock_outward").find({}).sort({ createdAt: -1 }).limit(1).toArray()
      if (stockOutward.length > 0) {
        latestInvoice = stockOutward[0]
      }
    }

    let nextNumber = 1
    if (latestInvoice && latestInvoice.invoiceNumber) {
      const currentNumber = latestInvoice.invoiceNumber.replace(prefix, "").replace(/^0+/, "")
      nextNumber = Number.parseInt(currentNumber) + 1
    }

    const invoiceNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`

    await client.close()

    return NextResponse.json({ invoiceNumber })
  } catch (error) {
    console.error("Error generating next invoice number:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
