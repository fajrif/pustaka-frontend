import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Search, Filter, Trash2, Tag } from 'lucide-react';
import AddEditJenisBukuDialog from '@/components/dialogs/masters/AddEditJenisBukuDialog';

const MasterJenisBuku = () => {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingBookType, setEditingBookType] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: bookTypesData = { jenis_buku: [] }, isLoading } = useQuery({
    queryKey: ['bookTypes', searchTerm],
    queryFn: async () => {
      const response = await api.get('/jenis-buku', {
        params: {
          search: searchTerm,
        },
      });
      return response.data;
    },
    enabled: searchTerm.length === 0 || searchTerm.length >= 3,
    placeholderData: keepPreviousData,
  });

  const handleEdit = (bookType) => {
    setEditingBookType(bookType);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery=true) => {
    if(isQuery) {
      queryClient.invalidateQueries(['bookTypes']);
    }
    setShowDialog(false);
    setEditingBookType(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/jenis-buku/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookTypes']);
    }
  });

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Jenis Buku</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola jenis buku</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Master Jenis Buku</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Master Jenis Buku digunakan untuk mengkategorikan jenis dalam sistem.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Kode:</strong> Kode unik untuk jenis buku</p>
                  <p>• <strong className="font-semibold">Nama:</strong> Nama jenis buku</p>
                  <p>• <strong className="font-semibold">Deskripsi:</strong> Deskripsi atau keterangan jenis buku tsb.</p>
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                Tambah Jenis Buku
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : bookTypesData.jenis_buku.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Belum ada jenis buku. Tambahkan jenis buku pertama.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookTypesData.jenis_buku.map((bookType) => (
                      <TableRow key={bookType.id}>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {bookType.code || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">
                            {bookType.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {bookType.description.length > 50 ? (
                            <Tooltip className="text-left" content={bookType.description}>
                              <p className="text-sm text-slate-600 max-w-xs truncate">
                                {bookType.description}
                              </p>
                            </Tooltip>
                          ) : (
                            <p className="text-sm text-slate-600">
                              {bookType.description || 'Tidak ada deskripsi'}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(bookType)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                if (confirm('Yakin ingin menghapus jenis buku ini?')) {
                                  deleteMutation.mutate(bookType.id);
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
          </CardContent>
        </Card>
      </div>
      {/* Form Dialog */}
      <AddEditJenisBukuDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingBookType={editingBookType}
        onFinish={finishSubmit}
        />
    </div>
  );
};

export default MasterJenisBuku;
