const { jsPDF } = require("jspdf");
const { default: autoTable } = require("jspdf-autotable");

try {
    const doc = new jsPDF();
    const gState = new doc.GState({ opacity: 0.015 });
    console.log('Success, GState opacity:', gState.opacity);
} catch (error) {
    console.error('Error during PDF generation (GState):', error);
}
