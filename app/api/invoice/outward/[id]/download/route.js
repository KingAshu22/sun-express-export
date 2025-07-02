import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET(request, { params }) {
  try {
    const { id } = params

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")
    const stockOutward = db.collection("stock_outward")
    const parties = db.collection("parties")

    const stock = await stockOutward.findOne({ _id: new ObjectId(id) })

    if (!stock) {
      await client.close()
      return NextResponse.json({ message: "Stock outward not found" }, { status: 404 })
    }

    // Populate party information
    let party = null
    if (stock.partyId) {
      party = await parties.findOne({ _id: new ObjectId(stock.partyId) })
    }

    await client.close()

    // Generate HTML content for PDF
    const htmlContent = generateInvoiceHTML(stock, party, "Sales Invoice")

    // Return the HTML content as a downloadable file
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="sales-invoice-${id}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating invoice download:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function generateInvoiceHTML(invoice, party, title) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          line-height: 1.4;
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .invoice-details { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px; 
        }
        .invoice-details > div {
          flex: 1;
        }
        .invoice-details h3 {
          color: #007bff;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .invoice-details p {
          margin: 8px 0;
        }
        .invoice-details strong {
          color: #333;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
          font-size: 14px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px 8px; 
          text-align: left; 
        }
        th { 
          background-color: #f8f9fa; 
          font-weight: bold;
          color: #333;
        }
        .text-right { 
          text-align: right; 
        }
        .text-center { 
          text-align: center; 
        }
        .totals {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-table {
          width: 300px;
          margin-left: auto;
        }
        .totals-table td {
          padding: 8px 12px;
        }
        .grand-total {
          font-weight: bold;
          font-size: 16px;
          background-color: #f8f9fa;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Sun Express Export</h1>
        <p>Stock Management System</p>
        <p><strong>${title}</strong></p>
      </div>
      
      <div class="invoice-details">
        <div>
          <h3>Invoice Details</h3>
          <p><strong>Sales Invoice No:</strong> ${invoice.invoiceNumber || "N/A"}</p>
          <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
          <p><strong>Type:</strong> Sales Invoice</p>
        </div>
        <div>
          <h3>Customer Details</h3>
          ${
            party
              ? `
            <p><strong>Name:</strong> ${party.name}</p>
            <p><strong>Address:</strong> ${party.address}</p>
            <p><strong>Contact:</strong> ${party.contact}</p>
            <p><strong>Email:</strong> ${party.email}</p>
            <p><strong>GST No:</strong> ${party.gstNumber || "N/A"}</p>
          `
              : "<p>Customer details not available</p>"
          }
        </div>
      </div>
      
      <h3>Items</h3>
      <table>
        <thead>
          <tr>
            <th class="text-center">S.No</th>
            <th>Item Name</th>
            <th>HSN Code</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Rate (₹)</th>
            <th class="text-right">Discount (%)</th>
            <th class="text-right">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${
            invoice.items
              ?.map(
                (item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.hsnCode}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${Number.parseFloat(item.rate || 0).toFixed(2)}</td>
              <td class="text-right">${item.discount || 0}</td>
              <td class="text-right">${Number.parseFloat(item.total || 0).toFixed(2)}</td>
            </tr>
          `,
              )
              .join("") || '<tr><td colspan="7" class="text-center">No items found</td></tr>'
          }
        </tbody>
      </table>
      
      <div class="totals">
        <table class="totals-table">
          <tr>
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">₹${Number.parseFloat(invoice.subtotal || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>CGST (${invoice.cgst || 0}%):</strong></td>
            <td class="text-right">₹${(((invoice.subtotal || 0) * (invoice.cgst || 0)) / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>SGST (${invoice.sgst || 0}%):</strong></td>
            <td class="text-right">₹${(((invoice.subtotal || 0) * (invoice.sgst || 0)) / 100).toFixed(2)}</td>
          </tr>
          <tr>
            <td><strong>IGST (${invoice.igst || 0}%):</strong></td>
            <td class="text-right">₹${(((invoice.subtotal || 0) * (invoice.igst || 0)) / 100).toFixed(2)}</td>
          </tr>
          <tr class="grand-total">
            <td><strong>Grand Total:</strong></td>
            <td class="text-right"><strong>₹${Number.parseFloat(invoice.grandTotal || 0).toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is a computer generated invoice.</p>
        <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `
}
