import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI

export async function PUT(request, { params }) {
  try {
    const data = await request.json()
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const openingStock = db.collection("opening_stock")

    const result = await openingStock.updateOne(
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
    console.error("Error updating opening stock:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const openingStock = db.collection("opening_stock")

    const result = await openingStock.deleteOne({ _id: new ObjectId(id) })
    await client.close()

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("Error deleting opening stock:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
