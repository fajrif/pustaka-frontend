import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  // Quick date range presets
  const setThisMonth = () => {
    const now = new Date();
    onStartDateChange(format(startOfMonth(now), 'yyyy-MM-dd'));
    onEndDateChange(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  const setLastMonth = () => {
    const lastMonth = subMonths(new Date(), 1);
    onStartDateChange(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
    onEndDateChange(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
  };

  const setThisYear = () => {
    const now = new Date();
    onStartDateChange(format(startOfYear(now), 'yyyy-MM-dd'));
    onEndDateChange(format(endOfYear(now), 'yyyy-MM-dd'));
  };

  const setLast3Months = () => {
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);
    onStartDateChange(format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd'));
    onEndDateChange(format(endOfMonth(now), 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <Label className="text-sm font-medium text-slate-700">Periode</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-40"
          />
          <span className="text-slate-500">-</span>
          <Input
            type="date"
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-40"
            min={startDate || undefined}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Cepat:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setThisMonth}
          className="h-7 text-xs"
        >
          Bulan Ini
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setLastMonth}
          className="h-7 text-xs"
        >
          Bulan Lalu
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setLast3Months}
          className="h-7 text-xs"
        >
          3 Bulan Terakhir
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={setThisYear}
          className="h-7 text-xs"
        >
          Tahun Ini
        </Button>
      </div>
    </div>
  );
};

export default DateRangePicker;
