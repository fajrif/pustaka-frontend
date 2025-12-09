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
    return `Rp ${(numberAmount / 1000000000).toFixed(2)}M`;
  } else if (numberAmount >= 1000000) {
    return `Rp ${(numberAmount / 1000000).toFixed(0)}Jt`;
  } else if (numberAmount >= 1000) {
    return `Rp ${(numberAmount / 1000).toFixed(0)}Rb`;
  }

  return formatRupiah(numberAmount);
};

export const formatShortRupiah = formatRupiahShort;

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
};

export const formatDate = (date, fmt='dd MMM yyyy') => {
  return format(new Date(date), fmt, { locale: id })
};
