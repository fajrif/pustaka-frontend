import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { kurikulumSchema } from "@/utils/validations/Kurikulum";
import { useToast } from '@/components/ui/use-toast';

const AddEditKurikulumDialog = ({ isOpen, onClose, editingKurikulum, onFinish }) => {
  const { toast } = useToast();

  const initialData = {
    code: '',
    name: '',
    description: '',
  }

  // --- React Hook Form Setup ---
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(kurikulumSchema),
    defaultValues: editingKurikulum || initialData
  });

  useEffect(() => {
    if (editingKurikulum) {
      const formattedData = {
        ...editingKurikulum,
      };

      reset(formattedData);
    }
  }, [editingKurikulum, reset]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/curriculums', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Kurikulum berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan kurikulum.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/curriculums/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Kurikulum berhasil diperbarui.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui kurikulum.",
        variant: "destructive",
      });
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
    if (editingKurikulum) {
      updateMutation.mutate({ id: editingKurikulum.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingKurikulum ? 'Edit Kurikulum' : 'Tambah Kurikulum Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode *</Label>
              <Input
                name="code"
                placeholder="Contoh: K13"
                {...register("code")}
              />
              {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                name="name"
                placeholder="Contoh: Kurikulum 2013"
                {...register("name")}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
              id="description"
              rows={3}
              {...register("description")}
            />
                {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
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

export default AddEditKurikulumDialog;
