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
import { publisherSchema } from "@/utils/validations/Publisher";
import { Edit, FileText, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getAssetUrl, validateImageFile, validatePdfFile, getFilenameFromUrl } from '@/helpers/AssetHelper';

const AddEditPublisherDialog = ({ isOpen, onClose, editingPublisher, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
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
      setIsEditMode(false); // Reset to view mode when editingPublisher changes
    } else {
      setIsEditMode(true); // Always in edit mode when creating new
    }
  }, [editingPublisher, reset]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false); // Reset edit mode when dialog closes
    }
  }, [isOpen]);

  // Handle file upload
  const uploadFile = async (publisherId, file, field) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/upload/publishers/${field}/${publisherId}`, formData, {
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        setLogoFile(file);
      } else {
        toast({
          title: "Error",
          description: validation.error,
          variant: "destructive",
        });
        e.target.value = '';
        setLogoFile(null);
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
      console.log('Creating publisher with data:', data);
      const response = await api.post('/publishers', data);
      return response.data;
    },
    onSuccess: async (responseData) => {
      // Upload files if provided
      if (responseData.publisher?.id) {
        if (logoFile) {
          await uploadFile(responseData.publisher.id, logoFile, 'logo');
        }
        if (pdfFile) {
          await uploadFile(responseData.publisher.id, pdfFile, 'file');
        }
      }

      toast({
        title: "Success",
        description: "Publisher berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan publisher.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/publishers/${id}`, data);
      return response.data;
    },
    onSuccess: async (responseData, variables) => {
      // Upload files if provided
      if (logoFile) {
        await uploadFile(variables.id, logoFile, 'logo');
      }
      if (pdfFile) {
        await uploadFile(variables.id, pdfFile, 'file');
      }

      toast({
        title: "Success",
        description: "Publisher berhasil diperbarui.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui publisher.",
        variant: "destructive",
      });
    }
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/upload/publishers/logo/${editingPublisher.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logo berhasil dihapus.",
        variant: "success",
      });
      queryClient.invalidateQueries(['publishers']);
      onFinish();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menghapus logo.",
        variant: "destructive",
      });
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/upload/publishers/file/${editingPublisher.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dokumen berhasil dihapus.",
        variant: "success",
      });
      queryClient.invalidateQueries(['publishers']);
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

  const handleDeleteLogo = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus logo?')) {
      deleteLogoMutation.mutate();
    }
  };

  const handleDeleteFile = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen?')) {
      deleteFileMutation.mutate();
    }
  };

  const onFinishing = () => {
    reset(initialData);
    setLogoFile(null);
    setPdfFile(null);
    onFinish();
  };

  const onClosing = () => {
    reset(initialData);
    setLogoFile(null);
    setPdfFile(null);
    setIsEditMode(false);
    onClose();
  };

  const onHandleSubmit = async (data) => {
    if (editingPublisher) {
      updateMutation.mutate({ id: editingPublisher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Helper function to get city name by ID
  const getCityName = (cityId) => {
    const city = citiesData.cities.find(c => c.id === cityId);
    return city ? city.name : '-';
  };

  const isViewMode = editingPublisher && !isEditMode;

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {editingPublisher ? 'Edit Publisher' : 'Tambah Publisher Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className="grid gap-2 py-4">
            {isViewMode && (editingPublisher.logo_url || editingPublisher.file_url) && (
              <div className="grid grid-cols-2 gap-4 mb-2">
                {editingPublisher.logo_url && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Logo</Label>
                      <button
                        type="button"
                        onClick={handleDeleteLogo}
                        disabled={deleteLogoMutation.isPending}
                        className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Hapus logo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 py-2">
                      <img
                        src={getAssetUrl(editingPublisher.logo_url)}
                        alt="Publisher Logo"
                        className="w-20 h-20 object-cover border rounded"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRTVFN0VCIi8+CjxwYXRoIGQ9Ik0zMiAzMkMzNS4zMTM3IDMyIDM4IDI5LjMxMzcgMzggMjZDMzggMjIuNjg2MyAzNS4zMTM3IDIwIDMyIDIwQzI4LjY4NjMgMjAgMjYgMjIuNjg2MyAyNiAyNkMyNiAyOS4zMTM3IDI4LjY4NjMgMzIgMzIgMzJaIiBmaWxsPSIjOUM5Qzk3Ii8+CjxwYXRoIGQ9Ik0yMCA0NFYzOEMyMCAzNS43OTA5IDIxLjc5MDkgMzQgMjQgMzRINDBDNDIuMjA5MSAzNCA0NCAzNS43OTA5IDQ0IDM4VjQ0IiBmaWxsPSIjOUM5Qzk3Ci8+Cjwvc3ZnPgo=';
                        }}
                      />
                    </div>
                  </div>
                )}
                {editingPublisher.file_url && (
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
                      href={getAssetUrl(editingPublisher.file_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 border rounded hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <FileText className="w-8 h-8 text-red-600" />
                      <span className="text-sm text-blue-600 hover:underline">
                        {getFilenameFromUrl(editingPublisher.file_url)}
                      </span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kode Publisher *</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingPublisher.code || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="code"
                      placeholder="Contoh: PUB001"
                      {...register("code")}
                    />
                    {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama Publisher *</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingPublisher.name || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="name"
                      placeholder="Contoh: Pustaka Publisher"
                      {...register("name")}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {isViewMode ? (
                <p className="text-sm text-slate-900 p-2 border whitespace-pre-wrap">{editingPublisher.address || '-'}</p>
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
                  <p className="text-sm text-slate-900 p-2 border">{getCityName(editingPublisher.city_id)}</p>
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
                <Label htmlFor="description">Area</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingPublisher.area || '-'}</p>
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
                <Label htmlFor="code">Email</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingPublisher.email || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="email"
                      type="email"
                      placeholder="Contoh: contact@publisher.com"
                      {...register("email")}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Website</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingPublisher.website || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="website"
                      placeholder="Contoh: https://www.publisher.com"
                      {...register("website")}
                    />
                    {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Phone 1</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingPublisher.phone1 || '-'}</p>
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
                <Label htmlFor="description">Phone 2</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-900 p-2 border">{editingPublisher.phone2 || '-'}</p>
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
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              {isViewMode ? (
                <p className="text-sm text-slate-900 p-2 border whitespace-pre-wrap">{editingPublisher.description || '-'}</p>
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
                  <Label htmlFor="logo">Logo (JPEG/PNG, max 5MB)</Label>
                  <Input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={handleLogoChange}
                  />
                  {logoFile && (
                    <p className="text-sm text-green-600">File dipilih: {logoFile.name}</p>
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

export default AddEditPublisherDialog;

