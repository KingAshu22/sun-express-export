import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function POST(request) {
  try {
    const data = await request.json()

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const stockInward = db.collection("stock_inward")

    const result = await stockInward.insertOne({
      ...data,
      type: "inward",
      createdAt: new Date(),
    })

    await client.close()

    return NextResponse.json({
      message: "Stock inward added successfully",
      stockId: result.insertedId,
    })
  } catch (error) {
    console.error("Error adding stock inward:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
