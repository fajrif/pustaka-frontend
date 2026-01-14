import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2, ShoppingBag, Eye, Filter, X, CheckCircle, XCircle } from 'lucide-react';
import AddEditPurchaseTransactionDialog from '@/components/dialogs/transactions/AddEditPurchaseTransactionDialog';
import ViewPurchaseTransactionDialog from '@/components/dialogs/transactions/ViewPurchaseTransactionDialog';
import PurchaseFilterDialog from '@/components/dialogs/transactions/PurchaseFilterDialog';
import Pagination from '@/components/Pagination';
import { formatDate, formatRupiah } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';

const statusConfig = {
  0: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  1: { label: 'Selesai', className: 'bg-green-50 text-green-700 border-green-200' },
  2: { label: 'Dibatalkan', className: 'bg-red-50 text-red-700 border-red-200' },
};

const PurchaseTransactions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // View Dialog State
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewTransaction, setViewTransaction] = useState(null);

  // Filter Dialog State
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;
  };

  const { data: transactionsData = { purchase_transactions: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['purchaseTransactions', searchTerm, currentPage, limit, filters],
    queryFn: async () => {
      const response = await api.get('/purchase-transactions', {
        params: {
          search: searchTerm,
          page: currentPage,
          limit: limit,
          ...filters,
        },
      });
      return response.data;
    },
    enabled: searchTerm.length === 0 || searchTerm.length >= 3,
    placeholderData: keepPreviousData,
  });

  const handleView = (transaction) => {
    setViewTransaction(transaction);
    setShowViewDialog(true);
  };

  const handleEdit = (transaction) => {
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
  };

  const finishSubmit = (isQuery = true) => {
    if (isQuery) {
      queryClient.invalidateQueries(['purchaseTransactions']);
    }
    setShowDialog(false);
    setEditingTransaction(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
    setShowFilterDialog(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
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

  const handleDelete = (transaction) => {
    const message = transaction.status === 1
      ? 'Yakin ingin menghapus transaksi ini? Stok buku akan dikembalikan.'
      : 'Yakin ingin menghapus transaksi ini?';
    if (confirm(message)) {
      deleteMutation.mutate(transaction.id);
    }
  };

  const handleComplete = (transaction) => {
    if (confirm('Tandai transaksi ini sebagai selesai? Stok buku akan ditambahkan.')) {
      completeMutation.mutate(transaction.id);
    }
  };

  const handleCancel = (transaction) => {
    if (confirm('Yakin ingin membatalkan transaksi ini?')) {
      cancelMutation.mutate(transaction.id);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig[0];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

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
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Cari no PO atau nama penerbit..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterDialog(true)}
                    className="gap-2 relative"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {getActiveFilterCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </Button>
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
              </div>

              {/* Active Filters */}
              {getActiveFilterCount() > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Filter aktif:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.status !== undefined && filters.status !== '' && (
                      <Badge variant="secondary" className="gap-1">
                        Status: {statusConfig[filters.status]?.label}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, status: '' }))} />
                      </Badge>
                    )}
                    {filters.supplier_id && (
                      <Badge variant="secondary" className="gap-1">
                        Penerbit
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, supplier_id: '' }))} />
                      </Badge>
                    )}
                    {filters.start_date && (
                      <Badge variant="secondary" className="gap-1">
                        Dari: {filters.start_date}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, start_date: '' }))} />
                      </Badge>
                    )}
                    {filters.end_date && (
                      <Badge variant="secondary" className="gap-1">
                        Sampai: {filters.end_date}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, end_date: '' }))} />
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                  >
                    Hapus Semua
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-slate-500">Loading...</p>
              </div>
            ) : transactionsData.purchase_transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Belum ada transaksi pembelian</p>
                <p className="text-sm mt-2">Klik "Tambah Transaksi" untuk membuat transaksi pertama</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">No PO</TableHead>
                      <TableHead>Penerbit</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-center">Total Item</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[200px] text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData.purchase_transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <span
                            className="uppercase cursor-pointer hover:underline hover:text-purple-600 font-medium"
                            onClick={() => handleView(transaction)}
                          >
                            {transaction.no_invoice || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">
                            {transaction.supplier?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {formatDate(transaction.purchase_date)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {transaction.items?.length || 0} item
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatRupiah(transaction.total_amount)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={transaction.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleView(transaction)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {transaction.status === 0 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleComplete(transaction)}
                                  className="text-green-600 hover:text-green-700"
                                  title="Tandai Selesai"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleEdit(transaction)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleCancel(transaction)}
                                  className="text-orange-500 hover:text-orange-700"
                                  title="Batalkan"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(transaction)}
                              className="text-red-500 hover:text-red-700"
                              title="Hapus"
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

            {!isLoading && transactionsData.purchase_transactions.length > 0 && transactionsData.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={transactionsData.pagination.total_pages}
                total={transactionsData.pagination.total}
                limit={transactionsData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
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

      <PurchaseFilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default PurchaseTransactions;
