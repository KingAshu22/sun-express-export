import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function PUT(request, { params }) {
  try {
    const data = await request.json()
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const stockInward = db.collection("stock_inward")

    const result = await stockInward.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      },
    )

    await client.close()

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Record updated successfully" })
  } catch (error) {
    console.error("Error updating stock inward:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const stockInward = db.collection("stock_inward")

    const result = await stockInward.deleteOne({ _id: new ObjectId(id) })
    await client.close()

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Error deleting stock inward:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
