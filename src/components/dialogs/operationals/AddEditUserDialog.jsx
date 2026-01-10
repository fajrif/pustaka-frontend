import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { userSchema, userSchemaWithPasswordConfirmation } from "@/utils/validations/User";
import { useToast } from '@/components/ui/use-toast';
import { USER_ROLES } from '@/utils/constants';

const AddEditUserDialog = ({ isOpen, onClose, editingUser, onFinish }) => {
  const { toast } = useToast();

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
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "User berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan user.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "User berhasil diperbarui.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui user.",
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
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={control}
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <Select
                    options={USER_ROLES.map((role) => ({
                      value: role,
                      label: role
                    }))}
                    value={value}
                    onChange={onChange}
                    placeholder="Pilih role"
                    error={!!error}
                    searchable={false}
                    clearable={false}
                  />
                )}
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

