import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { salesTransactionInstallmentSchema } from '@/utils/validations/SalesTransaction';
import { useToast } from '@/components/ui/use-toast';
import { formatRupiah } from '@/utils/formatters';
import { DollarSign, TrendingDown } from 'lucide-react';

const AddInstallmentDialog = ({ isOpen, onClose, transactionId, remainingBalance, onFinish }) => {
  const { toast } = useToast();
  const [typedAmount, setTypedAmount] = useState(0);

  const initialData = {
    transaction_id: transactionId,
    installment_date: new Date().toISOString().split('T')[0],
    amount: 0,
    note: '',
  };

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(salesTransactionInstallmentSchema),
    defaultValues: initialData
  });

  const currentAmount = watch('amount');

  // Update typed amount for real-time display
  useEffect(() => {
    const amount = parseFloat(currentAmount) || 0;
    setTypedAmount(amount);
  }, [currentAmount]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      reset({
        ...initialData,
        transaction_id: transactionId,
      });
      setTypedAmount(0);
    }
  }, [isOpen, transactionId, reset]);

  const createInstallmentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/sales-transactions/${transactionId}/installments`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pembayaran cicilan berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan pembayaran cicilan.",
        variant: "destructive",
      });
    }
  });

  const onFinishing = () => {
    reset(initialData);
    setTypedAmount(0);
    onFinish();
  };

  const onClosing = () => {
    reset(initialData);
    setTypedAmount(0);
    onClose();
  };

  const onHandleSubmit = async (data) => {
    // Validate amount
    const amount = parseFloat(data.amount);

    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Jumlah pembayaran harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    if (amount > remainingBalance) {
      toast({
        title: "Error",
        description: `Jumlah pembayaran tidak boleh melebihi sisa hutang (${formatRupiah(remainingBalance)})`,
        variant: "destructive",
      });
      return;
    }

    // Convert amount to number
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
    };

    createInstallmentMutation.mutate(payload);
  };

  // Calculate remaining after this payment
  const remainingAfterPayment = Math.max(0, remainingBalance - typedAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pembayaran Cicilan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="space-y-4 py-4">
            {/* Remaining Balance Display */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Sisa Hutang</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatRupiah(remainingBalance)}
              </div>
            </div>

            {/* Installment Date */}
            <div className="space-y-2">
              <Label htmlFor="installment_date">Tanggal Pembayaran *</Label>
              <Input
                id="installment_date"
                type="date"
                {...register('installment_date')}
              />
              {errors.installment_date && (
                <p className="text-red-500 text-sm">{errors.installment_date.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah Pembayaran *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={remainingBalance}
                placeholder="Masukkan jumlah pembayaran"
                {...register('amount')}
              />
              <p className="text-xs text-slate-500">
                Maksimal: {formatRupiah(remainingBalance)}
              </p>
              {errors.amount && (
                <p className="text-red-500 text-sm">{errors.amount.message}</p>
              )}
            </div>

            {/* Real-time Remaining Display */}
            {typedAmount > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Perhitungan</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Jumlah Pembayaran:</span>
                    <span className="font-semibold text-green-700">{formatRupiah(typedAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-green-200">
                    <span className="text-slate-700">Sisa Setelah Pembayaran:</span>
                    <span className={`font-bold ${remainingAfterPayment === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                      {formatRupiah(remainingAfterPayment)}
                    </span>
                  </div>
                </div>
                {remainingAfterPayment === 0 && (
                  <p className="text-xs text-green-700 font-medium mt-2">
                    ✓ Pembayaran ini akan melunasi transaksi
                  </p>
                )}
              </div>
            )}

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">Catatan (Opsional)</Label>
              <Textarea
                id="note"
                rows={3}
                placeholder="Catatan pembayaran..."
                {...register('note')}
              />
              {errors.note && (
                <p className="text-red-500 text-sm">{errors.note.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClosing}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createInstallmentMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createInstallmentMutation.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddInstallmentDialog;
