// Utility functions for formatting data
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const formatRupiah = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';

  const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numberAmount);
};

export const formatRupiahShort = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';

  const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (numberAmount >= 1000000000) {
    return `Rp ${(numberAmount / 1000000000).toFixed(0)}M`;
  } else if (numberAmount >= 1000000) {
    return `Rp ${(numberAmount / 1000000).toFixed(0)}Jt`;
  } else if (numberAmount >= 1000) {
    return `Rp ${(numberAmount / 1000).toFixed(0)}Rb`;
  }

  return formatRupiah(numberAmount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
};

export const formatDate = (date, fmt='dd MMM yyyy') => {
  return format(new Date(date), fmt, { locale: id })
};

export const calculateSLAStatus = (tanggalPO, tanggalTransaksi) => {
  if (!tanggalPO || !tanggalTransaksi) return 'unknown';

  const po = new Date(tanggalPO);
  const tx = new Date(tanggalTransaksi);

  // Get end of month for PO date
  const endOfPOMonth = new Date(po.getFullYear(), po.getMonth() + 1, 0);
  // Get end of next month
  const endOfNextMonth = new Date(po.getFullYear(), po.getMonth() + 2, 0);

  if (tx <= endOfPOMonth) {
    return 'ontime'; // Dibayar di bulan yang sama
  } else if (tx <= endOfNextMonth) {
    return 'h+1'; // Dibayar di H+1 (bulan berikutnya)
  } else {
    return 'late'; // Terlambat
  }
};

export const getSLALabel = (status) => {
  const labels = {
    'ontime': 'Tepat Waktu',
    'h+1': 'H+1',
    'late': 'Terlambat',
    'unknown': 'Tidak Ada Data'
  };
  return labels[status] || 'Tidak Ada Data';
};

export const getSLAColor = (status) => {
  const colors = {
    'ontime': 'text-green-600',
    'h+1': 'text-blue-600',
    'late': 'text-red-600',
    'unknown': 'text-slate-400'
  };
  return colors[status] || 'text-slate-400';
};

export const getSLABgColor = (status) => {
  const _default = 'bg-slate-50 text-slate-700';
  const colors = {
    'ontime': 'bg-green-50 text-green-700',
    'h+1': 'bg-blue-50 text-blue-700',
    'late': 'bg-red-50 text-red-700',
    'unknown': 'bg-slate-50 text-slate-700'
  };
  return colors[status] || _default;
};
