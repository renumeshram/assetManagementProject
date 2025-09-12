// utils/pdfExport.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportEwasteReportToPDF = (reportData, filters, selectedLocation) => {
  if (!reportData) return;

  const doc = new jsPDF();
  let yPos = 15;

  // Helper Functions
  const getPeriodDescription = () => {
    if (filters.period === "month") {
      const monthName = new Date(0, filters.month - 1).toLocaleString("default", { month: "long" });
      return `${monthName} ${filters.year}`;
    } else if (filters.period === "year") {
      return `Year ${filters.year}`;
    } else if (filters.period === "custom") {
      return `${filters.startDate} to ${filters.endDate}`;
    }
    return "";
  };

  const addHeader = () => {
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('E-waste Management Report', 20, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 35);
    
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 40, 190, 40);
    
    return 50;
  };

  const addFilters = (startY) => {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Report Filters', 20, startY);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const filterText = [
      `Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`,
      `Period: ${getPeriodDescription()}`,
      `Location: ${selectedLocation?.name || "All Locations"}`,
      `Department: ${filters.department || "All Departments"}`,
      `Section: ${filters.section || "All Sections"}`
    ];
    
    filterText.forEach((text, index) => {
      doc.text(text, 20, startY + 10 + (index * 6));
    });
    
    return startY + 45;
  };

  const addSummary = (startY) => {
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Summary', 20, startY);
    
    const summaryData = [
      [
        'Generated', 
        (reportData.summary?.totalGeneratedWeight?.toFixed(2) || 0).toString(),
        (reportData.summary?.totalGeneratedQuantity || 0).toString()
      ],
      [
        'Collected', 
        (reportData.summary?.totalCollectedWeight?.toFixed(2) || 0).toString(),
        (reportData.summary?.totalCollectedQuantity || 0).toString()
      ]
    ];

    doc.autoTable({
      startY: startY + 8,
      head: [['Type', 'Weight (kg)', 'Quantity (items)']],
      body: summaryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246], // Blue-500
        textColor: 255,
        fontSize: 11
      },
      styles: { fontSize: 10 }
    });

    return doc.lastAutoTable.finalY + 15;
  };

  const addDetailTable = (startY, data, title, headerColor) => {
    if (!data || data.length === 0) return startY;

    // Check if we need a new page
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 20, startY);

    const tableData = data.map(item => [
      item.department || '',
      item.category || '',
      item.year?.toString() || '',
      item.month?.toString() || '',
      item.quantity?.toString() || '0',
      item.weight?.toFixed(2) || '0.00',
      item.transactionCount?.toString() || '0'
    ]);

    doc.autoTable({
      startY: startY + 8,
      head: [['Department', 'Category', 'Year', 'Month', 'Quantity', 'Weight (kg)', 'Transactions']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: headerColor,
        textColor: 255,
        fontSize: 10
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        4: { halign: 'right' }, // Quantity
        5: { halign: 'right' }, // Weight
        6: { halign: 'right' }  // Transactions
      }
    });

    return doc.lastAutoTable.finalY + 15;
  };

  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Left footer
      doc.text(
        `Page ${i} of ${pageCount} | E-waste Management System`,
        20,
        285
      );
      
      // Right footer
      doc.text(
        `Total Records: ${(reportData.generated?.length || 0) + (reportData.collected?.length || 0)}`,
        140,
        285
      );
    }
  };

  // Generate PDF
  try {
    yPos = addHeader();
    yPos = addFilters(yPos);
    yPos = addSummary(yPos);

    // Add detail tables based on filter type
    if ((filters.type === "both" || filters.type === "generated") && reportData.generated?.length > 0) {
      yPos = addDetailTable(yPos, reportData.generated, 'E-waste Generated Details', [239, 68, 68]); // Red-500
    }

    if ((filters.type === "both" || filters.type === "collected") && reportData.collected?.length > 0) {
      yPos = addDetailTable(yPos, reportData.collected, 'E-waste Collected Details', [34, 197, 94]); // Green-500
    }

    addFooter();

    // Save the PDF
    const filename = `ewaste-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};