import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { useToast } from '@/components/ui/use-toast';
import { createPurchaseBooksColumnDefs, defaultColDef } from '@/config/purchaseBooksGridColumns';
import '@/styles/ag-grid-overrides.css';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Map AG Grid column fields to API sort fields
const SORT_FIELD_MAP = {
  'jenis_buku.code': 'jenis_buku_code',
  'bidang_studi': 'bidang_studi_name',
  'jenjang_studi.code': 'jenjang_studi_code',
  'curriculum.name': 'curriculum_name',
  'kelas': 'kelas',
  'periode': 'periode',
  'year': 'year',
  'merk_buku': 'merk_buku_name',
  'publisher': 'publisher_name',
  'no_pages': 'no_pages',
  'price': 'price',
  'stock': 'stock',
};

// Map AG Grid column fields to API filter fields
const FILTER_FIELD_MAP = {
  'jenis_buku.code': 'jenis_buku_code',
  'bidang_studi': 'bidang_studi_name',
  'jenjang_studi.code': 'jenjang_studi_code',
  'curriculum.name': 'curriculum_name',
  'kelas': 'kelas',
  'periode': 'periode',
  'year': 'year',
  'merk_buku': 'merk_buku_name',
  'publisher': 'publisher_name',
  'no_pages': 'no_pages',
  'price': 'price',
  'stock': 'stock',
};

