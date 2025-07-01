import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function GET() {
  try {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    // Get unique items from all stock collections
    const collections = ["opening_stock", "stock_inward", "stock_outward"]
    const allItems = []

    for (const collectionName of collections) {
      const collection = db.collection(collectionName)
      const records = await collection.find({}).toArray()

      for (const record of records) {
        if (record.items) {
          for (const item of record.items) {
            const existingItem = allItems.find((existing) => existing.name === item.name)
            if (!existingItem) {
              allItems.push({
                name: item.name,
                hsnCode: item.hsnCode,
                rate: item.rate,
              })
            }
          }
        }
      }
    }

    await client.close()

    return NextResponse.json(allItems)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
