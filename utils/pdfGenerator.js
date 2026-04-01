const { jsPDF } = require("jspdf");
const { default: autoTable } = require("jspdf-autotable");

const generateInvoicePDF = (invoice) => {
  try {
    const doc = new jsPDF();
    
    // Theme Colors
    const primaryBlue = [19, 127, 236]; // #137fec
    const lightBlue = [207, 230, 253]; // #cfe6fd (Light blue for notes)
    const grayText = [100, 116, 139]; // #64748b
    const darkSlate = [15, 23, 42]; // #0f172a

    // -- HEADER SECTION (Ultra Compact Solid Blue) --
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, 210, 28, "F");

    // Monitor/Invoice Icon Placeholder (Scaled Down)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.roundedRect(15, 4, 12, 9, 2, 2, "D"); // Monitor screen
    doc.line(18, 13, 18, 15); // Monitor neck
    doc.line(24, 13, 24, 15);
    doc.line(16, 15, 26, 15); // Monitor base
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.text("</>", 21, 10, { align: "center" });

    // "Invoice" Text (Compact Font)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Invoice", 15, 24);

    // Hospital Details (Ultra Compact & Centered in new height)
    doc.setFontSize(14);
    doc.text("City General Hospital", 195, 12, { align: "right" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Ahmedabad, Gujarat, India", 195, 19, { align: "right" });
    doc.text("Postal Code: 380001", 195, 23, { align: "right" });

    // -- WATERMARK (Premium LocalHospitalIcon Vector) --
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.015 })); // Extreme subtlety for true watermark look
    doc.setFillColor(180, 180, 180);

    // Draw Icon Body (Filled Rounded Square)
    doc.roundedRect(65, 105, 80, 80, 12, 12, "F");

    // Draw Centered Cross (Plus sign as a knockout/white fill)
    doc.setFillColor(255, 255, 255);
    doc.rect(100, 120, 10, 50, "F"); // Vertical bar
    doc.rect(80, 140, 50, 10, "F"); // Horizontal bar
    doc.restoreGraphicsState();

    // -- MIDDLE SECTION (Bill To & Metadata) --
    const middleY = 45;
    doc.setTextColor(...darkSlate);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 15, middleY);
    doc.setFontSize(14);
    doc.text(invoice.patientName || "N/A", 15, middleY + 8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayText);
    if (invoice.mobileNumber) {
      doc.text(`Contact: ${invoice.mobileNumber}`, 15, middleY + 15);
    }
    if (invoice.emailId) {
      doc.text(`Email: ${invoice.emailId}`, 15, middleY + 20);
    }

    // Invoice Metadata (Right Aligned)
    doc.setTextColor(...darkSlate);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE #", 195, middleY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkSlate);
    doc.text(invoice.invoiceNumber || "N/A", 195, middleY + 5, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.text("DATE", 195, middleY + 15, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(invoice.createdAt || Date.now()).toLocaleDateString(),
      195,
      middleY + 20,
      { align: "right" },
    );

    // -- ITEMS TABLE --
    const items = invoice.items || [];
    const tableData = items.map((item, index) => {
      // We expect item to just be the cart items the UI passes or the drug invoice
      return [
        `Item ${index + 1}`,
        item.name || item.drugName || "Medicine",
        item.quantity,
        `Rs. ${item.price ? item.price.toLocaleString() : "0"}`,
        `Rs. ${((item.price * item.quantity) || item.total || 0).toLocaleString()}`,
      ];
    });

    autoTable(doc, {
      startY: middleY + 30,
      head: [["ITEMS", "DESCRIPTION", "QUANTITY", "PRICE", "AMOUNT"]],
      body: tableData,
      theme: "plain",
      headStyles: {
        textColor: [0, 0, 0],
        fontSize: 8,
        fontStyle: "bold",
        cellPadding: 4,
      },
      bodyStyles: {
        textColor: darkSlate,
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: "auto" },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 28 },
        4: { halign: "right", cellWidth: 32 },
      },
      margin: { left: 15, right: 15 },
    });

  // -- SUMMARY SECTION (Calculations) --
  const subtotal = items.reduce((sum, item) => sum + ((item.price * item.quantity) || item.total || 0), 0);
  const taxAmount = subtotal * 0.05;
  const summaryY = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(8);
  doc.setTextColor(...grayText);
  doc.text(`Sub-total:`, 160, summaryY, { align: "right" });
  doc.text(`Rs. ${subtotal.toLocaleString()}`, 195, summaryY, { align: "right" });

  doc.text(`Tax (5%):`, 160, summaryY + 5, { align: "right" });
  doc.text(`Rs. ${taxAmount.toLocaleString()}`, 195, summaryY + 5, { align: "right" });

  // -- FOOTER BOXES (Notes & Total Due) --
  const footerY = summaryY + 10;

  // Notes Box (Light Blue)
  doc.setFillColor(...lightBlue);
  doc.rect(15, footerY, 105, 28, "F");
  doc.setTextColor(...darkSlate);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("NOTES:", 20, footerY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "Medicine once sold cannot be returned. Please keep this invoice for your records. This invoice was generated with MedCore.",
    20,
    footerY + 15,
    { maxWidth: 95 },
  );

  // Total Box (Solid Blue)
  doc.setFillColor(...primaryBlue);
  doc.rect(120, footerY, 75, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL DUE", 188, footerY + 10, { align: "right" });
  doc.setFontSize(16);
  const totalAmount = invoice.totalAmount || subtotal + taxAmount;
  doc.text(`Rs. ${totalAmount.toLocaleString()}`, 188, footerY + 22, { align: "right" });
  
    // Return the PDF as a buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

module.exports = { generateInvoicePDF };
