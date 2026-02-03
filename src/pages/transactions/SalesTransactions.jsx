import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeBalham } from 'ag-grid-community';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ShoppingCart } from 'lucide-react';
import AddEditSalesTransactionDialog from '@/components/dialogs/transactions/AddEditSalesTransactionDialog';
import ViewSalesTransactionDialog from '@/components/dialogs/transactions/ViewSalesTransactionDialog';
import InvoiceDialog from '@/components/dialogs/transactions/InvoiceDialog';
import { useToast } from '@/components/ui/use-toast';
import { createSalesTransactionsColumnDefs, defaultColDef } from '@/config/salesTransactionsGridColumns';
import '@/styles/ag-grid-overrides.css';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Map AG Grid column fields to API sort fields
const SORT_FIELD_MAP = {
  'no_invoice': 'no_invoice',
  'sales_associate.name': 'sales_associate_name',
  'transaction_date': 'transaction_date',
  'payment_type': 'payment_type',
  'total_amount': 'total_amount',
  'status': 'status',
};

// Map AG Grid column fields to API filter fields
const FILTER_FIELD_MAP = {
  'no_invoice': 'no_invoice',
  'sales_associate.name': 'sales_associate_name',
  'transaction_date': 'transaction_date',
  'payment_type': 'payment_type',
  'total_amount': 'total_amount',
  'status': 'status',
};


const SalesTransactions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const gridRef = useRef(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // View Dialog State
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewTransaction, setViewTransaction] = useState(null);

  // Invoice Dialog State
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceTransaction, setInvoiceTransaction] = useState(null);

  // Sorting and Filtering State
  const [sortModel, setSortModel] = useState({ sort_by: '', sort_order: '' });
  const [columnFilters, setColumnFilters] = useState({});

  // Pagination State
  const [paginationModel, setPaginationModel] = useState({ page: 1, pageSize: 50 });


  const { data: transactionsData = { sales_transactions: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['salesTransactions', paginationModel, sortModel, columnFilters],
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

      const response = await api.get('/sales-transactions', { params });

      // Transform transaction_date to date-only format (strip time component)
      if (response.data?.sales_transactions) {
        response.data.sales_transactions = response.data.sales_transactions.map(tx => ({
          ...tx,
          transaction_date: tx.transaction_date ? tx.transaction_date.split('T')[0] : tx.transaction_date
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

  const handleInvoice = useCallback((transaction) => {
    setInvoiceTransaction(transaction);
    setShowInvoiceDialog(true);
  }, []);

  const handleEdit = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setShowDialog(true);
  }, []);

  const finishSubmit = (isQuery = true) => {
    if (isQuery) {
      queryClient.invalidateQueries(['salesTransactions']);
    }
    setShowDialog(false);
    setEditingTransaction(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/sales-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['salesTransactions']);
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

  const handleDelete = useCallback((transaction) => {
    if (confirm('Yakin ingin menghapus transaksi ini? Stok akan dikembalikan otomatis.')) {
      deleteMutation.mutate(transaction.id);
    }
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
      } else if (filterData.filterType === 'date') {
        // Helper function to format date as YYYY-MM-DD
        const formatDateToString = (date) => {
          if (!date) return null;
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Handle date range filters
        if (filterData.type === 'equals') {
          const formattedDate = formatDateToString(filterData.dateFrom);
          apiFilters[`${apiField}_from`] = formattedDate;
          apiFilters[`${apiField}_to`] = formattedDate;
        } else if (filterData.type === 'greaterThan') {
          apiFilters[`${apiField}_from`] = formatDateToString(filterData.dateFrom);
        } else if (filterData.type === 'lessThan') {
          apiFilters[`${apiField}_to`] = formatDateToString(filterData.dateFrom);
        } else if (filterData.type === 'inRange') {
          apiFilters[`${apiField}_from`] = formatDateToString(filterData.dateFrom);
          apiFilters[`${apiField}_to`] = formatDateToString(filterData.dateTo);
        }
      }
    });

    // Reset to page 1 when filters change
    setPaginationModel(prev => ({ ...prev, page: 1 }));
    setColumnFilters(apiFilters);
  }, []);


  const columnDefs = useMemo(
    () => createSalesTransactionsColumnDefs({
      onView: handleView,
      onInvoice: handleInvoice,
      onEdit: handleEdit,
      onDelete: handleDelete,
    }),
    [handleView, handleInvoice, handleEdit, handleDelete]
  );

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Transaksi Penjualan</h1>
            <p className="text-slate-500 font-normal mt-1">Kelola transaksi penjualan buku</p>
          </div>
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Transaksi Penjualan</h3>
                <p className="text-sm text-slate-700 mb-3">
                  Sistem transaksi penjualan memungkinkan sales associate melakukan pembelian buku dengan metode pembayaran tunai (Tunai) atau kredit (Kredit).
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Tunai:</strong> Pembayaran langsung, transaksi selesai saat dibuat</p>
                  <p>• <strong className="font-semibold">Kredit:</strong> Pembayaran bertahap dengan cicilan, dapat melacak jatuh tempo dan riwayat pembayaran</p>
                  <p>• <strong className="font-semibold">Status:</strong> Pesanan (0) → Lunas (1) → Angsuran (2)</p>
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
                className="bg-blue-900 hover:bg-blue-800"
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
                rowData={transactionsData?.sales_transactions || []}
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
                overlayNoRowsTemplate={'<span>Belum ada transaksi. Klik "Tambah Transaksi" untuk membuat transaksi pertama.</span>'}
                loading={isLoading}
                getRowId={(params) => params.data.id}
                onSortChanged={onSortChanged}
                onFilterChanged={onFilterChanged}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AddEditSalesTransactionDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        transactionId={editingTransaction?.id}
        onFinish={finishSubmit}
      />

      <ViewSalesTransactionDialog
        isOpen={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        transactionId={viewTransaction?.id}
        initialData={viewTransaction}
      />

      <InvoiceDialog
        isOpen={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        transactionId={invoiceTransaction?.id}
      />
    </div>
  );
};

export default SalesTransactions;
