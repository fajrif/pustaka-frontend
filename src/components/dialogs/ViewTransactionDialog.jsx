import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Pencil } from 'lucide-react';
import { formatRupiah, formatDate } from '@/utils/formatters';

const ViewTransactionDialog = ({ isOpen, onClose, transaction, onEdit }) => {
  if (!transaction) return null; // Jangan render jika tidak ada data transaksi

  return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Transaksi</DialogTitle>
          </DialogHeader>
          {transaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Tanggal Transaksi</p>
                  <p className="font-medium text-slate-900">
                    {formatDate(transaction.tanggal_transaksi)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Bulan Realisasi</p>
                  <p className="font-medium text-slate-900">
                    {transaction.bulan_realisasi}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Jenis Biaya</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700">
                      {transaction.cost_type_details.kode}
                    </Badge>
                    <span className="font-medium text-slate-900">{transaction.cost_type_details.nama_biaya}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Jumlah Realisasi</p>
                  <p className="font-semibold text-green-600">
                    {formatRupiah(transaction.jumlah_realisasi)}
                  </p>
                </div>
                {transaction.tanggal_po_tagihan && (
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Tanggal PO/Tagihan</p>
                    <p className="font-medium text-slate-900">
                      {formatDate(transaction.tanggal_po_tagihan, 'dd MMMM yyyy')}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Jumlah Tenaga Kerja</p>
                  <p className="font-medium text-slate-900">
                    {transaction.jumlah_tenaga_kerja} orang
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Management Fee</p>
                  <p className="font-semibold text-purple-600">
                    {formatRupiah(transaction.nilai_management_fee || 0)} ({(transaction.persentase_management_fee || 0).toFixed(2)}%)
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Dibuat Oleh</p>
                  <p className="font-medium text-slate-900">{transaction.created_by || '-'}</p>
                </div>
              </div>

              {transaction.deskripsi_realisasi && (
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Deskripsi</p>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-md border border-slate-200">
                    {transaction.deskripsi_realisasi}
                  </p>
                </div>
              )}

              {transaction.bukti_transaksi_url && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Bukti Transaksi</p>
                  <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white">
                    {transaction.bukti_transaksi_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <div className="p-4">
                        <img
                          src={transaction.bukti_transaksi_url}
                          alt="Bukti Transaksi"
                          className="max-w-full h-auto rounded-lg shadow-md"
                        />
                      </div>
                    ) : transaction.bukti_transaksi_url.match(/\.pdf$/i) ? (
                      <div className="w-full h-[600px]">
                        <iframe
                          src={`${transaction.bukti_transaksi_url}#toolbar=0`}
                          className="w-full h-full border-0"
                          title="Preview PDF"
                          type="application/pdf"
                        />
                      </div>
                    ) : (
                      <div className="p-4 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-slate-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {transaction.bukti_transaksi_url.split('/').pop()}
                          </p>
                          <p className="text-xs text-slate-500">Klik tombol di bawah untuk membuka file</p>
                        </div>
                      </div>
                    )}
                    <div className="border-t border-slate-200 p-3 bg-slate-50">
                      <a
                        href={transaction.bukti_transaksi_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Buka di Tab Baru
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );

};

export default ViewTransactionDialog;

