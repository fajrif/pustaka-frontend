import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Filter, RotateCcw } from 'lucide-react';

const initialFilters = {
  jenis_buku_id: '',
  jenjang_studi_id: '',
  curriculum_id: '',
  kelas: '',
  low_stock_threshold: '',
  sort_by: '',
  sort_order: '',
};

const BooksStockFilterDialog = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    if (isOpen && currentFilters) {
      setFilters({
        ...initialFilters,
        ...currentFilters,
      });
    }
  }, [isOpen, currentFilters]);

  // Fetch dropdown data
  const { data: bookTypesData = { jenis_buku: [] } } = useQuery({
    queryKey: ['bookTypes', 'all'],
    queryFn: async () => {
      const response = await api.get('/jenis-buku?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: educationLevelsData = { jenjang_studi: [] } } = useQuery({
    queryKey: ['educationLevels', 'all'],
    queryFn: async () => {
      const response = await api.get('/jenjang-studi?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: curriculumsData = { curriculums: [] } } = useQuery({
    queryKey: ['curriculums', 'all'],
    queryFn: async () => {
      const response = await api.get('/curriculums?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: classesData = { kelas: [] } } = useQuery({
    queryKey: ['classes', 'all'],
    queryFn: async () => {
      const response = await api.get('/kelas?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    const cleanFilters = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        cleanFilters[key] = value;
      }
    });
    onApplyFilters(cleanFilters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Laporan Stok Buku
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jenis Buku</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Jenis Buku' },
                  ...bookTypesData.jenis_buku.map((item) => ({
                    value: item.id,
                    label: `[${item.code}] ${item.name}`
                  }))
                ]}
                value={filters.jenis_buku_id}
                onChange={(value) => handleFilterChange('jenis_buku_id', value)}
                placeholder="Pilih jenis buku"
                searchable={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenjang Studi</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Jenjang Studi' },
                  ...educationLevelsData.jenjang_studi.map((item) => ({
                    value: item.id,
                    label: `[${item.code}] ${item.name}`
                  }))
                ]}
                value={filters.jenjang_studi_id}
                onChange={(value) => handleFilterChange('jenjang_studi_id', value)}
                placeholder="Pilih jenjang studi"
                searchable={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kurikulum</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Kurikulum' },
                  ...curriculumsData.curriculums.map((item) => ({
                    value: item.id,
                    label: `[${item.code}] ${item.name}`
                  }))
                ]}
                value={filters.curriculum_id}
                onChange={(value) => handleFilterChange('curriculum_id', value)}
                placeholder="Pilih kurikulum"
                searchable={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Kelas' },
                  ...classesData.kelas.map((item) => ({
                    value: item.code,
                    label: `[${item.code}] ${item.name}`
                  }))
                ]}
                value={filters.kelas}
                onChange={(value) => handleFilterChange('kelas', value)}
                placeholder="Pilih kelas"
                searchable={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Batas Stok Rendah</Label>
              <Input
                type="number"
                placeholder="Default: 10"
                value={filters.low_stock_threshold}
                onChange={(e) => handleFilterChange('low_stock_threshold', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Urutkan Berdasarkan</Label>
              <Select
                options={[
                  { value: '', label: 'Default' },
                  { value: 'name', label: 'Nama Buku' },
                  { value: 'stock', label: 'Stok' },
                  { value: 'price', label: 'Harga' },
                ]}
                value={filters.sort_by}
                onChange={(value) => handleFilterChange('sort_by', value)}
                placeholder="Pilih urutan"
              />
            </div>
            <div className="space-y-2">
              <Label>Arah Urutan</Label>
              <Select
                options={[
                  { value: '', label: 'Default' },
                  { value: 'asc', label: 'Ascending (A-Z)' },
                  { value: 'desc', label: 'Descending (Z-A)' },
                ]}
                value={filters.sort_order}
                onChange={(value) => handleFilterChange('sort_order', value)}
                placeholder="Pilih arah"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Filter className="w-4 h-4" />
              Terapkan Filter
              {getActiveFilterCount() > 0 && (
                <span className="bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
                  {getActiveFilterCount()}
                </span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BooksStockFilterDialog;
