const { jsPDF } = require("jspdf");
const { default: autoTable } = require("jspdf-autotable");

try {
    const doc = new jsPDF();
    autoTable(doc, {
        head: [['Name', 'Price']],
        body: [['Drug A', 100]],
    });
    const finalY = doc.lastAutoTable.finalY;
    console.log('Success, finalY:', finalY);
    const buffer = Buffer.from(doc.output("arraybuffer"));
    console.log('Buffer size:', buffer.length);
} catch (error) {
    console.error('Error during PDF generation:', error);
}
