import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // day, week, month, year
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    // Calculate date range
    let dateFilter = {}
    const now = new Date()

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }
    } else {
      switch (period) {
        case "day":
          dateFilter = {
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0],
            },
          }
          break
        case "week":
          const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
          dateFilter = {
            date: {
              $gte: weekStart.toISOString().split("T")[0],
            },
          }
          break
        case "month":
          dateFilter = {
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
            },
          }
          break
        case "year":
          dateFilter = {
            date: {
              $gte: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
            },
          }
          break
      }
    }

    // Get analytics data
    const [openingStock, stockInward, stockOutward, parties] = await Promise.all([
      db.collection("opening_stock").find(dateFilter).toArray(),
      db.collection("stock_inward").find(dateFilter).toArray(),
      db.collection("stock_outward").find(dateFilter).toArray(),
      db.collection("parties").find({}).toArray(),
    ])

    // Calculate totals
    const totalPurchases = [...openingStock, ...stockInward].reduce((sum, record) => sum + (record.grandTotal || 0), 0)
    const totalSales = stockOutward.reduce((sum, record) => sum + (record.grandTotal || 0), 0)
    const totalTransactions = openingStock.length + stockInward.length + stockOutward.length

    // Top selling items
    const itemSales = {}
    stockOutward.forEach((record) => {
      record.items?.forEach((item) => {
        const key = `${item.name}_${item.hsnCode}`
        if (!itemSales[key]) {
          itemSales[key] = {
            name: item.name,
            hsnCode: item.hsnCode,
            quantity: 0,
            revenue: 0,
          }
        }
        itemSales[key].quantity += Number.parseFloat(item.quantity || 0)
        itemSales[key].revenue += Number.parseFloat(item.total || 0)
      })
    })

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Top customers/suppliers
    const partyStats = {}
    const allRecords = [...openingStock, ...stockInward, ...stockOutward]

    allRecords.forEach((record) => {
      if (!partyStats[record.partyId]) {
        const party = parties.find((p) => p._id.toString() === record.partyId)
        partyStats[record.partyId] = {
          name: party?.name || "Unknown",
          type: party?.type || "unknown",
          totalAmount: 0,
          transactionCount: 0,
        }
      }
      partyStats[record.partyId].totalAmount += record.grandTotal || 0
      partyStats[record.partyId].transactionCount += 1
    })

    const topParties = Object.values(partyStats)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    // Monthly trends (last 12 months)
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0]
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0]

      const monthFilter = {
        date: { $gte: monthStart, $lte: monthEnd },
      }

      const [monthOpening, monthInward, monthOutward] = await Promise.all([
        db.collection("opening_stock").find(monthFilter).toArray(),
        db.collection("stock_inward").find(monthFilter).toArray(),
        db.collection("stock_outward").find(monthFilter).toArray(),
      ])

      monthlyData.push({
        month: date.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        purchases: [...monthOpening, ...monthInward].reduce((sum, r) => sum + (r.grandTotal || 0), 0),
        sales: monthOutward.reduce((sum, r) => sum + (r.grandTotal || 0), 0),
        transactions: monthOpening.length + monthInward.length + monthOutward.length,
      })
    }

    await client.close()

    return NextResponse.json({
      summary: {
        totalPurchases,
        totalSales,
        totalTransactions,
        profit: totalSales - totalPurchases,
        profitMargin: totalPurchases > 0 ? ((totalSales - totalPurchases) / totalPurchases) * 100 : 0,
      },
      topItems,
      topParties,
      monthlyTrends: monthlyData,
      period,
      dateRange: {
        start: startDate || dateFilter.date?.$gte,
        end: endDate || new Date().toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
