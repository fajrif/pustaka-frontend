import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Package } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';
import { useToast } from '@/components/ui/use-toast';
import Pagination from '@/components/Pagination';
import { PAGINATION } from '@/utils/constants';
import Select from '@/components/ui/select';

const BookSelectionDialog = ({ isOpen, onClose, currentSelectedBooks = [], onConfirm }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [jenisBukuFilter, setJenisBukuFilter] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const [selectedBooks, setSelectedBooks] = useState({});
  const limit = 10;

  // Initialize selected books from current selection
  useEffect(() => {
    if (isOpen && currentSelectedBooks.length > 0) {
      const initialSelection = {};
      currentSelectedBooks.forEach(book => {
        initialSelection[book.book_id] = {
          book: book.book,
          quantity: book.quantity
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
      setSearchTerm('');
      setJenisBukuFilter('');
      setPublisherFilter('');
      setCurrentPage(PAGINATION.DEFAULT_PAGE);
    }
  }, [isOpen]);

  // Fetch books
  const { data: booksData = { books: [], pagination: { total: 0, page: 1, limit: 10, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['books', searchTerm, jenisBukuFilter, publisherFilter, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/books', {
        params: {
          search: searchTerm,
          jenis_buku_id: jenisBukuFilter || undefined,
          publisher_id: publisherFilter || undefined,
          page: currentPage,
          limit: limit,
        },
      });
      return response.data;
    },
    enabled: isOpen && (searchTerm.length === 0 || searchTerm.length >= 3),
    placeholderData: keepPreviousData,
  });

  // Fetch jenis buku for filter
  const { data: jenisBukuData = { jenis_buku: [] } } = useQuery({
    queryKey: ['bookTypes', 'all'],
    queryFn: async () => {
      const response = await api.get('/jenis-buku?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch publishers for filter
  const { data: publishersData = { publishers: [] } } = useQuery({
    queryKey: ['publishers', 'all'],
    queryFn: async () => {
      const response = await api.get('/publishers?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleCheckboxChange = (book) => {
    setSelectedBooks(prev => {
      const newSelection = { ...prev };
      if (newSelection[book.id]) {
        delete newSelection[book.id];
      } else {
        newSelection[book.id] = {
          book: book,
          quantity: 1
        };
      }
      return newSelection;
    });
  };

  const handleQuantityChange = (bookId, quantity) => {
    const book = selectedBooks[bookId];
    if (!book) return;

    const numQuantity = parseInt(quantity) || 1;
    const maxStock = book.book.stock || 0;

    if (numQuantity > maxStock) {
      toast({
        title: "Warning",
        description: `Quantity tidak boleh melebihi stock (${maxStock})`,
        variant: "destructive",
      });
      return;
    }

    if (numQuantity < 1) {
      return;
    }

    setSelectedBooks(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        quantity: numQuantity
      }
    }));
  };

  const calculateSummary = () => {
    let totalBooks = 0;
    let totalAmount = 0;

    Object.values(selectedBooks).forEach(item => {
      totalBooks += 1;
      totalAmount += (item.book.price * item.quantity);
    });

    return { totalBooks, totalAmount };
  };

  const handleConfirm = () => {
    const selectedBooksArray = Object.entries(selectedBooks).map(([bookId, item]) => ({
      book_id: bookId,
      book: item.book,
      quantity: item.quantity
    }));

    if (selectedBooksArray.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal 1 buku",
        variant: "destructive",
      });
      return;
    }

    onConfirm(selectedBooksArray);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Stock badge component
  const StockBadge = ({ stock }) => {
    if (stock === 0) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Out of Stock</Badge>;
    } else if (stock < 5) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{stock}</Badge>;
    } else if (stock < 10) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{stock}</Badge>;
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{stock}</Badge>;
  };

  const { totalBooks, totalAmount } = calculateSummary();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pilih Buku</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search and Filters */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Cari buku berdasarkan nama..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'Semua Jenis Buku' },
                    ...jenisBukuData.jenis_buku.map(jb => ({ value: jb.id, label: jb.name }))
                  ]}
                  value={jenisBukuFilter}
                  onChange={(val) => {
                    setJenisBukuFilter(val);
                    setCurrentPage(PAGINATION.DEFAULT_PAGE);
                  }}
                  placeholder="Filter Jenis Buku"
                />
              </div>
              <div className="w-64">
                <Select
                  options={[
                    { value: '', label: 'Semua Penerbit' },
                    ...publishersData.publishers.map(p => ({ value: p.id, label: p.name }))
                  ]}
                  value={publisherFilter}
                  onChange={(val) => {
                    setPublisherFilter(val);
                    setCurrentPage(PAGINATION.DEFAULT_PAGE);
                  }}
                  placeholder="Filter Penerbit"
                />
              </div>
            </div>
          </div>

          {/* Books Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-slate-500">Loading...</p>
                </div>
              </div>
            ) : booksData.books.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">Tidak ada buku ditemukan</p>
                  <p className="text-sm mt-2">Coba ubah filter atau kata kunci pencarian</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nama Buku</TableHead>
                    <TableHead>Penerbit</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center w-[120px]">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booksData.books.map((book) => {
                    const isSelected = !!selectedBooks[book.id];
                    const isOutOfStock = book.stock === 0;
                    return (
                      <TableRow key={book.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isOutOfStock}
                            onChange={() => handleCheckboxChange(book)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium text-sm block">{book.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{book.publisher?.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{book.jenis_buku?.name || '-'}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(book.price)}
                        </TableCell>
                        <TableCell className="text-center">
                          <StockBadge stock={book.stock} />
                        </TableCell>
                        <TableCell className="text-center">
                          {isSelected && (
                            <Input
                              type="number"
                              min="1"
                              max={book.stock}
                              value={selectedBooks[book.id].quantity}
                              onChange={(e) => handleQuantityChange(book.id, e.target.value)}
                              className="w-20 text-center mx-auto"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && booksData.books.length > 0 && booksData.pagination && (
            <div className="mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={booksData.pagination.total_pages}
                total={booksData.pagination.total}
                limit={booksData.pagination.limit}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-slate-600">
              <span className="font-semibold">Dipilih: {totalBooks} buku</span>
              <span className="ml-4">Total: <span className="font-semibold text-blue-600">{formatRupiah(totalAmount)}</span></span>
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
              className="bg-green-600 hover:bg-green-700"
            >
              Tambah ke Transaksi ({totalBooks})
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookSelectionDialog;
