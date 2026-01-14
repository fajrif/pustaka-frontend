import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Generate filename for report exports
 * @param {string} reportType - Type of report (e.g., 'StokBuku', 'Penjualan')
 * @param {string} extension - File extension (e.g., 'pdf', 'xlsx')
 * @returns {string} Generated filename
 */
export const generateReportFilename = (reportType, extension) => {
  const date = format(new Date(), 'yyyy-MM-dd');
  return `Laporan-${reportType}-${date}.${extension}`;
};

/**
 * Export data to PDF using html2pdf.js
 * @param {HTMLElement} elementRef - Reference to the HTML element to export
 * @param {string} filename - Filename for the PDF
 * @returns {Promise<void>}
 */
export const exportToPDF = async (elementRef, filename) => {
  if (!elementRef) {
    throw new Error('Element reference is required for PDF export');
  }

  const html2pdf = (await import('html2pdf.js')).default;

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  await html2pdf().set(opt).from(elementRef).save();
};

/**
 * Export data to Excel using ExcelJS
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions { key: string, header: string, width?: number, accessor?: function }
 * @param {string} filename - Filename for the Excel file
 * @param {string} sheetName - Name of the worksheet
 */
export const exportToExcel = async (data, columns, filename, sheetName = 'Data') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Define columns with headers and widths
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15
  }));

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  data.forEach(item => {
    const rowData = {};
    columns.forEach(col => {
      const value = col.accessor ? col.accessor(item) : item[col.key];
      rowData[col.key] = value ?? '';
    });
    worksheet.addRow(rowData);
  });

  // Generate buffer and save file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

/**
 * Format currency for export
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string
 */
export const formatCurrencyForExport = (value) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date for export
 * @param {string|Date} date - Date value
 * @param {string} formatStr - Date format string
 * @returns {string} Formatted date string
 */
export const formatDateForExport = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '';
  try {
    return format(new Date(date), formatStr);
  } catch {
    return '';
  }
};
