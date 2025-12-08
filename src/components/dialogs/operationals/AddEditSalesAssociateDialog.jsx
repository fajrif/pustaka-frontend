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
import { Edit, FileText, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { getAssetUrl, validateImageFile, validatePdfFile, getFilenameFromUrl } from '@/helpers/AssetHelper';

const AddEditSalesAssociateDialog = ({ isOpen, onClose, editingSalesAssociate, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);

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

  // Handle file upload
  const uploadFile = async (salesAssociateId, file, field) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/upload/sales-associates/${field}/${salesAssociateId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      toast({
        title: "Warning",
        description: `Data berhasil disimpan, tetapi gagal mengupload ${field}.`,
        variant: "destructive",
      });
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        setPhotoFile(file);
      } else {
        toast({
          title: "Error",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = '';
        setPhotoFile(null);
      }
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validatePdfFile(file);
      if (validation.valid) {
        setPdfFile(file);
      } else {
        toast({
          title: "Error",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = '';
        setPdfFile(null);
      }
    }
  };

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
    onSuccess: async (responseData) => {
      // Upload files if provided
      if (responseData.sales_associate?.id) {
        if (photoFile) {
          await uploadFile(responseData.sales_associate.id, photoFile, 'photo');
        }
        if (pdfFile) {
          await uploadFile(responseData.sales_associate.id, pdfFile, 'file');
        }
      }

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
    onSuccess: async (responseData, variables) => {
      // Upload files if provided
      if (photoFile) {
        await uploadFile(variables.id, photoFile, 'photo');
      }
      if (pdfFile) {
        await uploadFile(variables.id, pdfFile, 'file');
      }

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

  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/upload/sales-associates/photo/${editingSalesAssociate.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Photo berhasil dihapus.",
        variant: "success",
      });
      queryClient.invalidateQueries(['salesAssociates']);
      onFinish();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus photo.",
        variant: "destructive",
      });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/upload/sales-associates/file/${editingSalesAssociate.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dokumen berhasil dihapus.",
        variant: "success",
      });
      queryClient.invalidateQueries(['salesAssociates']);
      onFinish();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus dokumen.",
        variant: "destructive",
      });
    }
  });

  const handleDeletePhoto = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus photo?')) {
      deletePhotoMutation.mutate();
    }
  };

  const handleDeleteFile = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen?')) {
      deleteFileMutation.mutate();
    }
  };

  const onFinishing = () => {
    reset(initialData);
    setPhotoFile(null);
    setPdfFile(null);
    onFinish();
  };

  const onClosing = () => {
    reset(initialData);
    setPhotoFile(null);
    setPdfFile(null);
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
            {isViewMode && (editingSalesAssociate.photo_url || editingSalesAssociate.file_url) && (
              <div className="grid grid-cols-2 gap-4">
                {editingSalesAssociate.photo_url && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Photo</Label>
                      <button
                        type="button"
                        onClick={handleDeletePhoto}
                        disabled={deletePhotoMutation.isPending}
                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Hapus photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <img
                        src={getAssetUrl(editingSalesAssociate.photo_url)}
                        alt="Sales Photo"
                        className="w-20 h-20 object-cover border rounded"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0zMiAzMkMzNS4zMTM3IDMyIDM4IDI5LjMxMzcgMzggMjZDMzggMjIuNjg2MyAzNS4zMTM3IDIwIDMyIDIwQzI4LjY4NjMgMjAgMjYgMjIuNjg2MyAyNiAyNkMyNiAyOS4zMTM3IDI4LjY4NjMgMzIgMzIgMzJaIiBmaWxsPSIjOUM5Qzk3Ii8+CjxwYXRoIGQ9Ik0yMCA0NFYzOEMyMCAzNS43OTA5IDIxLjc5MDkgMzQgMjQgMzRINDBDNDIuMjA5MSAzNCA0NCAzNS43OTA5IDQ0IDM4VjQ0IiBmaWxsPSIjOUM5Qzk3Ii8+Cjwvc3ZnPgo=';
                        }}
                      />
                    </div>
                  </div>
                )}
                {editingSalesAssociate.file_url && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Dokumen</Label>
                      <button
                        type="button"
                        onClick={handleDeleteFile}
                        disabled={deleteFileMutation.isPending}
                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Hapus dokumen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <a
                      href={getAssetUrl(editingSalesAssociate.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border rounded hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <FileText className="w-8 h-8 text-red-600" />
                      <span className="text-sm text-blue-600 hover:underline">
                        {getFilenameFromUrl(editingSalesAssociate.file_url)}
                      </span>
                    </a>
                  </div>
                )}
              </div>
            )}
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

            {!isViewMode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photo">Photo (JPEG/PNG, max 5MB)</Label>
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handlePhotoChange}
                  />
                  {photoFile && (
                    <p className="text-sm text-green-600">File dipilih: {photoFile.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Dokumen PDF (PDF, max 10MB)</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                  />
                  {pdfFile && (
                    <p className="text-sm text-green-600">File dipilih: {pdfFile.name}</p>
                  )}
                </div>
              </div>
            )}
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
