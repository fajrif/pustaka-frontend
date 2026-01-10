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
import { merkBukuSchema } from "@/utils/validations/MerkBuku";
import { useToast } from '@/components/ui/use-toast';

const AddEditMerkBukuDialog = ({ isOpen, onClose, editingMerkBuku, onFinish }) => {
  const { toast } = useToast();

  const initialData = {
    code: '',
    name: '',
    description: '',
  }

  // --- React Hook Form Setup ---
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(merkBukuSchema),
    defaultValues: editingMerkBuku || initialData
  });

  useEffect(() => {
    if (editingMerkBuku) {
      const formattedData = {
        ...editingMerkBuku,
      };

      reset(formattedData);
    }
  }, [editingMerkBuku, reset]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/merk-buku', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Merk buku berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan merk buku.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/merk-buku/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Merk buku berhasil diperbarui.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui merk buku.",
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
    if (editingMerkBuku) {
      updateMutation.mutate({ id: editingMerkBuku.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingMerkBuku ? 'Edit Merk Buku' : 'Tambah Merk Buku Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Kode *</Label>
              <Input
                name="code"
                placeholder="Contoh: ERL"
                {...register("code")}
              />
              {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                name="name"
                placeholder="Contoh: Erlangga"
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

export default AddEditMerkBukuDialog;
