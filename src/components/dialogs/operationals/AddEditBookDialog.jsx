import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import Select from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { bookSchema } from "@/utils/validations/Book";
import { Edit, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AddEditBookDialog = ({ isOpen, onClose, editingBook, onFinish }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);

  const initialData = {
    name: '',
    description: '',
    author: '',
    isbn: '',
    year: '',
    stock: 0,
    jenis_buku_id: '',
    jenjang_studi_id: '',
    bidang_studi_id: '',
    kelas_id: '',
    publisher_id: '',
    price: 0,
  }

  // --- React Hook Form Setup ---
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: editingBook || initialData
  });

  useEffect(() => {
    if (editingBook) {
      const formattedData = {
        ...editingBook,
      };

      reset(formattedData);
      setIsEditMode(false); // Reset to view mode when editingBook changes
    } else {
      setIsEditMode(true); // Always in edit mode when creating new
    }
  }, [editingBook, reset]);

  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false); // Reset edit mode when dialog closes
    }
  }, [isOpen]);

  // Fetch dropdown data
  const { data: bookTypesData = { jenis_buku: [] } } = useQuery({
    queryKey: ['bookTypes'],
    queryFn: async () => {
      const response = await api.get('/jenis-buku?all=true');
      return response.data;
    }
  });

  const { data: educationLevelsData = { jenjang_studi: [] } } = useQuery({
    queryKey: ['educationLevels'],
    queryFn: async () => {
      const response = await api.get('/jenjang-studi?all=true');
      return response.data;
    }
  });

  const { data: studyFieldsData = { bidang_studi: [] } } = useQuery({
    queryKey: ['studyFields'],
    queryFn: async () => {
      const response = await api.get('/bidang-studi?all=true');
      return response.data;
    }
  });

  const { data: classesData = { kelas: [] } } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/kelas?all=true');
      return response.data;
    }
  });

  const { data: publishersData = { publishers: [] } } = useQuery({
    queryKey: ['publishers'],
    queryFn: async () => {
      const response = await api.get('/publishers?all=true');
      return response.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Creating book with data:', data);
      const response = await api.post('/books', data);
      return response.data;
    },
    onSuccess: async (responseData) => {
      toast({
        title: "Success",
        description: "Buku berhasil ditambahkan.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal menambahkan buku.",
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/books/${id}`, data);
      return response.data;
    },
    onSuccess: async (responseData, variables) => {
      toast({
        title: "Success",
        description: "Buku berhasil diperbarui.",
        variant: "success",
      });
      onFinishing();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Gagal memperbarui buku.",
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
    if (editingBook) {
      updateMutation.mutate({ id: editingBook.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Helper functions to get names by ID
  const getBookTypeName = (id) => {
    const item = bookTypesData.jenis_buku.find(t => t.id === id);
    return item ? item.name : '-';
  };

  const getEducationLevelName = (id) => {
    const item = educationLevelsData.jenjang_studi.find(t => t.id === id);
    return item ? item.name : '-';
  };

  const getStudyFieldName = (id) => {
    const item = studyFieldsData.bidang_studi.find(t => t.id === id);
    return item ? item.name : '-';
  };

  const getClassName = (id) => {
    const item = classesData.kelas.find(t => t.id === id);
    return item ? item.name : '-';
  };

  const getPublisherName = (id) => {
    const item = publishersData.publishers.find(t => t.id === id);
    return item ? item.name : '-';
  };

  const isViewMode = editingBook && !isEditMode;

  return (
    <Dialog open={isOpen} onOpenChange={onClosing}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingBook ? 'Edit Buku' : 'Tambah Buku Baru'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onHandleSubmit)}>
          <div className={`grid gap-4 py-4 ${isViewMode ? 'bg-slate-50 p-4 rounded-lg' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="name" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Nama Buku {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-blue-700 font-medium px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{editingBook.name || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="name"
                      placeholder="Contoh: Matematika Kelas 5"
                      {...register("name")}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="author" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Penulis</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{editingBook.author || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="author"
                      placeholder="Contoh: John Doe"
                      {...register("author")}
                    />
                    {errors.author && <p className="text-red-500 text-sm">{errors.author.message}</p>}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>ISBN</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{editingBook.isbn || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="isbn"
                      placeholder="Contoh: 978-3-16-148410-0"
                      {...register("isbn")}
                    />
                    {errors.isbn && <p className="text-red-500 text-sm">{errors.isbn.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="year" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Tahun</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{editingBook.year || '-'}</p>
                ) : (
                  <>
                    <Input
                      name="year"
                      placeholder="Contoh: 2024"
                      {...register("year")}
                    />
                    {errors.year && <p className="text-red-500 text-sm">{errors.year.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Stok</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{editingBook.stock || 0}</p>
                ) : (
                  <>
                    <Input
                      name="stock"
                      type="number"
                      placeholder="0"
                      {...register("stock", { valueAsNumber: true })}
                    />
                    {errors.stock && <p className="text-red-500 text-sm">{errors.stock.message}</p>}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Deskripsi</Label>
              {isViewMode ? (
                <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200 whitespace-pre-wrap">{editingBook.description || '-'}</p>
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

            <div className="grid grid-cols-2 gap-4">
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="jenis_buku_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Jenis Buku {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getBookTypeName(editingBook.jenis_buku_id)}</p>
                ) : (
                  <>
                    <Controller
                      name="jenis_buku_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={bookTypesData.jenis_buku.map((type) => ({
                            value: type.id,
                            label: `[${ type.code }] ${ type.name }`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih jenis buku"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.jenis_buku_id && <p className="text-red-500 text-sm">{errors.jenis_buku_id.message}</p>}
                  </>
                )}
              </div>
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="jenjang_studi_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Jenjang Studi {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getEducationLevelName(editingBook.jenjang_studi_id)}</p>
                ) : (
                  <>
                    <Controller
                      name="jenjang_studi_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={educationLevelsData.jenjang_studi.map((type) => ({
                            value: type.id,
                            label: `[${ type.code }] ${ type.name }`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih jenjang studi"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.jenjang_studi_id && <p className="text-red-500 text-sm">{errors.jenjang_studi_id.message}</p>}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="bidang_studi_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Bidang Studi {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getStudyFieldName(editingBook.bidang_studi_id)}</p>
                ) : (
                  <>
                    <Controller
                      name="bidang_studi_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={studyFieldsData.bidang_studi.map((type) => ({
                            value: type.id,
                            label: `[${ type.code }] ${ type.name }`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih bidang studi"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.bidang_studi_id && <p className="text-red-500 text-sm">{errors.bidang_studi_id.message}</p>}
                  </>
                )}
              </div>
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="kelas_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Kelas {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getClassName(editingBook.kelas_id)}</p>
                ) : (
                  <>
                    <Controller
                      name="kelas_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={classesData.kelas.map((type) => ({
                            value: type.id,
                            label: `[${ type.code }] ${ type.name }`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih kelas"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.kelas_id && <p className="text-red-500 text-sm">{errors.kelas_id.message}</p>}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="publisher_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Publisher {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getPublisherName(editingBook.publisher_id)}</p>
                ) : (
                  <>
                    <Controller
                      name="publisher_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={publishersData.publishers.map((type) => ({
                            value: type.id,
                            label: `[${ type.code }] ${ type.name }`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih publisher"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.publisher_id && <p className="text-red-500 text-sm">{errors.publisher_id.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Harga</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">Rp {editingBook.price?.toLocaleString('id-ID') || 0}</p>
                ) : (
                  <>
                    <CurrencyInput
                      name="price"
                      control={control}
                      placeholder="Contoh: Rp.10,000"
                    />
                    {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
                  </>
                )}
              </div>
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

export default AddEditBookDialog;
