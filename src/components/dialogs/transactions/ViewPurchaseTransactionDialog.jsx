import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { Package, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const statusConfig = {
  0: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  1: { label: 'Selesai', className: 'bg-green-50 text-green-700 border-green-200' },
  2: { label: 'Dibatalkan', className: 'bg-red-50 text-red-700 border-red-200' },
};

const ViewPurchaseTransactionDialog = ({ isOpen, onClose, transactionId, initialData }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch fresh transaction details
  const { data: transactionDetail, isLoading, isError, error } = useQuery({
    queryKey: ['purchaseTransaction', transactionId],
    queryFn: async () => {
      const response = await api.get(`/purchase-transactions/${transactionId}`);
      return response.data?.transaction || response.data?.purchase_transaction || response.data || null;
    },
    enabled: isOpen && !!transactionId,
  });

  // Prioritize fetched data, fallback to initialData
  const displayTransaction = transactionDetail || initialData;

  const completeMutation = useMutation({
    mutationFn: async (id) => {
      await api.post(`/purchase-transactions/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseTransactions']);
      queryClient.invalidateQueries(['purchaseTransaction', transactionId]);
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
      queryClient.invalidateQueries(['purchaseTransaction', transactionId]);
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

  const handleComplete = () => {
    if (confirm('Tandai transaksi ini sebagai selesai? Stok buku akan ditambahkan.')) {
      completeMutation.mutate(transactionId);
    }
  };

  const handleCancel = () => {
    if (confirm('Yakin ingin membatalkan transaksi ini?')) {
      cancelMutation.mutate(transactionId);
    }
  };

  const calculateSummary = () => {
    if (!displayTransaction || !displayTransaction.items) {
      return { totalAmount: 0, totalItems: 0 };
    }

    const totalAmount = displayTransaction.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    return { totalAmount, totalItems: displayTransaction.items.length };
  };

  const { totalAmount, totalItems } = calculateSummary();

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig[0];
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Transaksi Pembelian</DialogTitle>
        </DialogHeader>

        {isError ? (
          <div className="flex flex-col justify-center items-center py-12 text-center">
            <div className="bg-red-100 p-3 rounded-full mb-3">
              <ShoppingBag className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-700">Gagal Memuat Data</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-4">{error?.message || "Terjadi kesalahan saat mengambil detail transaksi."}</p>
            <Button variant="outline" onClick={onClose}>Tutup</Button>
          </div>
        ) : (isLoading && !displayTransaction) ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : !displayTransaction ? (
          <div className="text-center py-12 text-slate-500">Data transaksi tidak ditemukan.</div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Tabs Section */}
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-purple-100">
                <TabsTrigger value="info">Informasi Transaksi</TabsTrigger>
                <TabsTrigger value="items">Items</TabsTrigger>
              </TabsList>

              {/* Tab: Informasi Transaksi */}
              <TabsContent value="info" className="mt-4">
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                  {displayTransaction.no_invoice && (
                    <div className="space-y-2">
                      <Label className="text-slate-500">No PO</Label>
                      <div className="px-3 py-2 uppercase text-purple-700 font-medium bg-white rounded-md shadow-sm border border-slate-200">
                        {displayTransaction.no_invoice}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-500">Penerbit</Label>
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                        <span className="text-sm text-slate-700">{displayTransaction.supplier?.name || '-'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-500">Status</Label>
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                        <StatusBadge status={displayTransaction.status} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-500">Tanggal Pembelian</Label>
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                        <span className="text-sm text-slate-700">{formatDate(displayTransaction.purchase_date)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-500">Total Transaksi</Label>
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                        <span className="text-sm font-semibold text-purple-700">{formatRupiah(displayTransaction.total_amount || totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {displayTransaction.note && (
                    <div className="space-y-2">
                      <Label className="text-slate-500">Catatan</Label>
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                        <span className="text-sm text-slate-700">{displayTransaction.note}</span>
                      </div>
                    </div>
                  )}

                  {displayTransaction.receipt_image_url && (
                    <div className="space-y-2">
                      <Label className="text-slate-500">Bukti Pembelian</Label>
                      <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                        <a
                          href={displayTransaction.receipt_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:underline"
                        >
                          Lihat Bukti
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab: Items */}
              <TabsContent value="items" className="mt-4">
                {!displayTransaction.items || displayTransaction.items.length === 0 ? (
                  <div className="text-center py-8 border rounded bg-slate-50">
                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">Tidak ada items</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Buku</TableHead>
                          <TableHead>Penerbit</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Harga Beli</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayTransaction.items.map((item) => (
                          <TableRow key={item.book_id || item.id}>
                            <TableCell>
                              <span className="font-medium text-sm">{item.book?.name || '-'}</span>
                            </TableCell>
                            <TableCell>{item.book?.publisher?.name || '-'}</TableCell>
                            <TableCell>{item.book?.jenis_buku ? `[${item.book.jenis_buku.code}] ${item.book.jenis_buku.name}` : '-'}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatRupiah(item.price)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatRupiah(item.price * item.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Transaction Summary */}
            <div className="space-y-3 bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-slate-900">Ringkasan Transaksi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Jumlah Item:</span>
                  <span className="font-medium">{totalItems} buku</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-purple-200">
                  <span className="font-bold text-slate-900">TOTAL PEMBELIAN:</span>
                  <span className="font-bold text-purple-600">{formatRupiah(displayTransaction.total_amount || totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {displayTransaction && displayTransaction.status === 0 && (
            <>
              <Button
                type="button"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                variant="outline"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {cancelMutation.isPending ? 'Membatalkan...' : 'Batalkan'}
              </Button>
              <Button
                type="button"
                onClick={handleComplete}
                disabled={completeMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {completeMutation.isPending ? 'Memproses...' : 'Tandai Selesai'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPurchaseTransactionDialog;
