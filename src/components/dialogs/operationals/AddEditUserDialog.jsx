import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { userSchema, userSchemaWithPasswordConfirmation } from "@/utils/validations/User";

const AddEditUserDialog = ({ isOpen, onClose, editingUser, onFinish }) => {
  const queryClient = useQueryClient();

  const initialData = {
    email: '',
    full_name: '',
    role: '',
  }

  // --- React Hook Form Setup ---
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(editingUser ? userSchema : userSchemaWithPasswordConfirmation),
    defaultValues: editingUser || initialData
  });

  useEffect(() => {
    if (editingUser) {
      const formattedData = {
        ...editingUser,
      };

      reset(formattedData);
    }
  }, [editingUser, reset]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      onFinishing();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/users/${id}`, data);
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
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Tambah User Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Email *</Label>
              <Input
                name="email"
                placeholder="Contoh: user@pustaka.co.id"
                {...register("email")}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                name="full_name"
                placeholder="Contoh: Budi Santoso"
                {...register("full_name")}
              />
              {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Password</Label>
              <Input
                name="password"
                type="password"
                placeholder="Masukkan password"
                {...register("password")}
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Konfirmasi Password</Label>
              <Input
                name="password_confirmation"
                type="password"
                placeholder="Masukkan konfirmasi password"
                {...register("password_confirmation")}
              />
              {errors.password_confirmation && <p className="text-red-500 text-sm">{errors.password_confirmation.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Role</Label>
              <Input
                name="role"
                placeholder="Contoh: user"
                {...register("role")}
              />
              {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
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

export default AddEditUserDialog;

