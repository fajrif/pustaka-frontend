import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Select from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Filter, RotateCcw } from 'lucide-react';
import DateRangePicker from '@/components/reports/DateRangePicker';

const initialFilters = {
  start_date: '',
  end_date: '',
  supplier_id: '',
  status: '',
};

const PurchasesFilterDialog = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    if (isOpen && currentFilters) {
      setFilters({
        ...initialFilters,
        ...currentFilters,
      });
    }
  }, [isOpen, currentFilters]);

  const { data: publishersData = { publishers: [] } } = useQuery({
    queryKey: ['publishers', 'all'],
    queryFn: async () => {
      const response = await api.get('/publishers?all=true');
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
            Filter Laporan Pembelian
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <DateRangePicker
            startDate={filters.start_date}
            endDate={filters.end_date}
            onStartDateChange={(date) => handleFilterChange('start_date', date)}
            onEndDateChange={(date) => handleFilterChange('end_date', date)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Penerbit</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Penerbit' },
                  ...publishersData.publishers.map((item) => ({
                    value: item.id,
                    label: item.name
                  }))
                ]}
                value={filters.supplier_id}
                onChange={(value) => handleFilterChange('supplier_id', value)}
                placeholder="Pilih penerbit"
                searchable={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: '0', label: 'Pending' },
                  { value: '1', label: 'Selesai' },
                  { value: '2', label: 'Dibatalkan' },
                ]}
                value={filters.status}
                onChange={(value) => handleFilterChange('status', value)}
                placeholder="Pilih status"
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

export default PurchasesFilterDialog;
