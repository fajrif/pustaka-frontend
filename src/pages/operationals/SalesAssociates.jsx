import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Search, Filter, Trash2, Users } from 'lucide-react';
import AddEditSalesAssociateDialog from '@/components/dialogs/operationals/AddEditSalesAssociateDialog';
import Pagination from '@/components/Pagination';
import { formatDate } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';

const MasterSalesAssociate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
      toast({
        title: "Success",
        description: "Sales associate berhasil dihapus.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus sales associate.",
        variant: "destructive",
      });
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Kode</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>Wilayah</TableHead>
                        <TableHead>Pembayaran</TableHead>
                        <TableHead>Diskon</TableHead>
                        <TableHead>Dibuat</TableHead>
                        <TableHead className="w-[150px] text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesAssociatesData.sales_associates.map((sales_associate) => (
                        <TableRow key={sales_associate.id}>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {sales_associate.code || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm inline-block mb-1">
                              {sales_associate.name}
                            </span>
                            <span className="text-xs block">
                              Email: {sales_associate.author || '-'}
                            </span>
                            <span className="text-xs">
                              Phone: {sales_associate.phone1 || sales_associate.phone2 || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm inline-block mb-1">
                              {sales_associate.city?.name || 'N/A'}
                            </span>
                            <span className="text-xs block">
                              Area: {sales_associate.area || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {sales_associate.jenis_pembayaran === 'T' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Tunai
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Kredit
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {sales_associate.discount > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mt-2">
                                {sales_associate.discount}%
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-500">
                              {formatDate(sales_associate.created_at)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(sales_associate)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Yakin ingin menghapus sales_associate ini?')) {
                                    deleteMutation.mutate(sales_associate.id);
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
