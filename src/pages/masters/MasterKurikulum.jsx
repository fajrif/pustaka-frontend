import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2, BookOpen } from 'lucide-react';
import AddEditKurikulumDialog from '@/components/dialogs/masters/AddEditKurikulumDialog';
import Pagination from '@/components/Pagination';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';

const MasterKurikulum = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingKurikulum, setEditingKurikulum] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const { data: kurikulumData = { curriculums: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['kurikulum', searchTerm, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/curriculums', {
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

  const handleEdit = (kurikulum) => {
    setEditingKurikulum(kurikulum);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery=true) => {
    if(isQuery) {
      queryClient.invalidateQueries(['kurikulum']);
    }
    setShowDialog(false);
    setEditingKurikulum(null);
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
      await api.delete(`/curriculums/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kurikulum']);
      toast({
        title: "Success",
        description: "Kurikulum berhasil dihapus.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus kurikulum.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Master Kurikulum</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola kurikulum</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Master Kurikulum</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Master Kurikulum digunakan untuk mengkategorikan kurikulum pendidikan dalam sistem.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Kode:</strong> Kode unik untuk kurikulum</p>
                  <p>• <strong className="font-semibold">Nama:</strong> Nama kurikulum</p>
                  <p>• <strong className="font-semibold">Deskripsi:</strong> Deskripsi atau keterangan kurikulum tsb.</p>
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
                Tambah Kurikulum
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : kurikulumData.curriculums.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada kurikulum. Tambahkan kurikulum pertama.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="w-[150px] text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kurikulumData.curriculums.map((kurikulum) => (
                      <TableRow key={kurikulum.id}>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {kurikulum.code || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm uppercase">
                            {kurikulum.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {kurikulum.description && kurikulum.description.length > 50 ? (
                            <Tooltip className="text-left" content={kurikulum.description}>
                              <p className="text-sm text-slate-600 max-w-xs truncate">
                                {kurikulum.description}
                              </p>
                            </Tooltip>
                          ) : (
                            <p className="text-sm text-slate-600">
                              {kurikulum.description || 'Tidak ada deskripsi'}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(kurikulum)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (confirm('Yakin ingin menghapus kurikulum ini?')) {
                                  deleteMutation.mutate(kurikulum.id);
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
            {!isLoading && kurikulumData.curriculums.length > 0 && kurikulumData.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={kurikulumData.pagination.total_pages}
                total={kurikulumData.pagination.total}
                limit={kurikulumData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog */}
      <AddEditKurikulumDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingKurikulum={editingKurikulum}
        onFinish={finishSubmit}
        />
    </div>
  );
};

export default MasterKurikulum;
