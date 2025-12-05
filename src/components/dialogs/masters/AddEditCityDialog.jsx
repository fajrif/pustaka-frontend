import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { citySchema } from "@/utils/validations/City";

const AddEditCityDialog = ({ isOpen, onClose, editingCity, onFinish }) => {
  const queryClient = useQueryClient();

  const initialData = {
    code: '',
    name: '',
  }

  // --- React Hook Form Setup ---
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(citySchema),
    defaultValues: editingCity || initialData
  });

  useEffect(() => {
    if (editingCity) {
      const formattedData = {
        ...editingCity,
      };

      reset(formattedData);
    }
  }, [editingCity, reset]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/cities', data);
      return response.data;
    },
    onSuccess: () => {
      onFinishing();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/cities/${id}`, data);
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
    if (editingCity) {
      updateMutation.mutate({ id: editingCity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingCity ? 'Edit Kota' : 'Tambah Kota Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode *</Label>
              <Input
                name="code"
                placeholder="Contoh: JKT"
                {...register("code")}
              />
              {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                name="name"
                placeholder="Contoh: Jakarta"
                {...register("name")}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
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

export default AddEditCityDialog;
