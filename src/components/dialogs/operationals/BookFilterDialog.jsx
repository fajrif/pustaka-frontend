import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Filter, X, RotateCcw } from 'lucide-react';
import { ENUM_PERIODE } from '@/utils/constants';

const initialFilters = {
  bidang_studi_id: '',
  jenis_buku_id: '',
  jenjang_studi_id: '',
  curriculum_id: '',
  periode: '',
  year: '',
  price_min: '',
  price_max: '',
};

const BookFilterDialog = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
  const [filters, setFilters] = useState(initialFilters);

  // Currency formatting helpers
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    const numericValue = String(value).replace(/[^\d]/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  const parseCurrency = (value) => {
    return value.replace(/[Rp.\s]/g, '').replace(/,/g, '');
  };

  const handleCurrencyChange = (key, value) => {
    const rawValue = parseCurrency(value);
    setFilters(prev => ({
      ...prev,
      [key]: rawValue === '' ? '' : rawValue,
    }));
  };

  // Initialize filters when dialog opens
  useEffect(() => {
    if (isOpen && currentFilters) {
      setFilters({
        ...initialFilters,
        ...currentFilters,
      });
    }
  }, [isOpen, currentFilters]);

  // Fetch dropdown data
  const { data: studyFieldsData = { bidang_studi: [] } } = useQuery({
    queryKey: ['studyFields', 'all'],
    queryFn: async () => {
      const response = await api.get('/bidang-studi?all=true');
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApply = () => {
    // Clean up empty values
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
            Filter Buku
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Row 1: Bidang Studi & Jenis Buku */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bidang Studi</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Bidang Studi' },
                  ...studyFieldsData.bidang_studi.map((item) => ({
                    value: item.id,
                    label: `[${item.code}] ${item.name}`
                  }))
                ]}
                value={filters.bidang_studi_id}
                onChange={(value) => handleFilterChange('bidang_studi_id', value)}
                placeholder="Pilih bidang studi"
                searchable={true}
              />
            </div>
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
          </div>

          {/* Row 2: Jenjang Studi & Kurikulum */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Row 3: Semester & Tahun */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Semester' },
                  ...ENUM_PERIODE.map((p) => ({
                    value: p.value,
                    label: p.name
                  }))
                ]}
                value={filters.periode}
                onChange={(value) => handleFilterChange('periode', value)}
                placeholder="Pilih semester"
                searchable={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Input
                type="text"
                placeholder="Contoh: 2024"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Price Range */}
          <div className="space-y-2">
            <Label>Rentang Harga</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Harga minimum"
                value={formatCurrency(filters.price_min)}
                onChange={(e) => handleCurrencyChange('price_min', e.target.value)}
              />
              <Input
                type="text"
                placeholder="Harga maksimum"
                value={formatCurrency(filters.price_max)}
                onChange={(e) => handleCurrencyChange('price_max', e.target.value)}
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

export default BookFilterDialog;
