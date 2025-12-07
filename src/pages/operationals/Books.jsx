import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Search, Filter, Trash2, BookOpen } from 'lucide-react';
import AddEditBookDialog from '@/components/dialogs/operationals/AddEditBookDialog';
import Pagination from '@/components/Pagination';
import { formatDate, formatRupiah } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';

const MasterBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const { data: booksData = { books: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['books', searchTerm, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/books', {
        params: {
          search: searchTerm,
          page: currentPage,
          limit: limit,
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

  const finishSubmit = (isQuery=true) => {
    if(isQuery) {
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

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Data Buku</h1>
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
                  <p>• <strong className="font-semibold">Informasi Buku:</strong> Nama, penulis, ISBN, dan tahun terbit</p>
                  <p>• <strong className="font-semibold">Klasifikasi:</strong> Jenis buku, jenjang studi, bidang studi, dan kelas</p>
                  <p>• <strong className="font-semibold">Manajemen Stok:</strong> Kelola stok dan harga buku</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex justify-between items-center">
              <div className="w-full max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    placeholder="Filter pencarian ..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
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
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : booksData.books.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada buku. Tambahkan buku pertama anda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {booksData.books.map((book) => (
                  <Card key={book.id} className="border-2 border-blue-80 hover:border-blue-300 hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex gap-2 mb-2">
                            {book.jenis_buku && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{book.jenis_buku.name}</Badge>
                            )}
                            {book.stock !== undefined && book.stock > 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Stok: {book.stock}</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Kosong</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">
                            {book.name}
                          </CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(book)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus buku ini?')) {
                                deleteMutation.mutate(book.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600">
                        {book.author && <><strong>Penulis:</strong> {book.author}<br/></>}
                        {book.isbn && <><strong>ISBN:</strong> {book.isbn}<br/></>}
                        {book.year && <><strong>Tahun:</strong> {book.year}<br/></>}
                        {book.publisher && <><strong>Publisher:</strong> {book.publisher.name}<br/></>}
                        {book.kelas && <><strong>Kelas:</strong> {book.kelas.name}<br/></>}
                        {book.price !== undefined && <><strong>Harga:</strong> {formatRupiah(book.price)}<br/></>}
                        <strong>Dibuat:</strong> {formatDate(book.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
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
    </div>
  );
};

export default MasterBook;
