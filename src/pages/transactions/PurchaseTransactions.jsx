import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingBag } from 'lucide-react';
import AddEditPurchaseTransactionDialog from '@/components/dialogs/transactions/AddEditPurchaseTransactionDialog';
import ViewPurchaseTransactionDialog from '@/components/dialogs/transactions/ViewPurchaseTransactionDialog';
import { useToast } from '@/components/ui/use-toast';
import { createPurchaseTransactionsColumnDefs, defaultColDef } from '@/config/purchaseTransactionsGridColumns';
import '@/styles/ag-grid-overrides.css';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Map AG Grid column fields to API sort fields
const SORT_FIELD_MAP = {
  'no_invoice': 'no_invoice',
  'supplier.code': 'supplier_name',
  'purchase_date': 'purchase_date',
  'total_amount': 'total_amount',
  'status': 'status',
  'created_at': 'created_at',
};

// Map AG Grid column fields to API filter fields
const FILTER_FIELD_MAP = {
  'no_invoice': 'no_invoice',
  'supplier.code': 'supplier_name',
  'purchase_date': 'purchase_date',
  'total_amount': 'total_amount',
  'status': 'status',
  'created_at': 'created_at',
};

const PurchaseTransactions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const gridRef = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // View Dialog State
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewTransaction, setViewTransaction] = useState(null);

  // Sorting and Filtering State
  const [sortModel, setSortModel] = useState({ sort_by: '', sort_order: '' });
  const [columnFilters, setColumnFilters] = useState({});

  // Pagination State
  const [paginationModel, setPaginationModel] = useState({ page: 1, pageSize: 50 });

  const { data: transactionsData = { purchase_transactions: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['purchaseTransactions', paginationModel, sortModel, columnFilters],
    queryFn: async () => {
      const params = {
        page: paginationModel.page,
        limit: paginationModel.pageSize,
        ...columnFilters,
      };

      // Add sorting params if set
      if (sortModel.sort_by) {
        params.sort_by = sortModel.sort_by;
        params.sort_order = sortModel.sort_order || 'asc';
      }

      const response = await api.get('/purchase-transactions', { params });

      // Transform purchase_date to date-only format (strip time component)
      if (response.data?.purchase_transactions) {
        response.data.purchase_transactions = response.data.purchase_transactions.map(tx => ({
          ...tx,
          purchase_date: tx.purchase_date ? tx.purchase_date.split('T')[0] : tx.purchase_date
        }));
      }

      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const handleView = useCallback((transaction) => {
    setViewTransaction(transaction);
    setShowViewDialog(true);
  }, []);

  const handleEdit = useCallback((transaction) => {
    if (transaction.status !== 0) {
      toast({
        title: "Info",
        description: "Hanya transaksi dengan status Pending yang dapat diedit.",
        variant: "default",
      });
      return;
    }
    setEditingTransaction(transaction);
    setShowDialog(true);
  }, [toast]);

  const finishSubmit = (isQuery = true) => {
    if (isQuery) {
      queryClient.invalidateQueries(['purchaseTransactions']);
    }
    setShowDialog(false);
    setEditingTransaction(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/purchase-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseTransactions']);
      toast({
        title: "Success",
        description: "Transaksi berhasil dihapus.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus transaksi.",
        variant: "destructive",
      });
    }
  });

  const completeMutation = useMutation({
    mutationFn: async (id) => {
      await api.post(`/purchase-transactions/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseTransactions']);
      toast({
        title: "Success",
        description: "Transaksi berhasil ditandai selesai. Stok buku telah ditambahkan.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menyelesaikan transaksi.",
        variant: "destructive",
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      await api.post(`/purchase-transactions/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseTransactions']);
      toast({
        title: "Success",
        description: "Transaksi berhasil dibatalkan.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal membatalkan transaksi.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = useCallback((transaction) => {
    deleteMutation.mutate(transaction.id);
  }, [deleteMutation]);

  const handleComplete = useCallback((transaction) => {
    completeMutation.mutate(transaction.id);
  }, [completeMutation]);

  const handleCancel = useCallback((transaction) => {
    cancelMutation.mutate(transaction.id);
  }, [cancelMutation]);

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
          // For equals, send both min and max with the same value
          apiFilters[`${apiField}_min`] = filterData.filter;
          apiFilters[`${apiField}_max`] = filterData.filter;
        } else if (filterData.type === 'greaterThan') {
          apiFilters[`${apiField}_min`] = filterData.filter;
        } else if (filterData.type === 'lessThan') {
          apiFilters[`${apiField}_max`] = filterData.filter;
        } else if (filterData.type === 'inRange') {
          apiFilters[`${apiField}_min`] = filterData.filter;
          apiFilters[`${apiField}_max`] = filterData.filterTo;
        }
      } else if (filterData.filterType === 'date') {
        // Helper function to format datetime as ISO string (YYYY-MM-DDTHH:mm:ss)
        const formatDateTimeToString = (date, isEndOfDay = false) => {
          if (!date) return null;
          const d = new Date(date);

          // For created_at field, we need datetime precision
          if (apiField === 'created_at') {
            if (isEndOfDay) {
              // Set to end of day (23:59:59)
              d.setHours(23, 59, 59, 999);
            } else {
              // Set to start of day (00:00:00)
              d.setHours(0, 0, 0, 0);
            }
            return d.toISOString();
          }

          // For other date fields (like purchase_date), use date-only format
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Handle date range filters
        if (filterData.type === 'equals') {
          const isCreatedAt = apiField === 'created_at';
          apiFilters[`${apiField}_from`] = formatDateTimeToString(filterData.dateFrom, false);
          apiFilters[`${apiField}_to`] = formatDateTimeToString(filterData.dateFrom, isCreatedAt);
        } else if (filterData.type === 'greaterThan') {
          apiFilters[`${apiField}_from`] = formatDateTimeToString(filterData.dateFrom, false);
        } else if (filterData.type === 'lessThan') {
          apiFilters[`${apiField}_to`] = formatDateTimeToString(filterData.dateFrom, true);
        } else if (filterData.type === 'inRange') {
          apiFilters[`${apiField}_from`] = formatDateTimeToString(filterData.dateFrom, false);
          apiFilters[`${apiField}_to`] = formatDateTimeToString(filterData.dateTo, true);
        }
      }
    });

    // Reset to page 1 when filters change
    setPaginationModel(prev => ({ ...prev, page: 1 }));
    setColumnFilters(apiFilters);
  }, []);

  const columnDefs = useMemo(
    () => createPurchaseTransactionsColumnDefs({
      onView: handleView,
      onEdit: handleEdit,
      onDelete: handleDelete,
      onComplete: handleComplete,
      onCancel: handleCancel,
    }),
    [handleView, handleEdit, handleDelete, handleComplete, handleCancel]
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Transaksi Pembelian</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola transaksi pembelian buku dari penerbit</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Transaksi Pembelian</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Sistem transaksi pembelian untuk mengelola pengadaan buku dari penerbit. Stok buku akan ditambahkan setelah transaksi ditandai selesai.
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Pending:</strong> Transaksi masih dalam proses, dapat diedit atau dibatalkan</p>
                  <p>• <strong className="font-semibold">Selesai:</strong> Transaksi selesai, stok buku telah ditambahkan</p>
                  <p>• <strong className="font-semibold">Dibatalkan:</strong> Transaksi dibatalkan, tidak mempengaruhi stok</p>
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
                  setEditingTransaction(null);
                  setShowDialog(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Transaksi
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
                rowData={transactionsData?.purchase_transactions || []}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                animateRows={true}
                suppressRowClickSelection={true}
                pagination={true}
                paginationPageSize={paginationModel.pageSize}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                suppressPaginationPanel={false}
                rowModelType="clientSide"
                onPaginationChanged={(params) => {
                  const currentPage = params.api.paginationGetCurrentPage() + 1;
                  const pageSize = params.api.paginationGetPageSize();
                  if (currentPage !== paginationModel.page || pageSize !== paginationModel.pageSize) {
                    setPaginationModel({ page: currentPage, pageSize });
                  }
                }}
                rowCount={transactionsData?.total || 0}
                domLayout="normal"
                tooltipShowDelay={200}
                tooltipHideDelay={2000}
                overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Loading...</span>'}
                overlayNoRowsTemplate={'<span>Belum ada transaksi pembelian. Klik "Tambah Transaksi" untuk membuat transaksi pertama.</span>'}
                loading={isLoading}
                getRowId={(params) => params.data.id}
                onSortChanged={onSortChanged}
                onFilterChanged={onFilterChanged}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AddEditPurchaseTransactionDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        transactionId={editingTransaction?.id}
        onFinish={finishSubmit}
      />

      <ViewPurchaseTransactionDialog
        isOpen={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        transactionId={viewTransaction?.id}
        initialData={viewTransaction}
      />
    </div>
  );
};

export default PurchaseTransactions;
