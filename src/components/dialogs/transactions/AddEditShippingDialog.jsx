import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { shippingSchema } from '@/utils/validations/SalesTransaction';
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
import Select from '@/components/ui/select';

const AddEditShippingDialog = ({ isOpen, onClose, transactionId, editingShipping, onSuccess }) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const isEditMode = !!editingShipping;

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(shippingSchema),
        defaultValues: {
            transaction_id: transactionId,
            expedition_id: '',
            no_resi: '',
            total_amount: 0,
        },
    });

    // Fetch expeditions
    const { data: expeditionsData = { expeditions: [] } } = useQuery({
        queryKey: ['expeditions', 'all'],
        queryFn: async () => {
            const response = await api.get('/expeditions?all=true');
            return response.data;
        },
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (isOpen) {
            if (editingShipping) { // Edit mode
                reset({
                    id: editingShipping.id,
                    transaction_id: transactionId,
                    expedition_id: editingShipping.expedition_id,
                    no_resi: editingShipping.no_resi,
                    total_amount: editingShipping.total_amount,
                });
            } else { // Create mode
                reset({
                    transaction_id: transactionId,
                    expedition_id: '',
                    no_resi: '',
                    total_amount: 0,
                });
            }
        }
    }, [isOpen, editingShipping, transactionId, reset]);

    const createMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.post(`/sales-transactions/${transactionId}/shippings`, data);
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Pengiriman berhasil ditambahkan",
                variant: "success",
            });
            handleSuccess();
        },
        onError: (error) => handleError(error, "Gagal menambahkan pengiriman"),
    });

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            const response = await api.put(`/sales-transactions/${transactionId}/shippings/${editingShipping.id}`, data);
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Pengiriman berhasil diperbarui",
                variant: "success",
            });
            handleSuccess();
        },
        onError: (error) => handleError(error, "Gagal memperbarui pengiriman"),
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries(['salesTransaction', transactionId]);
        queryClient.invalidateQueries(['shippings', transactionId]);
        onSuccess();
        onClose();
    };

    const handleError = (error, defaultMsg) => {
        toast({
            title: "Error",
            description: error.response?.data?.error || defaultMsg,
            variant: "destructive",
        });
    };

    const onSubmit = (data) => {
        const payload = {
            ...data,
            total_amount: Number(data.total_amount),
        };

        if (isEditMode) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Pengiriman' : 'Tambah Pengiriman'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input type="hidden" {...register('transaction_id')} />

                    <div className="space-y-2">
                        <Label>Ekspedisi</Label>
                        <Controller
                            name="expedition_id"
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    options={expeditionsData.expeditions.map(exp => ({
                                        value: exp.id,
                                        label: exp.name
                                    }))}
                                    value={value}
                                    onChange={onChange}
                                    placeholder="Pilih Ekspedisi"
                                    searchable={true}
                                />
                            )}
                        />
                        {errors.expedition_id && (
                            <p className="text-red-500 text-sm">{errors.expedition_id.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="no_resi">No. Resi</Label>
                        <Input
                            id="no_resi"
                            placeholder="Masukan nomor resi"
                            {...register('no_resi')}
                        />
                        {errors.no_resi && (
                            <p className="text-red-500 text-sm">{errors.no_resi.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="total_amount">Biaya Ongkir</Label>
                        <CurrencyInput
                            name="total_amount"
                            control={control}
                            placeholder="Contoh: Rp.10,000"
                        />
                        {errors.total_amount && (
                            <p className="text-red-500 text-sm">{errors.total_amount.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddEditShippingDialog;
