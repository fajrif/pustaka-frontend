import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Select from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { salesAssociateSchema } from "@/utils/validations/SalesAssociate";
import { Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const AddEditSalesAssociateDialog = ({ isOpen, onClose, editingSalesAssociate, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);

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
    jenis_pembayaran: '',
    join_date: '',
    end_join_date: '',
    discount: 0,
  }

  // --- React Hook Form Setup ---
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(salesAssociateSchema),
    defaultValues: editingSalesAssociate || initialData
  });

  useEffect(() => {
    if (editingSalesAssociate) {
      const formattedData = {
        ...editingSalesAssociate,
        join_date: editingSalesAssociate.join_date ? format(parseISO(editingSalesAssociate.join_date), 'yyyy-MM-dd') : '',
        end_join_date: editingSalesAssociate.end_join_date ? format(parseISO(editingSalesAssociate.end_join_date), 'yyyy-MM-dd') : '',
      };

      reset(formattedData);
      setIsEditMode(false); // Reset to view mode when editingSalesAssociate changes
    } else {
      setIsEditMode(true); // Always in edit mode when creating new
    }
  }, [editingSalesAssociate, reset]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false); // Reset edit mode when dialog closes
    }
  }, [isOpen]);

  const { data: citiesData = { cities: [] } } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await api.get('/cities?all=true');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating sales associate with data:', data);
      const response = await api.post('/sales-associates', data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales associate berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan sales associate.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/sales-associates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales associate berhasil diperbarui.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui sales associate.",
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
    setIsEditMode(false);
    onClose();
  };

  const onHandleSubmit = async (data) => {
    if (editingSalesAssociate) {
      updateMutation.mutate({ id: editingSalesAssociate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Helper function to get city name by ID
  const getCityName = (cityId) => {
    const city = citiesData.cities.find(c => c.id === cityId);
    return city ? city.name : '-';
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const isViewMode = editingSalesAssociate && !isEditMode;

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSalesAssociate ? 'Edit Sales Associate' : 'Tambah Sales Associate Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Kode Sales Associate *</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.code || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="code"
                      placeholder="Contoh: SA001"
                      {...register("code")}
                    />
                    {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Sales Associate *</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.name || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="name"
                      placeholder="Contoh: John Doe"
                      {...register("name")}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              {isViewMode ? (
                <p className="text-sm text-slate-900 p-2 border whitespace-pre-wrap">{editingSalesAssociate.address || '-'}</p>
              ) : (
                <>
                  <Textarea
                    id="address"
                    rows={3}
                    {...register("address")}
                  />
                  {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city_id">Kota *</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{getCityName(editingSalesAssociate.city_id)}</p>
                ) : (
                  <>
                    <Controller
                      name="city_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={citiesData.cities.map((type) => ({
                            value: type.id,
                            label: type.name
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih kota"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.city_id && <p className="text-red-500 text-sm">{errors.city_id.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.area || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="area"
                      placeholder="Contoh: Tangerang Selatan"
                      {...register("area")}
                    />
                    {errors.area && <p className="text-red-500 text-sm">{errors.area.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.email || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Contoh: contact@sales.com"
                      {...register("email")}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.website || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="website"
                      placeholder="Contoh: https://www.sales.com"
                      {...register("website")}
                    />
                    {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone1">Phone 1</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.phone1 || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="phone1"
                      type="phone"
                      placeholder="Contoh: +62 812 3456 7890"
                      {...register("phone1")}
                    />
                    {errors.phone1 && <p className="text-red-500 text-sm">{errors.phone1.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone2">Phone 2</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.phone2 || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="phone2"
                      type="phone"
                      placeholder="Nomor lain (opsional)"
                      {...register("phone2")}
                    />
                    {errors.phone2 && <p className="text-red-500 text-sm">{errors.phone2.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jenis_pembayaran">Jenis Pembayaran</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.jenis_pembayaran || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="jenis_pembayaran"
                      placeholder="Contoh: Transfer, Cash"
                      {...register("jenis_pembayaran")}
                    />
                    {errors.jenis_pembayaran && <p className="text-red-500 text-sm">{errors.jenis_pembayaran.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Diskon (%)</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingSalesAssociate.discount || 0}%</p>
                ) : (
                  <>
                    <Input
                      name="discount"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...register("discount", { valueAsNumber: true })}
                    />
                    {errors.discount && <p className="text-red-500 text-sm">{errors.discount.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="join_date">Tanggal Bergabung</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{formatDisplayDate(editingSalesAssociate.join_date)}</p>
                ) : (
                  <>
                    <Input
                      name="join_date"
                      type="date"
                      {...register("join_date")}
                    />
                    {errors.join_date && <p className="text-red-500 text-sm">{errors.join_date.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_join_date">Tanggal Berakhir</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{formatDisplayDate(editingSalesAssociate.end_join_date)}</p>
                ) : (
                  <>
                    <Input
                      name="end_join_date"
                      type="date"
                      {...register("end_join_date")}
                    />
                    {errors.end_join_date && <p className="text-red-500 text-sm">{errors.end_join_date.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              {isViewMode ? (
                <p className="text-sm text-slate-900 p-2 border whitespace-pre-wrap">{editingSalesAssociate.description || '-'}</p>
              ) : (
                <>
                  <Textarea
                    id="description"
                    rows={2}
                    {...register("description")}
                  />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            {isViewMode ? (
              <>
                <Button type="button" variant="outline" onClick={onClosing}>
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditMode(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              </>
            ) : (
              <>
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
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditSalesAssociateDialog;
