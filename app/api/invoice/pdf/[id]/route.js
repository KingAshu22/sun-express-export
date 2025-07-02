import { NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const uri = process.env.MONGODB_URI

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "opening"

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db("sun-express-export")

    let collection
    switch (type) {
      case "inward":
        collection = db.collection("stock_inward")
        break
      case "outward":
        collection = db.collection("stock_outward")
        break
      default:
        collection = db.collection("opening_stock")
    }

    const record = await collection.findOne({ _id: new ObjectId(id) })

    if (!record) {
      await client.close()
      return NextResponse.json({ message: "Record not found" }, { status: 404 })
    }

    // Get party details
    let party = null
    if (record.partyId) {
      party = await db.collection("parties").findOne({ _id: new ObjectId(record.partyId) })
    }

    await client.close()

    // Generate PDF-ready HTML with proper formatting
    const htmlContent = generatePDFHTML(record, party, type)

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoice-${record.invoiceNumber || record.purchaseInvoiceNumber || id}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

function formatAmount(amount) {
  return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
}

function generatePDFHTML(record, party, type) {
  const getTypeTitle = (type) => {
    switch (type) {
      case "opening":
        return "Opening Stock Invoice"
      case "inward":
        return "Purchase Invoice"
      case "outward":
        return "Sales Invoice"
      default:
        return "Invoice"
    }
  }

  const getOurInvoiceNumber = () => {
    if (record.type === "inward" || type === "inward") {
      return record.purchaseInvoiceNumber || record.invoiceNumber
    }
    return record.invoiceNumber
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getTypeTitle(type)} - ${getOurInvoiceNumber()}</title>
    <style>
        @page {
            size: A4;
            margin: 10mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        
        .invoice-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
        }
        
        .header h1 {
            font-size: 28px;
            color: #2563eb;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .header .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .header .invoice-type {
            font-size: 16px;
            font-weight: bold;
            color: #000;
        }
        
        .details-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            gap: 30px;
        }
        
        .details-box {
            flex: 1;
            border: 2px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        
        .details-box h3 {
            font-size: 14px;
            color: #2563eb;
            margin-bottom: 12px;
            border-bottom: 2px solid #eee;
            padding-bottom: 6px;
            font-weight: bold;
        }
        
        .details-box p {
            margin-bottom: 6px;
            font-size: 12px;
        }
        
        .details-box strong {
            font-weight: bold;
            color: #333;
        }
        
        .items-section h3 {
            font-size: 16px;
            margin-bottom: 12px;
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
            border: 2px solid #333;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: 8px 6px;
            text-align: left;
        }
        
        .items-table th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
        }
        
        .items-table .text-right {
            text-align: right;
        }
        
        .items-table .text-center {
            text-align: center;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        .totals-table {
            border-collapse: collapse;
            font-size: 12px;
            min-width: 300px;
            border: 2px solid #333;
        }
        
        .totals-table td {
            border: 1px solid #333;
            padding: 8px 12px;
        }
        
        .totals-table .label {
            background-color: #f8f9fa;
            font-weight: bold;
            width: 60%;
        }
        
        .totals-table .amount {
            text-align: right;
            font-weight: bold;
            width: 40%;
        }
        
        .grand-total {
            background-color: #2563eb !important;
            color: white !important;
            font-weight: bold;
            font-size: 14px;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            border-top: 2px solid #ddd;
            padding-top: 15px;
            font-size: 11px;
            color: #666;
        }
        
        .footer p {
            margin-bottom: 4px;
        }
        
        .terms {
            margin-top: 25px;
            font-size: 10px;
            color: #666;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        
        .terms h4 {
            font-size: 11px;
            margin-bottom: 8px;
            color: #333;
            font-weight: bold;
        }
        
        .terms ul {
            margin-left: 15px;
        }
        
        .terms li {
            margin-bottom: 3px;
        }
        
        .company-footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #888;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
        
        @media print {
            body { 
                margin: 0; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .invoice-container { 
                margin: 0; 
                padding: 0; 
                box-shadow: none;
            }
            
            .header h1 {
                color: #2563eb !important;
            }
            
            .details-box h3 {
                color: #2563eb !important;
            }
            
            .items-table th {
                background-color: #2563eb !important;
                color: white !important;
            }
            
            .grand-total {
                background-color: #2563eb !important;
                color: white !important;
            }
        }
    </style>
    <script>
        window.onload = function() {
            // Auto-convert to PDF when page loads
            setTimeout(function() {
                window.print();
            }, 1000);
        }
    </script>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <h1>SUN EXPRESS EXPORT</h1>
            <div class="subtitle">Complete Stock Management Solution</div>
            <div class="invoice-type">${getTypeTitle(type)}</div>
        </div>
        
        <div class="details-section">
            <div class="details-box">
                <h3>Invoice Information</h3>
                <p><strong>Our Invoice No:</strong> ${getOurInvoiceNumber()}</p>
                ${type === "inward" && record.partyInvoiceNumber ? `<p><strong>Party Invoice No:</strong> ${record.partyInvoiceNumber}</p>` : ""}
                <p><strong>Invoice Date:</strong> ${new Date(record.date).toLocaleDateString("en-IN")}</p>
                <p><strong>Invoice Type:</strong> ${getTypeTitle(type)}</p>
                <p><strong>Generated On:</strong> ${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}</p>
            </div>
            
            <div class="details-box">
                <h3>${type === "outward" ? "Customer Details" : "Supplier Details"}</h3>
                ${
                  party
                    ? `
                    <p><strong>Name:</strong> ${party.name}</p>
                    <p><strong>Address:</strong> ${party.address}</p>
                    <p><strong>Contact:</strong> ${party.contact}</p>
                    <p><strong>Email:</strong> ${party.email}</p>
                    <p><strong>GST Number:</strong> ${party.gstNumber || "Not Available"}</p>
                    <p><strong>Party Type:</strong> ${party.type === "purchase" ? "Purchase Party" : "Sales Party"}</p>
                `
                    : `
                    <p style="color: #999; font-style: italic;">Party details not available</p>
                `
                }
            </div>
        </div>
        
        <div class="items-section">
            <h3>Item Details</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 6%;">S.No</th>
                        <th style="width: 30%;">Item Name</th>
                        <th style="width: 12%;">HSN Code</th>
                        <th style="width: 10%;">Quantity</th>
                        <th style="width: 14%;">Rate (₹)</th>
                        <th style="width: 10%;">Discount (%)</th>
                        <th style="width: 18%;">Amount (₹)</th>
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
                            <td class="text-center">${item.hsnCode}</td>
                            <td class="text-right">${formatAmount(item.quantity)}</td>
                            <td class="text-right">₹${formatAmount(item.rate)}</td>
                            <td class="text-right">${formatAmount(item.discount)}</td>
                            <td class="text-right">₹${formatAmount(item.total)}</td>
                        </tr>
                    `,
                        )
                        .join("") ||
                      '<tr><td colspan="7" class="text-center" style="padding: 20px; font-style: italic;">No items found</td></tr>'
                    }
                </tbody>
            </table>
        </div>
        
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="label">Subtotal:</td>
                    <td class="amount">₹${formatAmount(record.subtotal)}</td>
                </tr>
                <tr>
                    <td class="label">CGST (${formatAmount(record.cgst)}%):</td>
                    <td class="amount">₹${formatAmount(((record.subtotal || 0) * (record.cgst || 0)) / 100)}</td>
                </tr>
                <tr>
                    <td class="label">SGST (${formatAmount(record.sgst)}%):</td>
                    <td class="amount">₹${formatAmount(((record.subtotal || 0) * (record.sgst || 0)) / 100)}</td>
                </tr>
                <tr>
                    <td class="label">IGST (${formatAmount(record.igst)}%):</td>
                    <td class="amount">₹${formatAmount(((record.subtotal || 0) * (record.igst || 0)) / 100)}</td>
                </tr>
                <tr class="grand-total">
                    <td class="label">GRAND TOTAL:</td>
                    <td class="amount">₹${formatAmount(record.grandTotal)}</td>
                </tr>
            </table>
        </div>
        
        <div class="terms">
            <h4>Terms & Conditions:</h4>
            <ul>
                <li>All disputes are subject to local jurisdiction only.</li>
                <li>Payment terms: As per agreement between parties.</li>
                <li>Goods once sold will not be taken back without prior approval.</li>
                <li>Interest @ 18% per annum will be charged on delayed payments.</li>
                <li>Subject to ${party?.address?.split(",").pop()?.trim() || "Local"} jurisdiction only.</li>
            </ul>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>This is a computer generated invoice and does not require physical signature.</p>
        </div>
        
        <div class="company-footer">
            <p>Sun Express Export - Complete Stock Management Solution</p>
            <p>Email: info@sunexpressexport.com | Phone: +91-XXXXXXXXXX</p>
        </div>
    </div>
</body>
</html>`
}
