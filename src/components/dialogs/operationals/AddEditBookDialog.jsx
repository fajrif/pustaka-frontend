import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
import { Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ENUM_PERIODE } from '@/utils/constants';

const AddEditBookDialog = ({ isOpen, onClose, editingBook, onFinish }) => {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);

  const initialData = {
    name: '',
    description: '',
    author: '',
    isbn: '',
    year: '',
    stock: 0,
    merk_buku_id: '',
    jenis_buku_id: '',
    jenjang_studi_id: '',
    bidang_studi_id: '',
    kelas: '',
    curriculum_id: '',
    publisher_id: '',
    periode: 1,
    price: 0,
    no_pages: 0,
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
  const { data: bookBrandsData = { merk_buku: [] } } = useQuery({
    queryKey: ['bookBrand'],
    queryFn: async () => {
      const response = await api.get('/merk-buku?all=true');
      return response.data;
    }
  });

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

  const { data: curriculumsData = { curriculums: [] } } = useQuery({
    queryKey: ['curriculums'],
    queryFn: async () => {
      const response = await api.get('/curriculums?all=true');
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
      const formattedData = {
        ...data,
        year: data.year ? data.year.toString() : ''
      };
      const response = await api.post('/books', formattedData);
      return response.data;
    },
    onSuccess: async () => {
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
      const formattedData = {
        ...data,
        year: data.year ? data.year.toString() : ''
      };
      const response = await api.put(`/books/${id}`, formattedData);
      return response.data;
    },
    onSuccess: async () => {
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
  const getBookBrandName = (item) => {
    return item.merk_buku ? `[${item.merk_buku.code}] ${item.merk_buku.name}` : '-';
  };

  const getBookTypeName = (item) => {
    return item.jenis_buku ? `[${item.jenis_buku.code}] ${item.jenis_buku.name}` : '-';
  };

  const getEducationLevelName = (item) => {
    return item.jenjang_studi ? `[${item.jenjang_studi.code}] ${item.jenjang_studi.name}` : '-';
  };

  const getStudyFieldName = (item) => {
    return item.bidang_studi ? `[${item.bidang_studi.code}] ${item.bidang_studi.name}` : '-';
  };

  const getCurriculumName = (item) => {
    return item.curriculum ? `[${item.curriculum.code}] ${item.curriculum.name}` : '-';
  };

  const getPublisherName = (item) => {
    return item.publisher ? `[${item.publisher.code}] ${item.publisher.name}` : '-';
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

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periode" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Periode</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">
                    {editingBook.periode ?
                      editingBook.periode == "1" ? 'Semester Ganjil' : 'Semester Genap'
                      : '-'}
                  </p>
                ) : (
                  <>
                    <Controller
                      name="periode"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={ENUM_PERIODE.map((p) => ({
                            value: p.value,
                            label: p.name
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih periode"
                          error={!!error}
                          searchable={false}
                          clearable={false}
                        />
                      )}
                    />
                    {errors.periode && <p className="text-red-500 text-sm">{errors.periode.message}</p>}
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
                <Label htmlFor="publisher_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Penerbit {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getPublisherName(editingBook)}</p>
                ) : (
                  <>
                    <Controller
                      name="publisher_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={publishersData.publishers.map((type) => ({
                            value: type.id,
                            label: `[${type.code}] ${type.name}`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih penerbit"
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
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="merk_buku_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Merk Buku {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getBookBrandName(editingBook)}</p>
                ) : (
                  <>
                    <Controller
                      name="merk_buku_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={bookBrandsData.merk_buku.map((type) => ({
                            value: type.id,
                            label: `[${type.code}] ${type.name}`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih merk buku"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.merk_buku_id && <p className="text-red-500 text-sm">{errors.merk_buku_id.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="jenis_buku_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Jenis Buku {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getBookTypeName(editingBook)}</p>
                ) : (
                  <>
                    <Controller
                      name="jenis_buku_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={bookTypesData.jenis_buku.map((type) => ({
                            value: type.id,
                            label: `[${type.code}] ${type.name}`
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
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getEducationLevelName(editingBook)}</p>
                ) : (
                  <>
                    <Controller
                      name="jenjang_studi_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={educationLevelsData.jenjang_studi.map((type) => ({
                            value: type.id,
                            label: `[${type.code}] ${type.name}`
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
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getStudyFieldName(editingBook)}</p>
                ) : (
                  <>
                    <Controller
                      name="bidang_studi_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={studyFieldsData.bidang_studi.map((type) => ({
                            value: type.id,
                            label: `[${type.code}] ${type.name}`
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
              <div className="space-y-2">
                <Label htmlFor="kelas" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Kelas</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{editingBook.kelas || '-'}</p>
                ) : (
                  <>
                    <Controller
                      name="kelas"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={classesData.kelas.map((type) => ({
                            value: type.code,
                            label: `[${type.code}] ${type.name}`
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
                    {errors.kelas && <p className="text-red-500 text-sm">{errors.kelas.message}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className={`space-y-2 ${!isViewMode ? 'border-l-2 border-blue-400 pl-3' : ''}`}>
                <Label htmlFor="curriculum_id" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Kurikulum {!isViewMode && <span className="text-red-500">*</span>}</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{getCurriculumName(editingBook)}</p>
                ) : (
                  <>
                    <Controller
                      name="curriculum_id"
                      control={control}
                      render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <Select
                          options={curriculumsData.curriculums.map((type) => ({
                            value: type.id,
                            label: `[${type.code}] ${type.name}`
                          }))}
                          value={value}
                          onChange={onChange}
                          placeholder="Pilih kurikulum"
                          error={!!error}
                          searchable={true}
                          clearable={true}
                        />
                      )}
                    />
                    {errors.curriculum_id && <p className="text-red-500 text-sm">{errors.curriculum_id.message}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="no_pages" className={isViewMode ? 'text-slate-500' : 'text-slate-700'}>Halaman</Label>
                {isViewMode ? (
                  <p className="text-sm text-slate-700 px-3 py-2 bg-white rounded-md shadow-sm border border-slate-200">{editingBook.no_pages || 0}</p>
                ) : (
                  <>
                    <Input
                      name="no_pages"
                      type="number"
                      placeholder="0"
                      {...register("no_pages", { valueAsNumber: true })}
                    />
                    {errors.no_pages && <p className="text-red-500 text-sm">{errors.no_pages.message}</p>}
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
