import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/sun-express-export"

export async function GET(request, { params }) {
  try {
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const openingStock = db.collection("opening_stock")
    const parties = db.collection("parties")

    const stock = await openingStock.findOne({ _id: new ObjectId(id) })

    if (!stock) {
      await client.close()
      return NextResponse.json({ message: "Opening stock not found" }, { status: 404 })
    }

    // Populate party information
    if (stock.partyId) {
      const party = await parties.findOne({ _id: new ObjectId(stock.partyId) })
      if (party) {
        stock.partyName = party.name
        stock.partyAddress = party.address
        stock.partyContact = party.contact
        stock.partyEmail = party.email
        stock.partyGstNumber = party.gstNumber
      }
    }

    await client.close()

    // Generate HTML content for PDF
    const htmlContent = generateInvoiceHTML(stock, "Purchase Invoice - Opening Stock")

    // For now, return the HTML content as a downloadable file
    // In a production environment, you would use a library like puppeteer to generate PDF
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="opening-stock-${id}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating invoice download:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice, title) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text
