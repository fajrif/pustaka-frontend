import React from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';

const ExportButtons = ({
  onExportPDF,
  onExportExcel,
  isExportingPDF = false,
  isExportingExcel = false,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExportExcel}
        disabled={disabled || isExportingExcel}
        className="gap-2"
      >
        {isExportingExcel ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
        )}
        Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onExportPDF}
        disabled={disabled || isExportingPDF}
        className="gap-2"
      >
        {isExportingPDF ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4 text-red-600" />
        )}
        PDF
      </Button>
    </div>
  );
};

export default ExportButtons;