const PurchaseBookSelectionDialog = ({ isOpen, onClose, currentSelectedBooks = [], onConfirm }) => {
  const { toast } = useToast();
  const gridRef = useRef(null);
  const [selectedBooks, setSelectedBooks] = useState({});
  const [sortModel, setSortModel] = useState({ sort_by: '', sort_order: '' });
  const [columnFilters, setColumnFilters] = useState({});

  // Initialize selected books from current selection
  useEffect(() => {
    if (isOpen && currentSelectedBooks.length > 0) {
      const initialSelection = {};
      currentSelectedBooks.forEach(book => {
        initialSelection[book.book_id] = {
          book: book.book,
          quantity: book.quantity,
          price: book.price
        };
      });
      setSelectedBooks(initialSelection);
    } else if (isOpen) {
      setSelectedBooks({});
    }
  }, [isOpen, currentSelectedBooks]);

  // Reset filters when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSortModel({ sort_by: '', sort_order: '' });
      setColumnFilters({});
      // Reset grid filters if grid is ready
      if (gridRef.current?.api) {
        gridRef.current.api.setFilterModel(null);
      }
    }
  }, [isOpen]);

  // Fetch books
  const { data: booksData = { books: [], pagination: { total: 0, page: 1, limit: 1000, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['books-purchase-selection', sortModel, columnFilters],
    queryFn: async () => {
      const params = {
        page: 1,
        limit: 1000, // Fetch all data, let AG Grid handle pagination
        ...columnFilters,
      };

      // Add sorting params if set
      if (sortModel.sort_by) {
        params.sort_by = sortModel.sort_by;
        params.sort_order = sortModel.sort_order || 'asc';
      }

      const response = await api.get('/books', { params });
      return response.data;
    },
    enabled: isOpen,
    placeholderData: keepPreviousData,
  });

  const handleCheckboxChange = useCallback((book) => {
    setSelectedBooks(prev => {
      const newSelection = { ...prev };
      if (newSelection[book.id]) {
        delete newSelection[book.id];
      } else {
        // Use book's existing price as default purchase price
        newSelection[book.id] = {
          book: book,
          quantity: 1,
          price: book.price || 0
        };
      }
      return newSelection;
    });
  }, []);

  const handleQuantityChange = useCallback((bookId, quantity, maxStock) => {
    const book = selectedBooks[bookId];
    if (!book) return;

    const numQuantity = parseInt(quantity) || 1;
    if (numQuantity < 1) return;

    // Validate against stock
    if (numQuantity > maxStock) {
      toast({
        title: "Peringatan",
        description: `Jumlah tidak boleh melebihi stok yang tersedia (${maxStock})`,
        variant: "destructive",
      });
      return;
    }

    setSelectedBooks(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        quantity: numQuantity
      }
    }));
  }, [selectedBooks, toast]);

  const handleSelectAll = useCallback((shouldSelectAll) => {
    if (shouldSelectAll) {
      // Select all books with stock > 0 with default quantity of 1
      const newSelection = {};
      booksData.books.forEach(book => {
        // Only select books that are in stock
        if (book.stock > 0) {
          newSelection[book.id] = {
            book: book,
            quantity: 1,
            price: book.price || 0
          };
        }
      });
      setSelectedBooks(newSelection);
    } else {
      // Unselect all
      setSelectedBooks({});
    }
  }, [booksData.books]);


  const calculateSummary = () => {
    let totalBooks = 0;
    let totalAmount = 0;

    Object.values(selectedBooks).forEach(item => {
      totalBooks += 1;
      totalAmount += (item.price * item.quantity);
    });

    return { totalBooks, totalAmount };
  };

  const handleConfirm = () => {
    const selectedBooksArray = Object.entries(selectedBooks).map(([bookId, item]) => ({
      book_id: bookId,
      book: item.book,
      quantity: item.quantity,
      price: item.price
    }));

    if (selectedBooksArray.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal 1 buku",
        variant: "destructive",
      });
      return;
    }

    // Validate all items have price
    const hasZeroPrice = selectedBooksArray.some(item => item.price <= 0);
    if (hasZeroPrice) {
      toast({
        title: "Error",
        description: "Semua buku harus memiliki harga beli",
        variant: "destructive",
      });
      return;
    }

    onConfirm(selectedBooksArray);
  };

  // Handle AG Grid sort change
  const onSortChanged = useCallback((params) => {
    const sortState = params.api.getColumnState().find(col => col.sort);

    if (sortState) {
      const apiField = SORT_FIELD_MAP[sortState.colId] || sortState.colId;
      setSortModel({
        sort_by: apiField,
        sort_order: sortState.sort,
      });
    } else {
      setSortModel({ sort_by: '', sort_order: '' });
    }
  }, []);

  // Handle AG Grid filter change
  const onFilterChanged = useCallback((params) => {
    const filterModel = params.api.getFilterModel();
    const apiFilters = {};

    Object.entries(filterModel).forEach(([field, filterData]) => {
      const apiField = FILTER_FIELD_MAP[field] || field;

      // Handle different filter types
      if (filterData.filterType === 'text') {
        apiFilters[apiField] = filterData.filter;
      } else if (filterData.filterType === 'number') {
        if (filterData.type === 'equals') {
          apiFilters[apiField] = filterData.filter;
        } else if (filterData.type === 'greaterThan') {
          apiFilters[`${apiField}_min`] = filterData.filter;
        } else if (filterData.type === 'lessThan') {
          apiFilters[`${apiField}_max`] = filterData.filter;
        } else if (filterData.type === 'inRange') {
          apiFilters[`${apiField}_min`] = filterData.filter;
          apiFilters[`${apiField}_max`] = filterData.filterTo;
        }
      }
    });

    setColumnFilters(apiFilters);
  }, []);

  const columnDefs = useMemo(
    () => createPurchaseBooksColumnDefs({
      selectedBooks,
      onCheckboxChange: handleCheckboxChange,
      onQuantityChange: handleQuantityChange,
      onSelectAll: handleSelectAll,
      allBooks: booksData?.books || [],
    }),
    [selectedBooks, handleCheckboxChange, handleQuantityChange, handleSelectAll, booksData?.books]
  );

  const { totalBooks, totalAmount } = calculateSummary();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Buku untuk Pembelian</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* AG Grid */}
          <div className="flex-1 overflow-hidden">
            <div style={{ height: '100%', width: '100%' }}>
              <AgGridReact
                ref={gridRef}
                theme={themeBalham}
                rowData={booksData?.books || []}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
                suppressRowClickSelection={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                domLayout="normal"
                tooltipShowDelay={200}
                tooltipHideDelay={2000}
                overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Loading...</span>'}
                overlayNoRowsTemplate={'<span>Belum ada buku. Tambahkan buku pertama anda.</span>'}
                loading={isLoading}
                getRowId={(params) => params.data.id}
                onSortChanged={onSortChanged}
                onFilterChanged={onFilterChanged}
                getRowStyle={(params) => {
                  const stock = params.data.stock || 0;
                  if (stock === 0) {
                    return { backgroundColor: '#f1f5f9' }; // slate-100
                  }
                  return null;
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-slate-600">
              <span className="font-semibold">Dipilih: {totalBooks} buku</span>
              <span className="ml-4">Total Pembelian: <span className="font-semibold text-purple-600">{formatRupiah(totalAmount)}</span></span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={totalBooks === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Tambah ke Transaksi ({totalBooks})
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseBookSelectionDialog;
