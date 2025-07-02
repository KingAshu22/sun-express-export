import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    // Get the record based on type
    let record
    let collectionName

    switch (type) {
      case "opening":
        collectionName = "opening_stock"
        break
      case "inward":
        collectionName = "stock_inward"
        break
      case "outward":
        collectionName = "stock_outward"
        break
      default:
        await client.close()
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    record = await db.collection(collectionName).findOne({ _id: new ObjectId(id) })

    if (!record) {
      await client.close()
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // Get party details
    const party = await db.collection("parties").findOne({ _id: new ObjectId(record.partyId) })

    await client.close()

    // Format amount function
    const formatAmount = (amount) => {
      return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
    }

    // Format date to dd/mm/yyyy
    const formatDate = (dateString) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      const day = date.getDate().toString().padStart(2, "0")
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    }

    // Generate HTML for PDF
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${record.invoiceNumber || record.purchaseInvoiceNumber}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #000; padding-bottom: 15px; }
        .header h1 { font-size: 24px; margin-bottom: 8px; color: #000; }
        .header p { font-size: 14px; margin-bottom: 5px; }
        .invoice-type { font-size: 16px; font-weight: bold; color: #666; margin-top: 10px; }
        .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .details > div { flex: 1; margin-right: 30px; }
        .details > div:last-child { margin-right: 0; }
        .details h3 { font-size: 14px; margin-bottom: 10px; border-bottom: 2px solid #ddd; padding-bottom: 5px; color: #333; }
        .details p { margin-bottom: 5px; font-size: 11px; }
        .details strong { color: #000; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 10px; }
        th { background-color: #f5f5f5; font-weight: bold; color: #000; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
        .totals table { width: 250px; border: 2px solid #333; }
        .totals th, .totals td { border: 1px solid #333; padding: 6px; }
        .grand-total { font-weight: bold; background-color: #f0f0f0; font-size: 12px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; border-top: 1px solid #ccc; padding-top: 15px; color: #666; }
        .company-info { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SUN EXPRESS EXPORT</h1>
        <div class="company-info">
          <p>Stock Management System</p>
          <p>Professional Invoice Generation</p>
        </div>
        <div class="invoice-type">
          ${type === "opening" ? "Opening Stock Invoice" : type === "inward" ? "Purchase Invoice" : "Sales Invoice"}
        </div>
      </div>
      
      <div class="details">
        <div>
          <h3>Invoice Details</h3>
          <p><strong>Invoice No:</strong> ${type === "inward" ? record.purchaseInvoiceNumber || record.invoiceNumber : record.invoiceNumber}</p>
          ${type === "inward" && record.partyInvoiceNumber ? `<p><strong>Party Invoice:</strong> ${record.partyInvoiceNumber}</p>` : ""}
          <p><strong>Date:</strong> ${formatDate(record.date)}</p>
          <p><strong>Type:</strong> ${type === "opening" ? "Opening Stock" : type === "inward" ? "Purchase" : "Sales"}</p>
        </div>
        <div>
          <h3>Party Details</h3>
          ${
            party
              ? `
            <p><strong>Name:</strong> ${party.name}</p>
            <p><strong>Address:</strong> ${party.address}</p>
            <p><strong>Contact:</strong> ${party.contact}</p>
            <p><strong>Email:</strong> ${party.email}</p>
            <p><strong>GST Number:</strong> ${party.gstNumber || "N/A"}</p>
          `
              : "<p>Party details not available</p>"
          }
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 8%;">S.No</th>
            <th style="width: 35%;">Item Name</th>
            <th style="width: 15%;">HSN Code</th>
            <th class="text-right" style="width: 10%;">Quantity</th>
            <th class="text-right" style="width: 12%;">Rate (₹)</th>
            <th class="text-right" style="width: 8%;">Disc%</th>
            <th class="text-right" style="width: 12%;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${
            record.items
              ?.map(
                (item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.hsnCode}</td>
              <td class="text-right">${formatAmount(item.quantity)}</td>
              <td class="text-right">${formatAmount(item.rate)}</td>
              <td class="text-right">${formatAmount(item.discount)}</td>
              <td class="text-right">${formatAmount(item.total)}</td>
            </tr>
          `,
              )
              .join("") || ""
          }
        </tbody>
      </table>
      
      <div class="totals">
        <table>
          <tr><td><strong>Subtotal:</strong></td><td class="text-right"><strong>₹${formatAmount(record.subtotal)}</strong></td></tr>
          <tr><td>CGST (${formatAmount(record.cgst)}%):</td><td class="text-right">₹${formatAmount(((record.subtotal || 0) * (record.cgst || 0)) / 100)}</td></tr>
          <tr><td>SGST (${formatAmount(record.sgst)}%):</td><td class="text-right">₹${formatAmount(((record.subtotal || 0) * (record.sgst || 0)) / 100)}</td></tr>
          <tr><td>IGST (${formatAmount(record.igst)}%):</td><td class="text-right">₹${formatAmount(((record.subtotal || 0) * (record.igst || 0)) / 100)}</td></tr>
          <tr class="grand-total">
            <td><strong>Grand Total:</strong></td>
            <td class="text-right"><strong>₹${formatAmount(record.grandTotal)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="footer">
        <p><strong>Thank you for your business!</strong></p>
        <p>This is a computer-generated invoice.</p>
        <p>Generated on: ${formatDate(new Date().toISOString())} at ${new Date().toLocaleTimeString("en-IN")}</p>
      </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
