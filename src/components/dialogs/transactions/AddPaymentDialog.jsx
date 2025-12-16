import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { paymentSchema } from '@/utils/validations/SalesTransaction';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { useToast } from '@/components/ui/use-toast';
import { formatRupiah } from '@/utils/formatters';

const AddPaymentDialog = ({ isOpen, onClose, transactionId, remainingAmount, onSuccess }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            transaction_id: transactionId,
            payment_date: new Date().toISOString().split('T')[0],
            amount: 0,
            note: '',
        },
    });

    useEffect(() => {
        if (isOpen && transactionId) {
            reset({
                transaction_id: transactionId,
                payment_date: new Date().toISOString().split('T')[0],
                amount: 0,
                note: '',
            });
        }
    }, [isOpen, transactionId, reset]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            // Validate amount against remaining amount
            if (data.amount > remainingAmount) {
                throw new Error(`Pembayaran melebihi sisa tagihan (${formatRupiah(remainingAmount)})`);
            }
            const response = await api.post(`/sales-transactions/${transactionId}/payments`, data);
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Pembayaran berhasil ditambahkan",
                variant: "success",
            });
            queryClient.invalidateQueries(['salesTransaction', transactionId]);
            queryClient.invalidateQueries(['payments', transactionId]);
            onSuccess();
            onClose();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message || error.response?.data?.error || "Gagal menambahkan pembayaran",
                variant: "destructive",
            });
        },
    });

    const onSubmit = (data) => {
        mutation.mutate({
            ...data,
            amount: Number(data.amount),
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Tambah Pembayaran</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input type="hidden" {...register('transaction_id')} />

                    <div className="space-y-2">
                        <Label>Sisa Tagihan</Label>
                        <div className="p-2 bg-slate-100 rounded text-slate-700 font-medium">
                            {formatRupiah(remainingAmount)}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payment_date">Tanggal Pembayaran</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            {...register('payment_date')}
                        />
                        {errors.payment_date && (
                            <p className="text-red-500 text-sm">{errors.payment_date.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Jumlah Pembayaran</Label>
                        <CurrencyInput
                          name="amount"
                          control={control}
                          placeholder="Contoh: Rp.10,000"
                        />
                        {errors.amount && (
                            <p className="text-red-500 text-sm">{errors.amount.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Catatan (Optional)</Label>
                        <Input
                            id="note"
                            placeholder="Contoh: Transfer BCA"
                            {...register('note')}
                        />
                        {errors.note && (
                            <p className="text-red-500 text-sm">{errors.note.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            Simpan Pembayaran
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPaymentDialog;
