import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Search, Filter, Trash2, BookOpen, X } from 'lucide-react';
import AddEditBookDialog from '@/components/dialogs/operationals/AddEditBookDialog';
import BookFilterDialog from '@/components/dialogs/operationals/BookFilterDialog';
import Pagination from '@/components/Pagination';
import { formatDate, formatRupiah } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';

const MasterBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;
  };

  const { data: booksData = { books: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['books', searchTerm, currentPage, limit, filters],
    queryFn: async () => {
      const response = await api.get('/books', {
        params: {
          search: searchTerm,
          page: currentPage,
          limit: limit,
          ...filters,
        },
      });
      return response.data;
    },
    enabled: searchTerm.length === 0 || searchTerm.length >= 3,
    placeholderData: keepPreviousData,
  });

  const handleEdit = (book) => {
    setEditingBook(book);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery = true) => {
    if (isQuery) {
      queryClient.invalidateQueries(['books']);
    }
    setShowDialog(false);
    setEditingBook(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(PAGINATION.DEFAULT_PAGE); // Reset to first page on search
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(PAGINATION.DEFAULT_PAGE); // Reset to first page on filter change
    setShowFilterDialog(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      toast({
        title: "Success",
        description: "Buku berhasil dihapus.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus buku.",
        variant: "destructive",
      });
    }
  });

  const getPeriodeLabel = (periode, year) => {
    let _year = ""
    if (year != undefined || year != null) {
      _year = year
    }
    if (periode == 1) {
      return `Semester Ganjil ${_year}`;
    } else if (periode == 2) {
      return `Semester Genap ${_year}`;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Master Data Buku</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola data buku anda</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Master Data Buku</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Master data buku digunakan untuk data management buku perpustakaan.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Informasi Buku:</strong> Nama dan tahun terbit</p>
                  <p>• <strong className="font-semibold">Klasifikasi:</strong> Jenis buku, jenjang studi, bidang studi, dan book</p>
                  <p>• <strong className="font-semibold">Manajemen Stok:</strong> Kelola stok dan harga buku</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 w-full max-w-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Cari nama buku ..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterDialog(true)}
                    className="gap-2 relative"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {getActiveFilterCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setShowDialog(true);
                  }}
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Buku
                </Button>
              </div>
              {/* Active Filters Display */}
              {getActiveFilterCount() > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Filter aktif:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.bidang_studi_id && (
                      <Badge variant="secondary" className="gap-1">
                        Bidang Studi
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, bidang_studi_id: '' }))} />
                      </Badge>
                    )}
                    {filters.jenis_buku_id && (
                      <Badge variant="secondary" className="gap-1">
                        Jenis Buku
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, jenis_buku_id: '' }))} />
                      </Badge>
                    )}
                    {filters.jenjang_studi_id && (
                      <Badge variant="secondary" className="gap-1">
                        Jenjang Studi
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, jenjang_studi_id: '' }))} />
                      </Badge>
                    )}
                    {filters.curriculum_id && (
                      <Badge variant="secondary" className="gap-1">
                        Kurikulum
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, curriculum_id: '' }))} />
                      </Badge>
                    )}
                    {filters.periode && (
                      <Badge variant="secondary" className="gap-1">
                        Semester: {filters.periode == 1 ? 'Ganjil' : 'Genap'}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, periode: '' }))} />
                      </Badge>
                    )}
                    {filters.year && (
                      <Badge variant="secondary" className="gap-1">
                        Tahun: {filters.year}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, year: '' }))} />
                      </Badge>
                    )}
                    {(filters.price_min || filters.price_max) && (
                      <Badge variant="secondary" className="gap-1">
                        Harga: {filters.price_min ? `Rp${Number(filters.price_min).toLocaleString('id-ID')}` : '0'} - {filters.price_max ? `Rp${Number(filters.price_max).toLocaleString('id-ID')}` : '~'}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, price_min: '', price_max: '' }))} />
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                  >
                    Hapus Semua
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : booksData.books.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada buku. Tambahkan buku pertama anda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Kode Jenis</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Penerbit</TableHead>
                      <TableHead>Kode Jenjang</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Dibuat</TableHead>
                      <TableHead className="w-[150px] text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booksData.books.map((book) => (
                      <TableRow key={book.id}>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {book.jenis_buku?.code || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className="font-medium text-sm inline-block cursor-pointer hover:underline hover:text-blue-600 mb-1"
                            onClick={() => handleEdit(book)}
                          >
                            {book.name}
                          </span>
                          <span className="text-xs">
                            Periode: {getPeriodeLabel(book.periode, book.year)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {book.publisher ? (
                            <span className="text-sm">
                              {book.publisher.name}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {book.jenjang_studi ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              {book.jenjang_studi?.code}
                            </Badge>
                          ) : (
                            <span className="text-sm text-slate-500">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {book.price !== undefined ? (
                            <span className="font-medium text-sm">
                              {formatRupiah(book.price)}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">Rp.0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm">
                            {book.stock !== undefined ? book.stock : '0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">
                            {formatDate(book.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(book)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (confirm('Yakin ingin menghapus book ini?')) {
                                  deleteMutation.mutate(book.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && booksData.books.length > 0 && booksData.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={booksData.pagination.total_pages}
                total={booksData.pagination.total}
                limit={booksData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog */}
      <AddEditBookDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingBook={editingBook}
        onFinish={finishSubmit}
      />

      {/* Filter Dialog */}
      <BookFilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default MasterBook;
