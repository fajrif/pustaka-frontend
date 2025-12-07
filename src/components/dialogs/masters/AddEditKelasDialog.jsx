import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { kelasSchema } from "@/utils/validations/Kelas";
import { useToast } from '@/components/ui/use-toast';

const AddEditKelasDialog = ({ isOpen, onClose, editingKelas, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const initialData = {
    code: '',
    name: '',
    description: '',
  }

  // --- React Hook Form Setup ---
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(kelasSchema),
    defaultValues: editingKelas || initialData
  });

  useEffect(() => {
    if (editingKelas) {
      const formattedData = {
        ...editingKelas,
      };

      reset(formattedData);
    }
  }, [editingKelas, reset]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/kelas', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Kelas berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan kelas.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/kelas/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Kelas berhasil diperbarui.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui kelas.",
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
    if (editingKelas) {
      updateMutation.mutate({ id: editingKelas.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingKelas ? 'Edit Kelas' : 'Tambah Kelas Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode *</Label>
              <Input
                name="code"
                placeholder="Contoh: K1"
                {...register("code")}
              />
              {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                name="name"
                placeholder="Contoh: Kelas 1"
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

export default AddEditKelasDialog;
