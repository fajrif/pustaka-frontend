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

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7; // Maximum number of page buttons to show

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Always show first page
    pages.push(1);

    if (currentPage <= 4) {
      // Near the beginning: 1 2 3 4 5 ... last
      for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
        pages.push(i);
      }
      pages.push('ellipsis-end');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Near the end: 1 ... n-4 n-3 n-2 n-1 n
      pages.push('ellipsis-start');
      for (let i = Math.max(totalPages - 4, 2); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle: 1 ... current-1 current current+1 ... last
      pages.push('ellipsis-start');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis-end');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

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
          {pageNumbers.map((page, index) => {
            if (typeof page === 'string' && page.startsWith('ellipsis')) {
              return (
                <span
                  key={page}
                  className="px-2 text-slate-400 select-none"
                >
                  ...
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={currentPage === page ? "bg-blue-900 hover:bg-blue-800" : ""}
              >
                {page}
              </Button>
            );
          })}
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
