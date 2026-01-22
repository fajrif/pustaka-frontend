import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { api } from '@/api/axios';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import AddEditBookDialog from '@/components/dialogs/operationals/AddEditBookDialog';
import { useToast } from '@/components/ui/use-toast';
import { createBooksColumnDefs, defaultColDef } from '@/config/booksGridColumns';
import '@/styles/ag-grid-overrides.css';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Map AG Grid column fields to API sort fields
const SORT_FIELD_MAP = {
  'jenis_buku.code': 'jenis_buku_code',
  'bidang_studi': 'bidang_studi_name',
  'jenjang_studi.code': 'jenjang_studi_code',
  'curriculum.name': 'curriculum_name',
  'kelas': 'kelas',
  'periode': 'periode',
  'year': 'year',
  'merk_buku': 'merk_buku_name',
  'publisher': 'publisher_name',
  'no_pages': 'no_pages',
  'price': 'price',
  'stock': 'stock',
};

// Map AG Grid column fields to API filter fields
const FILTER_FIELD_MAP = {
  'jenis_buku.code': 'jenis_buku_code',
  'bidang_studi': 'bidang_studi_name',
  'jenjang_studi.code': 'jenjang_studi_code',
  'curriculum.name': 'curriculum_name',
  'kelas': 'kelas',
  'periode': 'periode',
  'year': 'year',
  'merk_buku': 'merk_buku_name',
  'publisher': 'publisher_name',
  'no_pages': 'no_pages',
  'price': 'price',
  'stock': 'stock',
};

const MasterBook = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const gridRef = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [sortModel, setSortModel] = useState({ sort_by: '', sort_order: '' });
  const [columnFilters, setColumnFilters] = useState({});

  const { data: booksData = { books: [], pagination: { total: 0, page: 1, limit: 1000, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['books', sortModel, columnFilters],
    queryFn: async () => {
      const params = {
        page: 1,
        limit: 1000, // Fetch all data, let AG Grid handle pagination
        ...columnFilters,
      };

      // Add sorting params if set
      if (sortModel.sort_by) {
        params.sort_by = sortModel.sort_by;
        params.sort_order = sortModel.sort_order || 'asc';
      }

      const response = await api.get('/books', { params });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const handleEdit = useCallback((book) => {
    setEditingBook(book);
    setShowDialog(true);
  }, []);

  const finishSubmit = (isQuery = true) => {
    if (isQuery) {
      queryClient.invalidateQueries(['books']);
    }
    setShowDialog(false);
    setEditingBook(null);
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

  const handleDelete = useCallback((id) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  // Handle AG Grid sort change
  const onSortChanged = useCallback((params) => {
    const sortState = params.api.getColumnState().find(col => col.sort);

    if (sortState) {
      const apiField = SORT_FIELD_MAP[sortState.colId] || sortState.colId;
      setSortModel({
        sort_by: apiField,
        sort_order: sortState.sort,
      });
    } else {
      setSortModel({ sort_by: '', sort_order: '' });
    }
  }, []);

  // Handle AG Grid filter change
  const onFilterChanged = useCallback((params) => {
    const filterModel = params.api.getFilterModel();
    const apiFilters = {};

    Object.entries(filterModel).forEach(([field, filterData]) => {
      const apiField = FILTER_FIELD_MAP[field] || field;

      // Handle different filter types
      if (filterData.filterType === 'text') {
        apiFilters[apiField] = filterData.filter;
      } else if (filterData.filterType === 'number') {
        if (filterData.type === 'equals') {
          apiFilters[apiField] = filterData.filter;
        } else if (filterData.type === 'greaterThan') {
          apiFilters[`${apiField}_min`] = filterData.filter;
        } else if (filterData.type === 'lessThan') {
          apiFilters[`${apiField}_max`] = filterData.filter;
        } else if (filterData.type === 'inRange') {
          apiFilters[`${apiField}_min`] = filterData.filter;
          apiFilters[`${apiField}_max`] = filterData.filterTo;
        }
      }
    });

    setColumnFilters(apiFilters);
  }, []);

  const columnDefs = useMemo(
    () => createBooksColumnDefs({
      onEdit: handleEdit,
      onDelete: handleDelete,
    }),
    [handleEdit, handleDelete]
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-full mx-auto space-y-4">
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
            <div className="flex justify-end">
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
            <div
              style={{ height: 600, width: '100%' }}
            >
              <AgGridReact
                ref={gridRef}
                theme={themeBalham}
                rowData={booksData?.books || []}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
                suppressRowClickSelection={true}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                domLayout="normal"
                tooltipShowDelay={200}
                tooltipHideDelay={2000}
                overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Loading...</span>'}
                overlayNoRowsTemplate={'<span>Belum ada buku. Tambahkan buku pertama anda.</span>'}
                loading={isLoading}
                getRowId={(params) => params.data.id}
                onSortChanged={onSortChanged}
                onFilterChanged={onFilterChanged}
              />
            </div>
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
