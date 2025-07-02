import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET(request, { params }) {
  try {
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    // Find the record in all collections
    const collections = ["opening_stock", "stock_inward", "stock_outward"]
    let record = null
    let recordType = null

    for (const collectionName of collections) {
      const collection = db.collection(collectionName)
      const found = await collection.findOne({ _id: new ObjectId(id) })
      if (found) {
        record = found
        recordType =
          collectionName === "opening_stock" ? "opening" : collectionName === "stock_inward" ? "inward" : "outward"
        break
      }
    }

    if (!record) {
      await client.close()
      return NextResponse.json({ message: "Record not found" }, { status: 404 })
    }

    // Get party details
    const party = await db.collection("parties").findOne({ _id: new ObjectId(record.partyId) })

    await client.close()

    // Generate PDF content (simplified HTML for demonstration)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${record.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sun Express Export</h1>
          <h2>${recordType === "opening" ? "Opening Stock Invoice" : recordType === "inward" ? "Purchase Invoice" : "Sales Invoice"}</h2>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Invoice Details:</h3>
            <p><strong>Invoice No:</strong> ${record.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(record.date).toLocaleDateString()}</p>
          </div>
          <div>
            <h3>Party Details:</h3>
            <p><strong>Name:</strong> ${party?.name || "N/A"}</p>
            <p><strong>Address:</strong> ${party?.address || "N/A"}</p>
            <p><strong>GST No:</strong> ${party?.gstNumber || "N/A"}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>HSN Code</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Discount %</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${
              record.items
                ?.map(
                  (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.hsnCode}</td>
                <td>${item.quantity}</td>
                <td>₹${item.rate}</td>
                <td>${item.discount || 0}%</td>
                <td>₹${item.total?.toFixed(2) || "0.00"}</td>
              </tr>
            `,
                )
                .join("") || ""
            }
          </tbody>
        </table>
        
        <div class="totals">
          <p><strong>Subtotal: ₹${record.subtotal?.toFixed(2) || "0.00"}</strong></p>
          <p><strong>CGST (${record.cgst || 0}%): ₹${((record.subtotal * (record.cgst || 0)) / 100).toFixed(2)}</strong></p>
          <p><strong>SGST (${record.sgst || 0}%): ₹${((record.subtotal * (record.sgst || 0)) / 100).toFixed(2)}</strong></p>
          <p><strong>IGST (${record.igst || 0}%): ₹${((record.subtotal * (record.igst || 0)) / 100).toFixed(2)}</strong></p>
          <h3><strong>Grand Total: ₹${record.grandTotal?.toFixed(2) || "0.00"}</strong></h3>
        </div>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="invoice-${record.invoiceNumber}.html"`,
      },
    })
  } catch (error) {
    console.error("Error downloading invoice:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
