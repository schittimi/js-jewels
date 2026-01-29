import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Logo image base64 (will be loaded dynamically)
let logoBase64 = null;
let qrBase64 = null;

// Preload images
const loadImages = async () => {
  if (!logoBase64) {
    try {
      const logoResponse = await fetch('/logo.png');
      const logoBlob = await logoResponse.blob();
      logoBase64 = await blobToBase64(logoBlob);
    } catch (e) {
      console.warn('Could not load logo');
    }
  }
  if (!qrBase64) {
    try {
      const qrResponse = await fetch('/instagram-qr.png');
      const qrBlob = await qrResponse.blob();
      qrBase64 = await blobToBase64(qrBlob);
    } catch (e) {
      console.warn('Could not load QR code');
    }
  }
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Format number with commas for Indian numbering system (without toLocaleString to avoid PDF encoding issues)
const formatIndianNumber = (num) => {
  const numStr = Math.abs(num).toString();
  if (numStr.length <= 3) return numStr;
  
  let result = '';
  let count = 0;
  
  for (let i = numStr.length - 1; i >= 0; i--) {
    result = numStr[i] + result;
    count++;
    if (count === 3 && i > 0) {
      result = ',' + result;
    } else if (count > 3 && (count - 3) % 2 === 0 && i > 0) {
      result = ',' + result;
    }
  }
  
  return result;
};

/**
 * Generate a luxury PDF invoice
 * Purple + Gold theme with logo and Instagram QR
 */
export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Colors - matching the logo's bright maroon color
  const maroon = [163, 52, 93]; // #A3345D - bright maroon from logo
  const darkMaroon = [138, 43, 78]; // #8A2B4E - slightly darker
  const gold = [212, 175, 55]; // #D4AF37
  const darkText = [30, 30, 30];
  const lightText = [120, 120, 120];

  // ========== HEADER SECTION ==========
  
  // Bright maroon header background with gradient effect
  doc.setFillColor(163, 52, 93); // #A3345D - bright maroon
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Slightly darker bottom for depth
  doc.setFillColor(138, 43, 78); // #8A2B4E
  doc.rect(0, 45, pageWidth, 5, 'F');

  // Add logo if available (75% of banner height = 37.5mm)
  const bannerHeight = 50;
  const imageSize = bannerHeight * 0.75; // 37.5mm
  const imageY = (bannerHeight - imageSize) / 2; // Center vertically
  
  if (logoBase64) {
    try {
      // Draw white circle background for logo
      doc.setFillColor(255, 255, 255);
      doc.circle(margin + imageSize / 2, imageY + imageSize / 2, imageSize / 2, 'F');
      // Circular logo on the left - 75% of banner height
      doc.addImage(logoBase64, 'PNG', margin, imageY, imageSize, imageSize);
    } catch (e) {
      console.warn('Could not add logo to PDF');
    }
  }

  // Business name text (centered in remaining space)
  const textCenterX = pageWidth / 2 + 5;
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('JS Fashion', textCenterX, 18, { align: 'center' });

  // Divider lines around JEWELLERY
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  const lineY = 23;
  doc.line(textCenterX - 30, lineY, textCenterX - 12, lineY);
  doc.line(textCenterX + 12, lineY, textCenterX + 30, lineY);

  // Jewellery text
  doc.setTextColor(...gold);
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('JEWELLERY', textCenterX, 27, { align: 'center' });

  // INVOICE title
  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...gold);
  doc.text('INVOICE', textCenterX, 38, { align: 'center' });

  // Add Instagram QR code if available (75% of banner height = 37.5mm)
  if (qrBase64) {
    try {
      // QR code on the right side - 75% of banner height
      const qrX = pageWidth - margin - imageSize;
      doc.addImage(qrBase64, 'PNG', qrX, imageY, imageSize, imageSize);
      // Instagram handle below QR
      doc.setFontSize(5);
      doc.setTextColor(255, 255, 255);
      doc.text('@jsfashionjewels', qrX + imageSize / 2, imageY + imageSize + 5, { align: 'center' });
    } catch (e) {
      console.warn('Could not add QR to PDF');
    }
  }

  // ========== INVOICE DETAILS ==========
  
  let y = 60;

  // Invoice number and date row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...lightText);
  doc.text('Invoice No.', margin, y);
  doc.text('Date', pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.text(invoice.invoice_id, margin, y);
  doc.text(
    new Date(invoice.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  // ========== CUSTOMER SECTION ==========
  
  y += 15;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...lightText);
  doc.text('BILL TO', margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkText);
  doc.text(invoice.customer_name || 'Customer', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...lightText);
  doc.text(`+91 ${invoice.customer_phone}`, margin, y);

  if (invoice.customer_address) {
    y += 5;
    doc.setFontSize(9);
    const addressLines = doc.splitTextToSize(invoice.customer_address, pageWidth - 2 * margin);
    doc.text(addressLines, margin, y);
    y += addressLines.length * 4;
  }

  // ========== ITEMS TABLE ==========
  
  y += 10;

  const tableData = invoice.items.map(item => [
    item.type,
    item.qty.toString(),
    `Rs.${formatIndianNumber(item.value)}`,
    `Rs.${formatIndianNumber(item.value * item.qty)}`
  ]);

  doc.autoTable({
    startY: y,
    head: [['Item', 'Qty', 'Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 4,
      textColor: darkText,
      halign: 'center', // Default center alignment
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: lightText,
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center', // Center align headers
    },
    columnStyles: {
      0: { cellWidth: 70, halign: 'left' }, // Item - left aligned
      1: { cellWidth: 25, halign: 'center' }, // Qty - center
      2: { cellWidth: 40, halign: 'center' }, // Price - center
      3: { cellWidth: 40, halign: 'center' }, // Amount - center
    },
    margin: { left: margin, right: margin },
    didDrawPage: function(data) {
      // Draw line after header
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, data.cursor.y, pageWidth - margin, data.cursor.y);
    }
  });

  y = doc.lastAutoTable.finalY + 10;

  // ========== TOTALS SECTION ==========
  
  const totalsX = pageWidth - margin - 70;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...lightText);
  doc.text('Subtotal', totalsX, y);
  doc.setTextColor(...darkText);
  doc.text(`Rs.${formatIndianNumber(invoice.subtotal)}`, pageWidth - margin, y, { align: 'right' });

  // Discount (if applicable)
  if (invoice.discount_percent > 0) {
    y += 7;
    doc.setTextColor(180, 120, 0);
    doc.text(`Discount (${invoice.discount_percent}%)`, totalsX, y);
    doc.text(`- Rs.${formatIndianNumber(invoice.discount_amount)}`, pageWidth - margin, y, { align: 'right' });
  }

  // Total line
  y += 5;
  doc.setDrawColor(...maroon);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, pageWidth - margin, y);

  // Total
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...maroon);
  doc.text('Total', totalsX, y);
  doc.text(`Rs.${formatIndianNumber(invoice.total)}`, pageWidth - margin, y, { align: 'right' });

  // ========== STATUS BADGE ==========
  
  y += 20;
  const statusText = invoice.status === 'paid' ? '✓ PAID' : '⏳ PENDING';
  const statusColor = invoice.status === 'paid' ? [34, 139, 34] : [180, 120, 0];
  const statusBg = invoice.status === 'paid' ? [220, 255, 220] : [255, 245, 220];

  const badgeWidth = 40;
  const badgeX = pageWidth / 2 - badgeWidth / 2;

  doc.setFillColor(...statusBg);
  doc.roundedRect(badgeX, y - 5, badgeWidth, 10, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...statusColor);
  doc.text(statusText, pageWidth / 2, y + 1.5, { align: 'center' });

  // ========== FOOTER ==========
  
  // Footer background
  const footerY = pageHeight - 25;
  doc.setFillColor(249, 250, 251); // bg-gray-50
  doc.rect(0, footerY - 5, pageWidth, 30, 'F');
  
  // Footer line
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.3);
  doc.line(0, footerY - 5, pageWidth, footerY - 5);

  // Thank you message
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...maroon);
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 3, { align: 'center' });

  // Shop details with contact info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...lightText);
  doc.text('JS Fashion Jewellery  |  +91 84315 63827  |  @jsfashionjewels', pageWidth / 2, footerY + 10, { align: 'center' });

  return doc;
};

// Export preload function to load images before generating PDF
export const preloadPDFAssets = loadImages;
