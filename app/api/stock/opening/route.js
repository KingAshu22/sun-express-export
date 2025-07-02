import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

export async function POST(request) {
  try {
    const data = await request.json()

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const openingStock = db.collection("opening_stock")

    const result = await openingStock.insertOne({
      ...data,
      type: "opening",
      createdAt: new Date(),
    })

    await client.close()

    return NextResponse.json({
      message: "Opening stock added successfully",
      stockId: result.insertedId,
    })
  } catch (error) {
    console.error("Error adding opening stock:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
