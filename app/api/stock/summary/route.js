import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const partyName = searchParams.get("partyName")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const groupBy = searchParams.get("groupBy") || "item" // item, hsn, or none

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    const stockSummary = new Map()

    const dateFilter = {}
    if (startDate || endDate) {
      dateFilter.date = {}
      if (startDate) dateFilter.date.$gte = startDate
      if (endDate) dateFilter.date.$lte = endDate
    }

    const parties = await db.collection("parties").find({}).toArray()
    let partyIds = []
    if (partyName && partyName !== "all" && partyName !== "") {
      const matchingParties = parties.filter((party) =>
        party.name.toLowerCase().includes(partyName.toLowerCase())
      )
      partyIds = matchingParties.map((party) => party._id.toString())
    }

    const partyFilter = partyIds.length > 0 ? { partyId: { $in: partyIds } } : {}
    const combinedFilter = { ...dateFilter, ...partyFilter }

    // Utility function to create grouping key
    const getKey = (item) => {
      const name = item.name?.trim().toUpperCase() || ""
      const hsn = item.hsnCode?.trim() || ""
      const desc = item.description?.trim() || ""

      switch (groupBy) {
        case "item":
          return name
        case "hsn":
          return hsn
        default:
          return `${name}_${hsn}_${desc}`
      }
    }

    const processItems = (collectionName, type, quantityField = "quantity") => async () => {
      const data = await db.collection(collectionName).find(combinedFilter).toArray()

      for (const record of data) {
        if (!record.items) continue

        for (const item of record.items) {
          const key = getKey(item)

          if (!stockSummary.has(key)) {
            stockSummary.set(key, {
              itemName: item.name?.trim().toUpperCase() || "",
              itemDescription: item.description || "",
              hsnCode: item.hsnCode || "",
              openingStock: 0,
              totalInward: 0,
              totalOutward: 0,
              totalValue: 0,
              totalQuantity: 0,
              groupBy: groupBy,
              items: groupBy !== "none" ? [] : undefined,
            })
          }

          const summary = stockSummary.get(key)
          const quantity = parseFloat(item[quantityField]) || 0
          const rate = parseFloat(item.rate) || 0

          if (type === "opening") {
            summary.openingStock += quantity
          } else if (type === "inward") {
            summary.totalInward += quantity
          } else if (type === "outward") {
            summary.totalOutward += quantity
          }

          if (type !== "outward") {
            summary.totalValue += quantity * rate
            summary.totalQuantity += quantity
          }

          if (groupBy !== "none" && summary.items) {
            summary.items.push({
              name: item.name,
              description: item.description || "",
              hsnCode: item.hsnCode,
              quantity,
              rate,
              type,
            })
          }
        }
      }
    }

    await processItems("opening_stock", "opening")()
    await processItems("stock_inward", "inward")()
    await processItems("stock_outward", "outward")()

    const result = Array.from(stockSummary.values()).map((item) => ({
      ...item,
      currentBalance: item.openingStock + item.totalInward - item.totalOutward,
      averageRate: item.totalQuantity > 0 ? item.totalValue / item.totalQuantity : 0,
    }))

    await client.close()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching stock summary:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
