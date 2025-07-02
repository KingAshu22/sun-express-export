import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

export async function POST(request) {
  try {
    const data = await request.json()

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const stockOutward = db.collection("stock_outward")

    const result = await stockOutward.insertOne({
      ...data,
      type: "outward",
      createdAt: new Date(),
    })

    await client.close()

    return NextResponse.json({
      message: "Stock outward added successfully",
      stockId: result.insertedId,
    })
  } catch (error) {
    console.error("Error adding stock outward:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
