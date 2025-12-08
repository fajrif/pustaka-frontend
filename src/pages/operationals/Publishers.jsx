import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Search, Filter, Trash2, Tag } from 'lucide-react';
import AddEditPublisherDialog from '@/components/dialogs/operationals/AddEditPublisherDialog';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';
import { getAssetUrl } from '@/helpers/AssetHelper';

const MasterPublisher = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingPublisher, setEditingPublisher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const { data: publishersData = { publishers: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['publishers', searchTerm, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/publishers', {
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

  const handleEdit = (publisher) => {
    setEditingPublisher(publisher);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery=true) => {
    if(isQuery) {
      queryClient.invalidateQueries(['publishers']);
    }
    setShowDialog(false);
    setEditingPublisher(null);
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
      await api.delete(`/publishers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['publishers']);
      toast({
        title: "Success",
        description: "Publisher berhasil dihapus.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus publisher.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Data Publisher</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola data publisher anda</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Master Data Publisher</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Master data publisher digunakan untuk data management buku.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Nama Publisher:</strong> Nama Publisher</p>
                  <p>• <strong className="font-semibold">Contact Info:</strong> Contact atau informasi lengkap dari Publisher tsb.</p>
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
                Tambah Publisher
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : publishersData.publishers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada publisher. Tambahkan publisher pertama anda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishersData.publishers.map((publisher) => (
                  <Card key={publisher.id} className="border-2 border-blue-80 hover:border-blue-300 hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex justify-center items-center gap-4">
                          {publisher.logo_url && (
                            <img
                              src={getAssetUrl(publisher.logo_url)}
                              alt="Publisher Logo"
                              className="w-10 h-10 object-cover border rounded"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0zMiAzMkMzNS4zMTM3IDMyIDM4IDI5LjMxMzcgMzggMjZDMzggMjIuNjg2MyAzNS4zMTM3IDIwIDMyIDIwQzI4LjY4NjMgMjAgMjYgMjIuNjg2MyAyNiAyNkMyNiAyOS4zMTM3IDI4LjY4NjMgMzIgMzIgMzJaIiBmaWxsPSIjOUM5Qzk3Ii8+CjxwYXRoIGQ9Ik0yMCA0NFYzOEMyMCAzNS43OTA5IDIxLjc5MDkgMzQgMjQgMzRINDBDNDIuMjA5MSAzNCA0NCAzNS43OTA5IDQ0IDM4VjQ0IiBmaWxsPSIjOUM5Qzk3Ii8+Cjwvc3ZnPgo=';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{publisher.code}</Badge>
                            <CardTitle className="text-lg">
                              {publisher.name}
                            </CardTitle>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(publisher)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus publisher ini?')) {
                                deleteMutation.mutate(publisher.id);
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
                        Email: {publisher.email || '-'}<br/>
                        Phone: {publisher.phone1 || publisher.phone2 || '-'}<br/>
                        Area: {publisher.area || '-'}<br/>
                        Dibuat pada: {formatDate(publisher.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && publishersData.publishers.length > 0 && publishersData.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={publishersData.pagination.total_pages}
                total={publishersData.pagination.total}
                limit={publishersData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog */}
      <AddEditPublisherDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingPublisher={editingPublisher}
        onFinish={finishSubmit}
        />
    </div>
  );
};

export default MasterPublisher;
