import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Search, Filter, Trash2, Users } from 'lucide-react';
import AddEditSalesAssociateDialog from '@/components/dialogs/operationals/AddEditSalesAssociateDialog';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';

const MasterSalesAssociate = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingSalesAssociate, setEditingSalesAssociate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const { data: salesAssociatesData = { sales_associates: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['salesAssociates', searchTerm, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/sales-associates', {
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

  const handleEdit = (salesAssociate) => {
    setEditingSalesAssociate(salesAssociate);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery=true) => {
    if(isQuery) {
      queryClient.invalidateQueries(['salesAssociates']);
    }
    setShowDialog(false);
    setEditingSalesAssociate(null);
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
      await api.delete(`/sales-associates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['salesAssociates']);
    }
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Data Sales Associate</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola data sales associate anda</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Master Data Sales Associate</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Master data sales associate digunakan untuk data management mitra penjualan buku.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Nama Sales Associate:</strong> Nama mitra penjualan</p>
                  <p>• <strong className="font-semibold">Contact Info:</strong> Contact atau informasi lengkap dari sales associate</p>
                  <p>• <strong className="font-semibold">Pembayaran:</strong> Jenis pembayaran dan diskon yang diberikan</p>
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
                Tambah Sales Associate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : salesAssociatesData.sales_associates.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada sales associate. Tambahkan sales associate pertama anda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {salesAssociatesData.sales_associates.map((salesAssociate) => (
                  <Card key={salesAssociate.id} className="border-2 border-blue-80 hover:border-blue-300 hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 mb-2">{salesAssociate.code}</Badge>
                          <CardTitle className="text-lg">
                            {salesAssociate.name}
                          </CardTitle>
                          {salesAssociate.discount > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-2">
                              Diskon: {salesAssociate.discount}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(salesAssociate)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus sales associate ini?')) {
                                deleteMutation.mutate(salesAssociate.id);
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
                        Email: {salesAssociate.email || '-'}<br/>
                        Phone: {salesAssociate.phone1 || salesAssociate.phone2 || '-'}<br/>
                        Area: {salesAssociate.area || '-'}<br/>
                        {salesAssociate.jenis_pembayaran && <>Pembayaran: {salesAssociate.jenis_pembayaran}<br/></>}
                        Dibuat pada: {formatDate(salesAssociate.created_at)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && salesAssociatesData.sales_associates.length > 0 && salesAssociatesData.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={salesAssociatesData.pagination.total_pages}
                total={salesAssociatesData.pagination.total}
                limit={salesAssociatesData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog */}
      <AddEditSalesAssociateDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingSalesAssociate={editingSalesAssociate}
        onFinish={finishSubmit}
        />
    </div>
  );
};

export default MasterSalesAssociate;
