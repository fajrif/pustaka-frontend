import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { transactionSchema } from "@/utils/validations";

const AddEditTransactionDialog = ({ isOpen, onClose, transaction, onFinish }) => {
  const queryClient = useQueryClient();
  const [uploadingFile, setUploadingFile] = useState(false);

  const initialData = {
    project_id: '',
    tanggal_transaksi: '',
    tanggal_po_tagihan: '',
    cost_type_id: '',
    deskripsi_realisasi: '',
    jumlah_tenaga_kerja: '',
    bukti_transaksi_url: ''
  }

  // --- React Hook Form Setup ---
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction || initialData
  });

  useEffect(() => {
    if (transaction) {
      const formattedData = {
        ...transaction,
        tanggal_transaksi: transaction.tanggal_transaksi ? transaction.tanggal_transaksi.split('T')[0] : '',
        tanggal_po_tagihan: transaction.tanggal_po_tagihan ? transaction.tanggal_po_tagihan.split('T')[0] : '',
      };

      reset(formattedData);
    }
  }, [transaction, reset]);

  const { data: projectsData = { projects: [] } } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    }
  });

  const { data: costTypesData = { cost_types: [] } } = useQuery({
    queryKey: ['costTypes'],
    queryFn: async () => {
      const response = await api.get('/cost-types');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/transactions', data);
      return response.data;
    },
    onSuccess: () => {
      onFinishing();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      onFinishing();
    }
  });

  const onFinishing = () => {
    reset(initialData);
    onFinish();
  };

  const onClosing = () => {
    reset(initialData);
    onClose();
  };

  const onHandleSubmit = async (data) => {
    if (transaction) {
      updateMutation.mutate({ id: transaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="project_id">Proyek *</Label>
              {/* Use the Controller for your custom Select component */}
              <Controller
                name="project_id"
                control={control}
                render={({ field: { onChange, value } }) => (
                  // The render prop passes the necessary onChange and value handlers
                  <Select
                    value={value}
                    onValueChange={onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih proyek" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData.projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <span className="font-medium">{project.judul_pekerjaan}</span> <span className="font-medium text-blue-500 ms-2">[Fee: {project.tarif_management_fee_persen}%]</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  )}
                />
                {errors.project_id && <p className="text-red-500 text-sm">{errors.project_id.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tanggal_po_tagihan">Tanggal PO/Tagihan</Label>
                <Input
                  id="tanggal_po_tagihan"
                  type="date"
                  {...register("tanggal_po_tagihan")}
                />
                {errors.tanggal_po_tagihan && <p className="text-red-500 text-sm">{errors.tanggal_po_tagihan.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggal_transaksi">Tanggal Transaksi *</Label>
                <Input
                  id="tanggal_transaksi"
                  type="date"
                  {...register("tanggal_transaksi")}
                />
                {errors.tanggal_transaksi && <p className="text-red-500 text-sm">{errors.tanggal_transaksi.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_type_id">Jenis Biaya *</Label>
              <Controller
                name="cost_type_id"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    value={value}
                    onValueChange={onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis biaya" />
                    </SelectTrigger>
                    <SelectContent>
                      {costTypesData.cost_types.map((ct) => (
                        <SelectItem key={ct.id} value={ct.id}>
                          <span className="font-medium">{ct.kode}</span> - {ct.nama_biaya}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cost_type_id && <p className="text-red-500 text-sm">{errors.cost_type_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deskripsi_realisasi">Deskripsi *</Label>
              <Textarea
                id="deskripsi_realisasi"
                rows={3}
                {...register("deskripsi_realisasi")}
              />
              {errors.deskripsi_realisasi && <p className="text-red-500 text-sm">{errors.deskripsi_realisasi.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jumlah_realisasi">Jumlah Realisasi (Rp) *</Label>
              <CurrencyInput
                name="jumlah_realisasi"
                control={control}
              />
              {errors.jumlah_realisasi && <p className="text-red-500 text-sm">{errors.jumlah_realisasi.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jumlah_tenaga_kerja">Jumlah Tenaga Kerja</Label>
              <Input
                id="jumlah_tenaga_kerja"
                type="number"
                {...register("jumlah_tenaga_kerja")}
              />
              {errors.jumlah_tenaga_kerja && <p className="text-red-500 text-sm">{errors.jumlah_tenaga_kerja.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClosing}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {(createMutation.isPending || updateMutation.isPending) ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditTransactionDialog;
