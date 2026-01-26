import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { Package, Truck, CreditCard, FileText } from 'lucide-react';
import InvoiceDialog from './InvoiceDialog';

const ViewSalesTransactionDialog = ({ isOpen, onClose, transactionId, initialData }) => {
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

    // Fetch fresh transaction details including payments and shippings
    const { data: transactionDetail, isLoading, isError, error } = useQuery({
        queryKey: ['salesTransaction', transactionId],
        queryFn: async () => {
            const response = await api.get(`/sales-transactions/${transactionId}`);
            return response.data?.transaction ?? null;
        },
        enabled: isOpen && !!transactionId,
    });

    // Fetch shippings separately
    const { data: shippingsData } = useQuery({
        queryKey: ['shippings', transactionId],
        queryFn: async () => {
            const response = await api.get(`/sales-transactions/${transactionId}/shippings`);
            return response.data ?? null;
        },
        enabled: isOpen && !!transactionId,
    });

    // Fetch payments separately
    const { data: paymentsData } = useQuery({
        queryKey: ['payments', transactionId],
        queryFn: async () => {
            const response = await api.get(`/sales-transactions/${transactionId}/payments`);
            return response.data ?? null;
        },
        enabled: isOpen && !!transactionId,
    });

    // Prioritize fetched data, fallback to initialData
    const displayTransaction = transactionDetail || initialData;

    const currentShippings = shippingsData?.shippings || displayTransaction?.shippings || [];
    const currentPayments = paymentsData?.payments || displayTransaction?.payments || [];

    const calculateSummary = () => {
        if (!displayTransaction) return { booksSubtotal: 0, shippingsTotal: 0, totalAmount: 0 };

        const booksSubtotal = displayTransaction.items?.reduce((sum, item) => {
            return sum + ((item.book?.price || 0) * item.quantity);
        }, 0) || 0;

        const shippingsTotal = currentShippings.reduce((sum, s) => sum + s.total_amount, 0);
        const totalAmount = booksSubtotal + shippingsTotal;

        return { booksSubtotal, shippingsTotal, totalAmount };
    };

    const { booksSubtotal, shippingsTotal, totalAmount } = calculateSummary();

    const calculateRemainingBalance = () => {
        if (!displayTransaction) return 0;
        const totalPaid = currentPayments.reduce((sum, p) => sum + p.amount, 0);
        return totalAmount - totalPaid;
    };

    const remainingBalance = calculateRemainingBalance();

    const StatusBadge = ({ status }) => {
        const config = {
            0: { label: 'Pesanan', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
            1: { label: 'Lunas', className: 'bg-green-50 text-green-700 border-green-200' },
            2: { label: 'Angsuran', className: 'bg-blue-50 text-blue-700 border-blue-200' }
        };
        const { label, className } = config[status] || config[0];
        return <Badge variant="outline" className={className}>{label}</Badge>;
    };

    if (!isOpen) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                    </DialogHeader>

                    {isError ? (
                        <div className="flex flex-col justify-center items-center py-12 text-center">
                            <div className="bg-red-100 p-3 rounded-full mb-3">
                                <CreditCard className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-red-700">Gagal Memuat Data</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mb-4">{error?.message || "Terjadi kesalahan saat mengambil detail transaksi."}</p>
                            <Button variant="outline" onClick={onClose}>Tutup</Button>
                        </div>
                    ) : (isLoading && !displayTransaction) ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : !displayTransaction ? (
                        <div className="text-center py-12 text-slate-500">Data transaksi tidak ditemukan.</div>
                    ) : (
                        <div className="space-y-4 py-4">
                            {/* Tabs Section */}
                            <Tabs defaultValue="info" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 bg-blue-100">
                                    <TabsTrigger value="info">Informasi Transaksi</TabsTrigger>
                                    <TabsTrigger value="items">Items</TabsTrigger>
                                    <TabsTrigger value="shipping">Pengiriman</TabsTrigger>
                                    <TabsTrigger value="payment">Pembayaran</TabsTrigger>
                                </TabsList>

                                {/* Tab: Informasi Transaksi */}
                                <TabsContent value="info" className="mt-4">
                                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                                        {displayTransaction.no_invoice && (
                                            <div className="space-y-2">
                                                <Label className="text-slate-500">No Faktur</Label>
                                                <div className="px-3 py-2 uppercase text-blue-700 font-medium bg-white rounded-md shadow-sm border border-slate-200">
                                                    {displayTransaction.no_invoice}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-slate-500">Sales Associate</Label>
                                                <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                                                    <span className="text-sm text-slate-700">{displayTransaction.sales_associate?.name || '-'}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-500">Jenis Pembayaran</Label>
                                                <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                                                    <Badge variant="outline" className={displayTransaction.payment_type === 'T' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                                                        {displayTransaction.payment_type === 'T' ? 'Tunai' : 'Kredit'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-slate-500">Tanggal Transaksi</Label>
                                                <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                                                    <span className="text-sm text-slate-700">{formatDate(displayTransaction.transaction_date)}</span>
                                                </div>
                                            </div>

                                            {displayTransaction.payment_type === 'K' && (
                                                <div className="space-y-2">
                                                    <Label className="text-slate-500">Jatuh Tempo</Label>
                                                    <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                                                        <span className="text-sm text-slate-700">{displayTransaction.due_date ? formatDate(displayTransaction.due_date) : '-'}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label className="text-slate-500">Status</Label>
                                                <div className="px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                                                    <StatusBadge status={displayTransaction.status} />
                                                </div>
                                            </div>
                                        </div>
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
                                                        <TableHead className="p-2 h-auto text-xs font-semibold">Jenis</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold">Bidang Studi</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold">Jenjang</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold">Kelas</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold">Kurikulum</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold">Merk</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold text-right">Harga</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold text-center">Qty</TableHead>
                                                        <TableHead className="p-2 h-auto text-xs font-semibold text-right">Subtotal</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {displayTransaction.items.map((item, index) => {
                                                        if (index === 0) console.log(item);
                                                        return (
                                                            <TableRow key={item.book_id}>
                                                                <TableCell className="p-2 text-xs">
                                                                    <div title={item.book.jenis_buku ? item.book.jenis_buku.name : ''}>
                                                                        {item.book.jenis_buku ? item.book.jenis_buku.code : '-'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="p-2 text-xs">
                                                                    <div className="font-medium truncate max-w-[150px]" title={item.book.bidang_studi ? item.book.bidang_studi.name : ''}>
                                                                        {item.book.bidang_studi ? item.book.bidang_studi.name : '-'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="p-2 text-xs">
                                                                    <div title={item.book.jenjang_studi ? item.book.jenjang_studi.name : ''}>
                                                                        {item.book.jenjang_studi ? item.book.jenjang_studi.code : '-'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="p-2 text-xs">
                                                                    {item.book.kelas}
                                                                </TableCell>
                                                                <TableCell className="p-2 text-xs">
                                                                    <div className="uppercase truncate max-w-[100px]" title={item.book.curriculum ? item.book.curriculum.name : ''}>
                                                                        {item.book.curriculum ? item.book.curriculum.name : '-'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="p-2 text-xs">
                                                                    <div title={item.book.merk_buku ? item.book.merk_buku.name : ''}>
                                                                        {item.book.merk_buku ? item.book.merk_buku.code : '-'}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="p-2 text-xs text-right">{formatRupiah(item.book?.price || 0)}</TableCell>
                                                                <TableCell className="p-2 text-xs text-center"><span>{item.quantity}</span></TableCell>
                                                                <TableCell className="p-2 text-xs text-right font-medium">
                                                                    {formatRupiah((item.book?.price || 0) * item.quantity)}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab: Pengiriman */}
                                <TabsContent value="shipping" className="mt-4">
                                    {!currentShippings || currentShippings.length === 0 ? (
                                        <div className="text-center py-8 border rounded bg-slate-50">
                                            <Truck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="text-slate-500 text-sm">Belum ada pengiriman</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border rounded">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Ekspedisi</TableHead>
                                                        <TableHead>No. Resi</TableHead>
                                                        <TableHead className="text-right">Biaya</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {currentShippings.map((shipping) => (
                                                        <TableRow key={shipping.id}>
                                                            <TableCell>{shipping.expedition?.name || '-'}</TableCell>
                                                            <TableCell><span className="font-mono text-sm">{shipping.no_resi}</span></TableCell>
                                                            <TableCell className="text-right">{formatRupiah(shipping.total_amount)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Tab: Pembayaran */}
                                <TabsContent value="payment" className="mt-4">
                                    {!currentPayments || currentPayments.length === 0 ? (
                                        <div className="text-center py-8 border rounded bg-slate-50">
                                            <CreditCard className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                            <p className="text-slate-500 text-sm">Belum ada riwayat pembayaran</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border rounded">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>No. Pembayaran</TableHead>
                                                        <TableHead>Tanggal</TableHead>
                                                        <TableHead>Catatan</TableHead>
                                                        <TableHead className="text-right">Jumlah</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {currentPayments.map((payment) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell><span className="text-xs font-mono">{payment.no_payment}</span></TableCell>
                                                            <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                                            <TableCell><span className="text-sm text-slate-600">{payment.note || '-'}</span></TableCell>
                                                            <TableCell className="text-right font-medium">{formatRupiah(payment.amount)}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Balance Summary */}
                                    <div className="bg-slate-50 p-4 rounded border flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
                                        <div className="text-sm space-y-1">
                                            <div className="text-slate-600">Total Tagihan: <span className="font-semibold text-slate-900">{formatRupiah(totalAmount)}</span></div>
                                            <div className="text-slate-600">Total Terbayar: <span className="font-semibold text-green-600">{formatRupiah(totalAmount - remainingBalance)}</span></div>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-slate-600 mr-2">Sisa Tagihan:</span>
                                            <span className={`font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatRupiah(remainingBalance)}
                                            </span>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {/* Transaction Summary - Always Visible */}
                            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                                <h3 className="font-semibold text-slate-900">Ringkasan Transaksi</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Subtotal Buku:</span>
                                        <span className="font-medium">{formatRupiah(booksSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Total Ongkir:</span>
                                        <span className="font-medium">{formatRupiah(shippingsTotal)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-slate-300">
                                        <span className="font-bold text-slate-900">TOTAL:</span>
                                        <span className="font-bold text-blue-600">{formatRupiah(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Tutup
                        </Button>
                        {displayTransaction && (
                            <Button
                                type="button"
                                onClick={() => setShowInvoiceDialog(true)}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                Lihat Faktur
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Invoice Dialog */}
            <InvoiceDialog
                isOpen={showInvoiceDialog}
                onClose={() => setShowInvoiceDialog(false)}
                transactionId={transactionId}
            />
        </>
    );
};

export default ViewSalesTransactionDialog;
