import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET() {
  try {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    const stockSummary = new Map()

    // Process opening stock
    const openingStock = await db.collection("opening_stock").find({}).toArray()
    for (const record of openingStock) {
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
          summary.openingStock += Number.parseFloat(item.quantity) || 0
          summary.totalValue += (Number.parseFloat(item.quantity) || 0) * (Number.parseFloat(item.rate) || 0)
          summary.totalQuantity += Number.parseFloat(item.quantity) || 0
        }
      }
    }

    // Process stock inward
    const stockInward = await db.collection("stock_inward").find({}).toArray()
    for (const record of stockInward) {
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
          summary.totalInward += Number.parseFloat(item.quantity) || 0
          summary.totalValue += (Number.parseFloat(item.quantity) || 0) * (Number.parseFloat(item.rate) || 0)
          summary.totalQuantity += Number.parseFloat(item.quantity) || 0
        }
      }
    }

    // Process stock outward
    const stockOutward = await db.collection("stock_outward").find({}).toArray()
    for (const record of stockOutward) {
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
          summary.totalOutward += Number.parseFloat(item.quantity) || 0
        }
      }
    }

    // Calculate current balance and average rate
    const result = Array.from(stockSummary.values()).map((item) => ({
      ...item,
      currentBalance: item.openingStock + item.totalInward - item.totalOutward,
      averageRate: item.totalQuantity > 0 ? item.totalValue / item.totalQuantity : 0,
    }))

    await client.close()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching stock summary:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
