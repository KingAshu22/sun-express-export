import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI

export async function PUT(request, { params }) {
  try {
    const { name, address, contact, email, gstNumber, type } = await request.json()
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const parties = db.collection("parties")

    const result = await parties.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          address,
          contact,
          email,
          gstNumber,
          type,
          updatedAt: new Date(),
        },
      },
    )

    await client.close()

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Party not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Party updated successfully" })
  } catch (error) {
    console.error("Error updating party:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const parties = db.collection("parties")

    const result = await parties.deleteOne({ _id: new ObjectId(id) })
    await client.close()

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Party not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Party deleted successfully" })
  } catch (error) {
    console.error("Error deleting party:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
