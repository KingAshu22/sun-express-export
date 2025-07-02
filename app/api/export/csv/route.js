import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET() {
  try {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    const stockSummary = new Map()

    // Process all stock data
    const collections = [
      { name: "opening_stock", type: "Opening" },
      { name: "stock_inward", type: "Inward" },
      { name: "stock_outward", type: "Outward" },
    ]

    for (const { name: collectionName, type } of collections) {
      const records = await db.collection(collectionName).find({}).toArray()
      for (const record of records) {
        if (record.items) {
          for (const item of record.items) {
            const key = `${item.name}_${item.hsnCode}`
            if (!stockSummary.has(key)) {
              stockSummary.set(key, {
                itemName: item.name,
                hsnCode: item.hsnCode,
                openingStock: 0,
                totalInward: 0,
                totalOutward: 0,
                totalValue: 0,
                totalQuantity: 0,
              })
            }
            const summary = stockSummary.get(key)
            const quantity = Number.parseFloat(item.quantity) || 0
            const rate = Number.parseFloat(item.rate) || 0

            if (type === "Opening" || type === "Inward") {
              if (type === "Opening") {
                summary.openingStock += quantity
              } else {
                summary.totalInward += quantity
              }
              summary.totalValue += quantity * rate
              summary.totalQuantity += quantity
            } else {
              summary.totalOutward += quantity
            }
          }
        }
      }
    }

    // Generate CSV
    const csvHeaders = [
      "Item Name",
      "HSN Code",
      "Opening Stock",
      "Total Inward",
      "Total Outward",
      "Current Balance",
      "Average Rate",
      "Stock Value",
    ]

    const csvRows = Array.from(stockSummary.values()).map((item) => {
      const currentBalance = item.openingStock + item.totalInward - item.totalOutward
      const averageRate = item.totalQuantity > 0 ? item.totalValue / item.totalQuantity : 0
      const stockValue = currentBalance * averageRate

      return [
        item.itemName,
        item.hsnCode,
        item.openingStock,
        item.totalInward,
        item.totalOutward,
        currentBalance,
        averageRate.toFixed(2),
        stockValue.toFixed(2),
      ]
    })

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.join(",")).join("\n")

    await client.close()

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="stock-summary-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting CSV:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
