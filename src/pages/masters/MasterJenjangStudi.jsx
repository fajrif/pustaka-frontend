import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2, GraduationCap } from 'lucide-react';
import AddEditJenjangStudiDialog from '@/components/dialogs/masters/AddEditJenjangStudiDialog';
import Pagination from '@/components/Pagination';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';

const MasterJenjangStudi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingJenjangStudi, setEditingJenjangStudi] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const { data: jenjangStudiData = { jenjang_studi: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['jenjangStudi', searchTerm, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/jenjang-studi', {
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

  const handleEdit = (jenjangStudi) => {
    setEditingJenjangStudi(jenjangStudi);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery=true) => {
    if(isQuery) {
      queryClient.invalidateQueries(['jenjangStudi']);
    }
    setShowDialog(false);
    setEditingJenjangStudi(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/jenjang-studi/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['jenjangStudi']);
      toast({
        title: "Success",
        description: "Jenjang studi berhasil dihapus.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus jenjang studi.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Master Jenjang Studi</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola jenjang studi</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Master Jenjang Studi</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Master Jenjang Studi digunakan untuk mengkategorikan tingkat pendidikan dalam sistem.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Kode:</strong> Kode unik untuk jenjang studi</p>
                  <p>• <strong className="font-semibold">Nama:</strong> Nama jenjang studi</p>
                  <p>• <strong className="font-semibold">Deskripsi:</strong> Deskripsi atau keterangan jenjang studi</p>
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
                Tambah Jenjang Studi
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : jenjangStudiData.jenjang_studi.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada jenjang studi. Tambahkan jenjang studi pertama.
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
                    {jenjangStudiData.jenjang_studi.map((jenjangStudi) => (
                      <TableRow key={jenjangStudi.id}>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {jenjangStudi.code || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm uppercase">
                            {jenjangStudi.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {jenjangStudi.description && jenjangStudi.description.length > 50 ? (
                            <Tooltip className="text-left" content={jenjangStudi.description}>
                              <p className="text-sm text-slate-600 max-w-xs truncate">
                                {jenjangStudi.description}
                              </p>
                            </Tooltip>
                          ) : (
                            <p className="text-sm text-slate-600">
                              {jenjangStudi.description || 'Tidak ada deskripsi'}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(jenjangStudi)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (confirm('Yakin ingin menghapus jenjang studi ini?')) {
                                  deleteMutation.mutate(jenjangStudi.id);
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
            {!isLoading && jenjangStudiData.jenjang_studi.length > 0 && jenjangStudiData.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={jenjangStudiData.pagination.total_pages}
                total={jenjangStudiData.pagination.total}
                limit={jenjangStudiData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog */}
      <AddEditJenjangStudiDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingJenjangStudi={editingJenjangStudi}
        onFinish={finishSubmit}
        />
    </div>
  );
};

export default MasterJenjangStudi;
