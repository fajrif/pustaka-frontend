import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  className = ""
}) => {
  if (!totalPages || totalPages <= 0) return null;

  const startItem = ((currentPage - 1) * limit) + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className={`flex items-center justify-between mt-6 pt-4 border-t border-slate-200 ${className}`}>
      <div className="text-sm text-slate-600">
        Menampilkan {startItem} - {endItem} dari {total} data
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={currentPage === page ? "bg-blue-900 hover:bg-blue-800" : ""}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
