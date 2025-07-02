import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET() {
  try {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    const [totalParties, openingStock, stockInward, stockOutward] = await Promise.all([
      db.collection("parties").countDocuments(),
      db.collection("opening_stock").countDocuments(),
      db.collection("stock_inward").countDocuments(),
      db.collection("stock_outward").countDocuments(),
    ])

    // Count unique items
    const collections = ["opening_stock", "stock_inward", "stock_outward"]
    const uniqueItems = new Set()

    for (const collectionName of collections) {
      const collection = db.collection(collectionName)
      const records = await collection.find({}).toArray()

      for (const record of records) {
        if (record.items) {
          for (const item of record.items) {
            uniqueItems.add(item.name)
          }
        }
      }
    }

    await client.close()

    return NextResponse.json({
      totalParties,
      totalItems: uniqueItems.size,
      totalInward: openingStock + stockInward,
      totalOutward: stockOutward,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
