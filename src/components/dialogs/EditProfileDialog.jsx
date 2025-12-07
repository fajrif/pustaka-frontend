import React, { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/api/endpoints';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { updateProfileSchema } from "@/utils/validations/User";
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

const EditProfileDialog = ({ isOpen, onClose, user, onFinish }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  const initialData = {
    full_name: user?.full_name || '',
    password: '',
    password_confirmation: '',
  };

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: initialData
  });

  const password = watch('password');

  useEffect(() => {
    if (user) {
      reset(initialData);
    }
  }, [user, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Only send non-empty fields
      const payload = {};
      if (data.full_name && data.full_name !== user?.full_name) {
        payload.full_name = data.full_name;
      }
      if (data.password && data.password.length > 0) {
        payload.password = data.password;
        payload.password_confirmation = data.password_confirmation;
      }

      const response = await authAPI.updateMe(payload);
      return { data: response.data, passwordChanged: !!data.password };
    },
    onSuccess: ({ passwordChanged }) => {
      toast({
        title: "Success",
        description: passwordChanged ? "Profile berhasil diperbarui. Silakan login kembali." : "Profile berhasil diperbarui.",
        variant: "success",
      });
      reset(initialData);
      onFinish(passwordChanged);

      // If password was changed, logout and redirect to login
      if (passwordChanged) {
        setTimeout(() => {
          logout();
          navigate('/login');
        }, 100);
      }
    },
    onError: (error) => {
      console.error('Failed to update profile:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui profile.",
        variant: "destructive",
      });
    }
  });

  const onClosing = () => {
    reset(initialData);
    onClose();
  };

  const onHandleSubmit = async (data) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                name="full_name"
                placeholder="Masukkan nama lengkap"
                {...register("full_name")}
              />
              {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
            </div>

            <div className="border-t border-slate-200 pt-4 mt-2">
              <p className="text-sm text-slate-600 mb-4">Kosongkan jika tidak ingin mengubah password</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password Baru</Label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Masukkan password baru"
                    {...register("password")}
                  />
                  {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                </div>

                {password && password.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                    <Input
                      name="password_confirmation"
                      type="password"
                      placeholder="Masukkan konfirmasi password"
                      {...register("password_confirmation")}
                    />
                    {errors.password_confirmation && <p className="text-red-500 text-sm">{errors.password_confirmation.message}</p>}
                  </div>
                )}
              </div>
            </div>

            {password && password.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Setelah mengubah password, Anda akan otomatis keluar dan perlu login kembali.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClosing}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
