import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Search, Filter, Trash2, Truck } from 'lucide-react';
import AddEditExpeditionDialog from '@/components/dialogs/operationals/AddEditExpeditionDialog';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';

const MasterExpedition = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpedition, setEditingExpedition] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const { data: expeditionsData = { expeditions: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['expeditions', searchTerm, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/expeditions', {
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

  const handleEdit = (expedition) => {
    setEditingExpedition(expedition);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery=true) => {
    if(isQuery) {
      queryClient.invalidateQueries(['expeditions']);
    }
    setShowDialog(false);
    setEditingExpedition(null);
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
      await api.delete(`/expeditions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expeditions']);
    }
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Data Ekspedisi</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola data ekspedisi anda</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Master Data Ekspedisi</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Master data ekspedisi digunakan untuk data management pengiriman buku.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Nama Ekspedisi:</strong> Nama layanan ekspedisi</p>
                  <p>• <strong className="font-semibold">Contact Info:</strong> Contact atau informasi lengkap dari ekspedisi tersebut.</p>
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
                Tambah Ekspedisi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : expeditionsData.expeditions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada ekspedisi. Tambahkan ekspedisi pertama anda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expeditionsData.expeditions.map((expedition) => (
                  <Card key={expedition.id} className="border-2 border-blue-80 hover:border-blue-300 hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 mb-2">{expedition.code}</Badge>
                          <CardTitle className="text-lg">
                            {expedition.name}
                          </CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(expedition)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus ekspedisi ini?')) {
                                deleteMutation.mutate(expedition.id);
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
                        Email: {expedition.email || '-'}<br/>
                        Phone: {expedition.phone1 || expedition.phone2 || '-'}<br/>
                        Area: {expedition.area || '-'}<br/>
                        Dibuat pada: {formatDate(expedition.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && expeditionsData.expeditions.length > 0 && expeditionsData.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={expeditionsData.pagination.total_pages}
                total={expeditionsData.pagination.total}
                limit={expeditionsData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog */}
      <AddEditExpeditionDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingExpedition={editingExpedition}
        onFinish={finishSubmit}
        />
    </div>
  );
};

export default MasterExpedition;
