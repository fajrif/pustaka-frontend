import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { publisherSchema } from "@/utils/validations/Publisher";

const AddEditPublisherDialog = ({ isOpen, onClose, editingPublisher, onFinish }) => {
  const queryClient = useQueryClient();

  const initialData = {
    code: '',
    name: '',
    description: '',
    email: '',
    address: '',
    city_id: '',
    area: '',
    phone1: '',
    phone2: '',
    website: '',
  }

  // --- React Hook Form Setup ---
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(publisherSchema),
    defaultValues: editingPublisher || initialData
  });

  useEffect(() => {
    if (editingPublisher) {
      const formattedData = {
        ...editingPublisher,
      };

      reset(formattedData);
    }
  }, [editingPublisher, reset]);

  const { data: citiesData = { cities: [] } } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await api.get('/cities');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating publisher with data:', data);
      const response = await api.post('/publishers', data);
      return response.data;
    },
    onSuccess: () => {
      onFinishing();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/publishers/${id}`, data);
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
    if (editingPublisher) {
      updateMutation.mutate({ id: editingPublisher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {editingPublisher ? 'Edit Publisher' : 'Tambah Publisher Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kode Publisher *</Label>
                <Input
                  name="code"
                  placeholder="Contoh: PUB001"
                  {...register("code")}
                  />
                {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Publisher *</Label>
                <Input
                  name="name"
                  placeholder="Contoh: Pustaka Publisher"
                  {...register("name")}
                  />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                rows={3}
                {...register("address")}
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city_id">Kota *</Label>
                {/* Use the Controller for your custom Select component */}
                <Controller
                  name="city_id"
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    // The render prop passes the necessary onChange and value handlers
                    <Select
                      value={value}
                      onValueChange={onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kota" />
                      </SelectTrigger>
                      <SelectContent>
                        {citiesData.cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            <span className="font-medium">{city.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    )}
                  />
                  {errors.city_id && <p className="text-red-500 text-sm">{errors.city_id.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Area</Label>
                <Input
                  name="area"
                  placeholder="Contoh: Tangerang Selatan"
                  {...register("area")}
                />
                {errors.area && <p className="text-red-500 text-sm">{errors.area.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Email</Label>
                <Input
                  name="email"
                  type="email"
                  placeholder="Contoh: contact@publisher.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Website</Label>
                <Input
                  name="website"
                  placeholder="Contoh: https://www.publisher.com"
                  {...register("website")}
                />
                {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Phone 1</Label>
                <Input
                  name="phone1"
                  type="phone"
                  placeholder="Contoh: +62 812 3456 7890"
                  {...register("phone1")}
                />
                {errors.phone1 && <p className="text-red-500 text-sm">{errors.phone1.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Phone 2</Label>
                <Input
                  name="phone2"
                  type="phone"
                  placeholder="Nomor lain (opsional)"
                  {...register("phone2")}
                />
                {errors.phone2 && <p className="text-red-500 text-sm">{errors.phone2.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                rows={2}
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

export default AddEditPublisherDialog;

