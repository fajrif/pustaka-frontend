import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { getAssetUrl } from '@/helpers/AssetHelper';
import { Download, Loader2 } from 'lucide-react';

// Helper function to spell out numbers in Indonesian
const spellOutNumber = (num) => {
    const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

    if (num < 0) return 'Minus ' + spellOutNumber(Math.abs(num));
    if (num < 12) return ones[num];
    if (num < 20) return spellOutNumber(num - 10) + ' Belas';
    if (num < 100) return spellOutNumber(Math.floor(num / 10)) + ' Puluh' + (num % 10 !== 0 ? ' ' + spellOutNumber(num % 10) : '');
    if (num < 200) return 'Seratus' + (num % 100 !== 0 ? ' ' + spellOutNumber(num % 100) : '');
    if (num < 1000) return spellOutNumber(Math.floor(num / 100)) + ' Ratus' + (num % 100 !== 0 ? ' ' + spellOutNumber(num % 100) : '');
    if (num < 2000) return 'Seribu' + (num % 1000 !== 0 ? ' ' + spellOutNumber(num % 1000) : '');
    if (num < 1000000) return spellOutNumber(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 !== 0 ? ' ' + spellOutNumber(num % 1000) : '');
    if (num < 1000000000) return spellOutNumber(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 !== 0 ? ' ' + spellOutNumber(num % 1000000) : '');
    if (num < 1000000000000) return spellOutNumber(Math.floor(num / 1000000000)) + ' Miliar' + (num % 1000000000 !== 0 ? ' ' + spellOutNumber(num % 1000000000) : '');
    return spellOutNumber(Math.floor(num / 1000000000000)) + ' Triliun' + (num % 1000000000000 !== 0 ? ' ' + spellOutNumber(num % 1000000000000) : '');
};

