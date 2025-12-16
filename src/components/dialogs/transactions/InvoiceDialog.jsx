import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { Download, Loader2 } from 'lucide-react';

const InvoiceDialog = ({ isOpen, onClose, transactionId }) => {
    const invoiceRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    // Fetch transaction details
    const { data: transactionDetail, isLoading, isError } = useQuery({
        queryKey: ['salesTransaction', transactionId],
        queryFn: async () => {
            const response = await api.get(`/sales-transactions/${transactionId}`);
            return response.data?.transaction ?? null;
        },
        enabled: isOpen && !!transactionId,
    });

    // Fetch shippings
    const { data: shippingsData } = useQuery({
        queryKey: ['shippings', transactionId],
        queryFn: async () => {
            const response = await api.get(`/sales-transactions/${transactionId}/shippings`);
            return response.data ?? null;
        },
        enabled: isOpen && !!transactionId,
    });

    // Fetch payments
    const { data: paymentsData } = useQuery({
        queryKey: ['payments', transactionId],
        queryFn: async () => {
            const response = await api.get(`/sales-transactions/${transactionId}/payments`);
            return response.data ?? null;
        },
        enabled: isOpen && !!transactionId,
    });

    const transaction = transactionDetail;
    const shippings = shippingsData?.shippings || transaction?.shippings || [];
    const payments = paymentsData?.payments || transaction?.payments || [];

    // Calculate totals
    const calculateSummary = () => {
        if (!transaction) return { booksSubtotal: 0, shippingsTotal: 0, totalAmount: 0, totalPaid: 0, remaining: 0 };

        const booksSubtotal = transaction.items?.reduce((sum, item) => {
            return sum + ((item.book?.price || 0) * item.quantity);
        }, 0) || 0;

        const shippingsTotal = shippings.reduce((sum, s) => sum + (s.total_amount || 0), 0);
        const totalAmount = booksSubtotal + shippingsTotal;
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const remaining = totalAmount - totalPaid;

        return { booksSubtotal, shippingsTotal, totalAmount, totalPaid, remaining };
    };

    const { booksSubtotal, shippingsTotal, totalAmount, totalPaid, remaining } = calculateSummary();

    // Export to PDF
    const handleExportPDF = async () => {
        if (!invoiceRef.current) return;

        setIsExporting(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = invoiceRef.current;
            const opt = {
                margin: 10,
                filename: `Invoice-${transaction?.no_invoice || 'unknown'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error('Error exporting PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Status badge styles
    const getStatusLabel = (status) => {
        const config = {
            0: 'Booking',
            1: 'Paid Off',
            2: 'Installment'
        };
        return config[status] || 'Unknown';
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invoice Preview</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : isError || !transaction ? (
                    <div className="text-center py-12 text-slate-500">
                        Gagal memuat data transaksi.
                    </div>
                ) : (
                    <div ref={invoiceRef} className="bg-white p-6" style={{ fontFamily: 'Arial, sans-serif' }}>
                        {/* Invoice Header */}
                        <div className="border-b-2 border-slate-800 pb-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-800">INVOICE</h1>
                                    <p className="text-slate-600 mt-1">No: <span className="font-semibold uppercase">{transaction.no_invoice}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-600">Tanggal Transaksi:</p>
                                    <p className="font-semibold">{formatDate(transaction.transaction_date)}</p>
                                    {transaction.payment_type === 'K' && transaction.due_date && (
                                        <>
                                            <p className="text-slate-600 mt-2">Jatuh Tempo:</p>
                                            <p className="font-semibold text-red-600">{formatDate(transaction.due_date)}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Biller & Sales Associate Info */}
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Biller / Perusahaan</h3>
                                <p className="font-semibold text-slate-800">{transaction.biller?.name || '-'}</p>
                                {transaction.biller?.address && (
                                    <p className="text-sm text-slate-600 mt-1">{transaction.biller.address}</p>
                                )}
                                {transaction.biller?.phone && (
                                    <p className="text-sm text-slate-600">Telp: {transaction.biller.phone}</p>
                                )}
                                {transaction.biller?.email && (
                                    <p className="text-sm text-slate-600">{transaction.biller.email}</p>
                                )}
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">Sales Associate</h3>
                                <p className="font-semibold text-slate-800">{transaction.sales_associate?.name || '-'}</p>
                                {transaction.sales_associate?.phone && (
                                    <p className="text-sm text-slate-600">Telp: {transaction.sales_associate.phone}</p>
                                )}
                                {transaction.sales_associate?.email && (
                                    <p className="text-sm text-slate-600">{transaction.sales_associate.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Detail Pembelian</h3>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-800 text-white">
                                        <th className="border border-slate-300 px-3 py-2 text-left text-sm">No</th>
                                        <th className="border border-slate-300 px-3 py-2 text-left text-sm">Nama Buku</th>
                                        <th className="border border-slate-300 px-3 py-2 text-left text-sm">Penerbit</th>
                                        <th className="border border-slate-300 px-3 py-2 text-center text-sm">Qty</th>
                                        <th className="border border-slate-300 px-3 py-2 text-right text-sm">Harga</th>
                                        <th className="border border-slate-300 px-3 py-2 text-right text-sm">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transaction.items?.map((item, index) => (
                                        <tr key={item.id || index} className="hover:bg-slate-50">
                                            <td className="border border-slate-300 px-3 py-2 text-sm">{index + 1}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-sm font-medium">{item.book?.name || '-'}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-sm">{item.book?.publisher?.name || '-'}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-center text-sm">{item.quantity}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right text-sm">{formatRupiah(item.book?.price || 0)}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right text-sm font-medium">
                                                {formatRupiah((item.book?.price || 0) * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!transaction.items || transaction.items.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="border border-slate-300 px-3 py-4 text-center text-slate-500">
                                                Tidak ada item
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100">
                                        <td colSpan={5} className="border border-slate-300 px-3 py-2 text-right font-semibold">Subtotal Buku:</td>
                                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{formatRupiah(booksSubtotal)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Shippings Table */}
                        {shippings.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Pengiriman</h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-700 text-white">
                                            <th className="border border-slate-300 px-3 py-2 text-left text-sm">No</th>
                                            <th className="border border-slate-300 px-3 py-2 text-left text-sm">Ekspedisi</th>
                                            <th className="border border-slate-300 px-3 py-2 text-left text-sm">No. Resi</th>
                                            <th className="border border-slate-300 px-3 py-2 text-right text-sm">Biaya</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shippings.map((shipping, index) => (
                                            <tr key={shipping.id || index} className="hover:bg-slate-50">
                                                <td className="border border-slate-300 px-3 py-2 text-sm">{index + 1}</td>
                                                <td className="border border-slate-300 px-3 py-2 text-sm">{shipping.expedition?.name || '-'}</td>
                                                <td className="border border-slate-300 px-3 py-2 text-sm font-mono">{shipping.no_resi || '-'}</td>
                                                <td className="border border-slate-300 px-3 py-2 text-right text-sm">{formatRupiah(shipping.total_amount || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-100">
                                            <td colSpan={3} className="border border-slate-300 px-3 py-2 text-right font-semibold">Total Ongkir:</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{formatRupiah(shippingsTotal)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {/* Payments Table */}
                        {payments.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Riwayat Pembayaran</h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-700 text-white">
                                            <th className="border border-slate-300 px-3 py-2 text-left text-sm">No</th>
                                            <th className="border border-slate-300 px-3 py-2 text-left text-sm">No. Payment</th>
                                            <th className="border border-slate-300 px-3 py-2 text-left text-sm">Tanggal</th>
                                            <th className="border border-slate-300 px-3 py-2 text-left text-sm">Catatan</th>
                                            <th className="border border-slate-300 px-3 py-2 text-right text-sm">Jumlah</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment, index) => (
                                            <tr key={payment.id || index} className="hover:bg-slate-50">
                                                <td className="border border-slate-300 px-3 py-2 text-sm">{index + 1}</td>
                                                <td className="border border-slate-300 px-3 py-2 text-sm font-mono text-xs">{payment.no_payment || '-'}</td>
                                                <td className="border border-slate-300 px-3 py-2 text-sm">{formatDate(payment.payment_date)}</td>
                                                <td className="border border-slate-300 px-3 py-2 text-sm text-slate-600">{payment.note || '-'}</td>
                                                <td className="border border-slate-300 px-3 py-2 text-right text-sm font-medium">{formatRupiah(payment.amount || 0)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-100">
                                            <td colSpan={4} className="border border-slate-300 px-3 py-2 text-right font-semibold">Total Dibayar:</td>
                                            <td className="border border-slate-300 px-3 py-2 text-right font-semibold text-green-600">{formatRupiah(totalPaid)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {/* Summary */}
                        <div className="border-t-2 border-slate-800 pt-4">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div>
                                        <span className="text-sm text-slate-500">Status:</span>
                                        <Badge variant="outline" className={`ml-2 ${
                                            transaction.status === 1 ? 'bg-green-50 text-green-700 border-green-200' :
                                            transaction.status === 2 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {getStatusLabel(transaction.status)}
                                        </Badge>
                                    </div>
                                    <div>
                                        <span className="text-sm text-slate-500">Pembayaran:</span>
                                        <Badge variant="outline" className={`ml-2 ${
                                            transaction.payment_type === 'T'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-orange-50 text-orange-700 border-orange-200'
                                        }`}>
                                            {transaction.payment_type === 'T' ? 'Cash' : 'Credit'}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="text-right space-y-1">
                                    <div className="flex justify-between gap-8">
                                        <span className="text-slate-600">Subtotal Buku:</span>
                                        <span className="font-medium">{formatRupiah(booksSubtotal)}</span>
                                    </div>
                                    <div className="flex justify-between gap-8">
                                        <span className="text-slate-600">Total Ongkir:</span>
                                        <span className="font-medium">{formatRupiah(shippingsTotal)}</span>
                                    </div>
                                    <div className="flex justify-between gap-8 border-t pt-1">
                                        <span className="font-bold text-lg">TOTAL:</span>
                                        <span className="font-bold text-lg text-blue-600">{formatRupiah(totalAmount)}</span>
                                    </div>
                                    {payments.length > 0 && (
                                        <>
                                            <div className="flex justify-between gap-8">
                                                <span className="text-slate-600">Total Dibayar:</span>
                                                <span className="font-medium text-green-600">{formatRupiah(totalPaid)}</span>
                                            </div>
                                            <div className="flex justify-between gap-8">
                                                <span className="text-slate-600">Sisa Tagihan:</span>
                                                <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatRupiah(remaining)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
                            <p>Invoice ini dicetak secara otomatis oleh sistem PustakaDB</p>
                            <p>Tanggal cetak: {formatDate(new Date())}</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                    {transaction && (
                        <Button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="bg-blue-900 hover:bg-blue-800"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Mengunduh...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export PDF
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceDialog;
