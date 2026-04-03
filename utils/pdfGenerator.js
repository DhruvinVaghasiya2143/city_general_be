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

const generateAppointmentPDF = (appointment) => {
  try {
    const doc = new jsPDF();
    
    // Theme Colors
    const primaryBlue = [19, 127, 236]; // #137fec
    const lightBlue = [207, 230, 253]; // #cfe6fd
    const grayText = [100, 116, 139]; // #64748b
    const darkSlate = [15, 23, 42]; // #0f172a

    // -- HEADER SECTION (Blue Branding) --
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, 210, 28, "F");

    // "Appointment" Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Appointment Confirmation", 15, 20);

    // Hospital Details
    doc.setFontSize(14);
    doc.text("City General Hospital", 195, 12, { align: "right" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Ahmedabad, Gujarat, India", 195, 19, { align: "right" });
    doc.text("Postal Code: 380001", 195, 23, { align: "right" });

    // -- WATERMARK (Premium LocalHospitalIcon Vector) --
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.015 }));
    doc.setFillColor(180, 180, 180);
    doc.roundedRect(65, 105, 80, 80, 12, 12, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(100, 120, 10, 50, "F");
    doc.rect(80, 140, 50, 10, "F");
    doc.restoreGraphicsState();

    // -- MIDDLE SECTION (Patient & Metadata) --
    const middleY = 45;
    doc.setTextColor(...darkSlate);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT DETAILS:", 15, middleY);
    doc.setFontSize(14);
    doc.text(`${appointment.patientName || "N/A"}`, 15, middleY + 8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayText);
    doc.text(`Contact: ${appointment.phone || "N/A"}`, 15, middleY + 15);
    doc.text(`Email: ${appointment.email || "N/A"}`, 15, middleY + 20);

    // Appointment Metadata (Right Aligned)
    doc.setTextColor(...darkSlate);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DATE", 195, middleY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(appointment.date || Date.now()).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      195,
      middleY + 5,
      { align: "right" }
    );

    doc.setFont("helvetica", "bold");
    doc.text("TIME", 195, middleY + 15, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(appointment.date || Date.now()).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      195,
      middleY + 20,
      { align: "right" }
    );

    // -- DOCTOR SECTION --
    const doctorY = middleY + 35;
    doc.setFillColor(...lightBlue);
    doc.rect(15, doctorY, 180, 25, "F");
    doc.setTextColor(...darkSlate);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ASSIGNED SPECIALIST:", 20, doctorY + 8);
    doc.setFontSize(12);
    doc.text(`Dr. ${appointment.doctorName || "N/A"}`, 20, doctorY + 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...primaryBlue);
    doc.text(`${appointment.doctorSpecialty || "Specialist"}`, 185, doctorY + 16, { align: "right" });

    // -- CONCERN TABLE --
    autoTable(doc, {
      startY: doctorY + 30,
      head: [["CONSULTATION DETAILS"]],
      body: [
        ["Reason for Visit:"],
        [appointment.concern || "Regular Check-up"]
      ],
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
      margin: { left: 15, right: 15 },
    });

    // -- FOOTER --
    const footerY = doc.lastAutoTable.finalY + 15;
    doc.setTextColor(...grayText);
    doc.setFontSize(8);
    doc.text("Instructions:", 15, footerY);
    doc.text("1. Please arrive 15 minutes before your scheduled appointment time.", 15, footerY + 5);
    doc.text("2. Please bring all relevant medical records and a valid photo ID.", 15, footerY + 10);
    doc.text("3. To cancel or reschedule, please contact us at least 24 hours in advance.", 15, footerY + 15);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryBlue);
    doc.text("City General Hospital - Dedicated to your health and well-being.", 105, footerY + 30, { align: "center" });

    // Return the PDF as a buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating Appointment PDF:", error);
    throw error;
  }
};

const generateCancellationPDF = (appointment) => {
  try {
    const doc = new jsPDF();
    
    // Theme Colors
    const primaryBlue = [19, 127, 236]; // #137fec
    const lightBlue = [207, 230, 253]; // #cfe6fd
    const grayText = [100, 116, 139]; // #64748b
    const darkSlate = [15, 23, 42]; // #0f172a
    const warningRed = [220, 38, 38]; // #dc2626 (For Cancellation Status)

    // -- HEADER SECTION (Blue Branding) --
    doc.setFillColor(...primaryBlue);
    doc.rect(0, 0, 210, 28, "F");

    // "Cancellation" Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Cancellation Record", 15, 20);

    // Hospital Details
    doc.setFontSize(14);
    doc.text("City General Hospital", 195, 12, { align: "right" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Ahmedabad, Gujarat, India", 195, 19, { align: "right" });
    doc.text("Postal Code: 380001", 195, 23, { align: "right" });

    // -- WATERMARK --
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.015 }));
    doc.setFillColor(180, 180, 180);
    doc.roundedRect(65, 105, 80, 80, 12, 12, "F");
    doc.setFillColor(255, 255, 255);
    doc.rect(100, 120, 10, 50, "F");
    doc.rect(80, 140, 50, 10, "F");
    doc.restoreGraphicsState();

    // -- MIDDLE SECTION (Patient & Metadata) --
    const middleY = 45;
    doc.setTextColor(...darkSlate);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PATIENT DETAILS:", 15, middleY);
    doc.setFontSize(14);
    const patientName = `${appointment.patientId?.firstName || "N/A"} ${appointment.patientId?.lastName || ""}`.trim();
    doc.text(patientName, 15, middleY + 8);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayText);
    doc.text(`Contact: ${appointment.patientId?.phone || "N/A"}`, 15, middleY + 15);
    doc.text(`Email: ${appointment.patientId?.email || "N/A"}`, 15, middleY + 20);

    // Appointment Metadata (Right Aligned)
    doc.setTextColor(...darkSlate);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DATE", 195, middleY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(
      new Date(appointment.date || Date.now()).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      195,
      middleY + 5,
      { align: "right" }
    );

    // -- STATUS BANNER --
    const bannerY = middleY + 35;
    doc.setFillColor(...lightBlue);
    doc.rect(15, bannerY, 180, 25, "F");
    doc.setTextColor(...warningRed);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("CANCELLED", 105, bannerY + 17, { align: "center" });

    // -- DETAILS SECTION --
    const detailY = bannerY + 35;
    doc.setTextColor(...darkSlate);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("APPOINTMENT DETAILS:", 15, detailY);
    
    autoTable(doc, {
      startY: detailY + 5,
      body: [
        ["Physician:", `Dr. ${appointment.doctorId?.firstName || "N/A"} ${appointment.doctorId?.lastName || ""}`.trim()],
        ["Area of Concern:", appointment.concern || "Regular Check-up"],
        ["Reference ID:", appointment._id.toString().slice(-8).toUpperCase()]
      ],
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50 },
        1: { cellWidth: "auto" }
      },
      margin: { left: 15, right: 15 },
    });

    // -- FOOTER --
    const footerY = 270;
    doc.setTextColor(...grayText);
    doc.setFontSize(8);
    doc.text("City General Hospital - Automated Cancellation Record", 105, footerY, { align: "center" });
    doc.text("If you have any questions, please contact our support team.", 105, footerY + 5, { align: "center" });

    // Return the PDF as a buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return pdfBuffer;
  } catch (error) {
    console.error("Error generating Cancellation PDF:", error);
    throw error;
  }
};

module.exports = { generateInvoicePDF, generateAppointmentPDF, generateCancellationPDF };