// Helper function to format periode
const getPeriodeLabel = (periode, year) => {
    if (!year) return '-';
    const nextYear = parseInt(year) + 1;
    if (periode == 1) {
        return `Semester Ganjil ${year}/${nextYear}`;
    } else if (periode == 2) {
        return `Semester Genap ${year}/${nextYear}`;
    }
    return `${year}/${nextYear}`;
};

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

    const transaction = transactionDetail;

    // Calculate totals
    const calculateSummary = () => {
        if (!transaction) return { totalQuantity: 0, totalAmount: 0 };

        const totalQuantity = transaction.items?.reduce((sum, item) => {
            return sum + (item.quantity || 0);
        }, 0) || 0;

        const totalAmount = transaction.items?.reduce((sum, item) => {
            return sum + ((item.book?.price || 0) * item.quantity);
        }, 0) || 0;

        return { totalQuantity, totalAmount };
    };

    const { totalQuantity, totalAmount } = calculateSummary();

    // Get first item's jenis_buku info (as per requirement, all items have same jenis_buku)
    const firstItem = transaction?.items?.[0];
    const jenisBuku = firstItem?.book?.jenis_buku;
    const bookYear = firstItem?.book?.year;
    const bookPeriode = firstItem?.book?.periode;

    // Export to PDF
    const handleExportPDF = async () => {
        if (!invoiceRef.current) return;

        setIsExporting(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = invoiceRef.current;
            const opt = {
                margin: 10,
                filename: `Faktur-${transaction?.no_invoice || 'unknown'}.pdf`,
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

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        {/* Invoice Header with Biller Logo */}
                        <div className="border-b-2 border-slate-800 pb-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    {/* Biller Logo and Info */}
                                    <div className="flex items-start gap-4">
                                        {transaction.biller?.logo_url && (
                                            <img
                                                src={getAssetUrl(transaction.biller.logo_url)}
                                                alt={transaction.biller?.name || 'Biller Logo'}
                                                className="h-16 w-auto object-contain"
                                                crossOrigin="anonymous"
                                            />
                                        )}
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">{transaction.biller?.name || '-'}</h2>
                                            {transaction.biller?.address && (
                                                <p className="text-sm text-slate-600">{transaction.biller.address}</p>
                                            )}
                                            {transaction.biller?.phone && (
                                                <p className="text-sm text-slate-600">Telp: {transaction.biller.phone}</p>
                                            )}
                                            {transaction.biller?.email && (
                                                <p className="text-sm text-slate-600">{transaction.biller.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Sales Associate Info */}
                                    <div className="mb-6">
                                        <h3 className="text-sm  text-slate-500 uppercase mb-2">Kepada Yth.</h3>
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <p className=" text-slate-800">{transaction.sales_associate?.name || '-'}</p>
                                            {transaction.sales_associate?.address && (
                                                <p className="text-sm text-slate-600 mt-1">{transaction.sales_associate.address}</p>
                                            )}
                                            {transaction.sales_associate?.phone && (
                                                <p className="text-sm text-slate-600">Telp: {transaction.sales_associate.phone}</p>
                                            )}
                                            {transaction.sales_associate?.email && (
                                                <p className="text-sm text-slate-600">{transaction.sales_associate.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                {/* Invoice Info */}
                                <div className="">
                                    <h1 className="text-2xl font-bold text-slate-800 mb-2">FAKTUR PENJUALAN</h1>
                                    <table className="ml-auto text-sm">
                                        <tbody>
                                            <tr>
                                                <td className="text-slate-600 pr-2">No.Faktur:</td>
                                                <td className=" text-left uppercase">{transaction.no_invoice}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-slate-600 pr-2">Tanggal:</td>
                                                <td className=" text-left">{formatDate(transaction.transaction_date)}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-slate-600 pr-2">Jenis Buku:</td>
                                                <td className=" text-left">{jenisBuku?.name || '-'}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-slate-600 pr-2">Periode:</td>
                                                <td className=" text-left">{getPeriodeLabel(bookPeriode, bookYear)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="mb-6">
                            <h3 className="text-sm  text-slate-500 uppercase mb-3">Detail Pembelian</h3>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-800 text-white">
                                        <th className="border border-slate-300 px-3 py-2 text-center text-sm w-12">No</th>
                                        <th className="border border-slate-300 px-3 py-2 text-left text-sm">Merk Buku</th>
                                        <th className="border border-slate-300 px-3 py-2 text-left text-sm">Nama Buku</th>
                                        <th className="border border-slate-300 px-3 py-2 text-center text-sm w-16">Qty</th>
                                        <th className="border border-slate-300 px-3 py-2 text-right text-sm w-28">Harga</th>
                                        <th className="border border-slate-300 px-3 py-2 text-right text-sm w-32">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transaction.items?.map((item, index) => (
                                        <tr key={item.id || index} className="hover:bg-slate-50">
                                            <td className="border border-slate-300 px-3 py-2 text-center text-sm">{index + 1}</td>
                                            <td className="border border-slate-300 px-3 py-2 text-sm">
                                                {item.book?.merk_buku ? `[${item.book.merk_buku.code}] ${item.book.merk_buku.name}` : '-'}
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2 text-sm font-medium">{item.book?.name || '-'}</td>
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
                            </table>
                        </div>

                        {/* Summary Section */}
                        <div className="border-t-2 border-slate-800 pt-4 mb-6">
                            <div className="flex justify-between items-start">
                                {/* Spelled Out Amount */}
                                <div className="flex-1 pr-8">
                                    <p className="text-sm text-slate-600 mb-1">Terbilang:</p>
                                    <p className=" text-slate-800 italic border border-slate-300 p-2 rounded bg-slate-50">
                                        # {spellOutNumber(totalAmount)} Rupiah #
                                    </p>
                                </div>

                                {/* Totals */}
                                <div className="text-right space-y-2 min-w-[250px]">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-slate-600">Total Quantity:</span>
                                        <span className="">{totalQuantity} item</span>
                                    </div>
                                    <div className="flex justify-between gap-4 border-t pt-2">
                                        <span className="font-bold text-lg">Total Harga:</span>
                                        <span className="font-bold text-lg text-blue-600">{formatRupiah(totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signature Placeholders */}
                        <div className="mt-8 pt-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="border border-slate-300 p-4 rounded">
                                    <p className="text-sm text-slate-600 mb-16">Dibuat Oleh</p>
                                    <div className="border-t border-slate-400 pt-2">
                                        <p className="text-sm text-slate-500">(............................)</p>
                                    </div>
                                </div>
                                <div className="border border-slate-300 p-4 rounded">
                                    <p className="text-sm text-slate-600 mb-16">Diterima Oleh</p>
                                    <div className="border-t border-slate-400 pt-2">
                                        <p className="text-sm text-slate-500">(............................)</p>
                                    </div>
                                </div>
                                <div className="border border-slate-300 p-4 rounded">
                                    <p className="text-sm text-slate-600 mb-16">Disetujui Oleh</p>
                                    <div className="border-t border-slate-400 pt-2">
                                        <p className="text-sm text-slate-500">(............................)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
                            <p>Faktur ini dicetak secara otomatis oleh sistem ATMA MITRA PRESTASI</p>
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
