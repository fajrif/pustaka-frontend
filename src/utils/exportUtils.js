import { format } from 'date-fns';
import * as XLSX from 'xlsx';

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
 * Export data to Excel using xlsx
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions { key: string, header: string }
 * @param {string} filename - Filename for the Excel file
 * @param {string} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, columns, filename, sheetName = 'Data') => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create header row
  const headers = columns.map(col => col.header);

  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = col.accessor ? col.accessor(item) : item[col.key];
      return value ?? '';
    });
  });

  // Combine headers and data
  const worksheetData = [headers, ...rows];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Save file
  XLSX.writeFile(workbook, filename);
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
