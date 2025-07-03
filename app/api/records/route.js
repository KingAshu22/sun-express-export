import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const partyId = searchParams.get("partyId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const itemName = searchParams.get("itemName")
    const minAmount = searchParams.get("minAmount")
    const maxAmount = searchParams.get("maxAmount")
    const status = searchParams.get("status")

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    let allRecords = []

    // Fetch from all collections based on type filter
    if (!type || type === "all" || type === "opening") {
      const openingStock = await db.collection("opening_stock").find({}).toArray()
      openingStock.forEach((record) => {
        record.type = "opening"
      })
      allRecords = [...allRecords, ...openingStock]
    }

    if (!type || type === "all" || type === "inward") {
      const stockInward = await db.collection("stock_inward").find({}).toArray()
      stockInward.forEach((record) => {
        record.type = "inward"
      })
      allRecords = [...allRecords, ...stockInward]
    }

    if (!type || type === "all" || type === "outward") {
      const stockOutward = await db.collection("stock_outward").find({}).toArray()
      stockOutward.forEach((record) => {
        record.type = "outward"
      })
      allRecords = [...allRecords, ...stockOutward]
    }

    // Apply filters
    let filteredRecords = allRecords

    if (partyId && partyId !== "all") {
      filteredRecords = filteredRecords.filter((record) => record.partyId === partyId)
    }

    if (startDate) {
      filteredRecords = filteredRecords.filter((record) => record.date >= startDate)
    }

    if (endDate) {
      filteredRecords = filteredRecords.filter((record) => record.date <= endDate)
    }

    if (itemName) {
      filteredRecords = filteredRecords.filter(
        (record) =>
          record.items && record.items.some((item) => item.name.toLowerCase().includes(itemName.toLowerCase())),
      )
    }

    if (minAmount) {
      filteredRecords = filteredRecords.filter((record) => (record.grandTotal || 0) >= Number.parseFloat(minAmount))
    }

    if (maxAmount) {
      filteredRecords = filteredRecords.filter((record) => (record.grandTotal || 0) <= Number.parseFloat(maxAmount))
    }

    // Sort by date (newest first)
    filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date))

    await client.close()

    return NextResponse.json(filteredRecords)
  } catch (error) {
    console.error("Error fetching records:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
