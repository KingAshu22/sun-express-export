import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const parties = db.collection("parties")

    const filter = type ? { type } : {}
    const result = await parties.find(filter).toArray()
    await client.close()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching parties:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, address, contact, email, gstNumber, type } = await request.json()

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const parties = db.collection("parties")

    const result = await parties.insertOne({
      name,
      address,
      contact,
      email,
      gstNumber,
      type,
      createdAt: new Date(),
    })

    await client.close()

    return NextResponse.json({
      message: "Party created successfully",
      partyId: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating party:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
