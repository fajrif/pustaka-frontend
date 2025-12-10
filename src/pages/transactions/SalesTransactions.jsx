import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Search, Trash2, ShoppingCart, Eye } from 'lucide-react';
import AddEditSalesTransactionDialog from '@/components/dialogs/transactions/AddEditSalesTransactionDialog';
import Pagination from '@/components/Pagination';
import { formatDate, formatRupiah } from '@/utils/formatters';
import { PAGINATION } from '@/utils/constants';
import { useToast } from '@/components/ui/use-toast';
import Select from '@/components/ui/select';

const SalesTransactions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = PAGINATION.DEFAULT_LIMIT;

  const { data: transactionsData = { sales_transactions: [], pagination: { total: 0, page: 1, limit: PAGINATION.DEFAULT_LIMIT, total_pages: 0 } }, isLoading } = useQuery({
    queryKey: ['salesTransactions', searchTerm, currentPage, limit, statusFilter, paymentTypeFilter],
    queryFn: async () => {
      const response = await api.get('/sales-transactions', {
        params: {
          search: searchTerm,
          page: currentPage,
          limit: limit,
          status: statusFilter || undefined,
          payment_type: paymentTypeFilter || undefined,
        },
      });
      return response.data;
    },
    enabled: searchTerm.length === 0 || searchTerm.length >= 3,
    placeholderData: keepPreviousData,
  });

  const handleView = (transaction) => {
    setEditingTransaction(transaction);
    setShowDialog(true);
  };

  const finishSubmit = (isQuery = true) => {
    if (isQuery) {
      queryClient.invalidateQueries(['salesTransactions']);
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

  const handleDelete = (transaction) => {
    const hasInstallments = transaction.installments && transaction.installments.length > 0;
    const confirmMessage = hasInstallments
      ? `Transaksi ini memiliki ${transaction.installments.length} cicilan. Menghapus transaksi akan menghapus semua cicilan. Yakin ingin melanjutkan?`
      : 'Yakin ingin menghapus transaksi ini?';

    if (confirm(confirmMessage)) {
      deleteMutation.mutate(transaction.id);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      0: { label: 'Booking', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      1: { label: 'Paid Off', className: 'bg-green-50 text-green-700 border-green-200' },
      2: { label: 'Installment', className: 'bg-blue-50 text-blue-700 border-blue-200' }
    };
    const { label, className } = config[status] || config[0];
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  // Payment type badge component
  const PaymentTypeBadge = ({ paymentType }) => {
    if (paymentType === 'T') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cash</Badge>;
    }
    return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Credit</Badge>;
  };

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
                  Sistem transaksi penjualan memungkinkan sales associate melakukan pembelian buku dengan metode pembayaran tunai (Cash) atau kredit (Credit).
                </p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• <strong className="font-semibold">Cash (Tunai):</strong> Pembayaran langsung, transaksi selesai saat dibuat</p>
                  <p>• <strong className="font-semibold">Credit (Kredit):</strong> Pembayaran bertahap dengan cicilan, dapat melacak jatuh tempo dan riwayat pembayaran</p>
                  <p>• <strong className="font-semibold">Status:</strong> Booking (0) → Installment (2) → Paid Off (1)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      placeholder="Cari no invoice atau nama sales associate..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="pl-10"
                    />
                  </div>
                </div>
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

              <div className="flex gap-4">
                <div className="w-48">
                  <Select
                    options={[
                      { value: '', label: 'Semua Status' },
                      { value: '0', label: 'Booking' },
                      { value: '1', label: 'Paid Off' },
                      { value: '2', label: 'Installment' }
                    ]}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    placeholder="Filter Status"
                  />
                </div>
                <div className="w-48">
                  <Select
                    options={[
                      { value: '', label: 'Semua Payment' },
                      { value: 'T', label: 'Cash' },
                      { value: 'K', label: 'Credit' }
                    ]}
                    value={paymentTypeFilter}
                    onChange={setPaymentTypeFilter}
                    placeholder="Filter Payment"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-500">Loading...</p>
              </div>
            ) : transactionsData.sales_transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">Belum ada transaksi</p>
                <p className="text-sm mt-2">Klik "Tambah Transaksi" untuk membuat transaksi pertama</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">No Invoice</TableHead>
                      <TableHead>Sales Associate</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[150px] text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData.sales_transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-blue-700 uppercase">
                          {transaction.no_invoice || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-sm">
                            {transaction.sales_associate?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {formatDate(transaction.transaction_date)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <PaymentTypeBadge paymentType={transaction.payment_type} />
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
                              title="View/Edit Transaction"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(transaction)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete Transaction"
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

            {!isLoading && transactionsData.sales_transactions.length > 0 && transactionsData.pagination && (
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

      <AddEditSalesTransactionDialog
        isOpen={showDialog}
        onClose={() => finishSubmit(false)}
        editingTransaction={editingTransaction}
        onFinish={finishSubmit}
      />
    </div>
  );
};

export default SalesTransactions;
