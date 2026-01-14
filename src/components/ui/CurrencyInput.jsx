import React from 'react';
import { Controller } from 'react-hook-form';
import { Input } from './input';

const CurrencyInput = ({ control, name, value: propValue, onChange: propOnChange, ...props }) => {

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '';
    // Hapus karakter non-digit sebelum format ulang
    const numericValue = String(value).replace(/[^\d]/g, '');
    // Format sebagai IDR tanpa desimal
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  const parseCurrency = (value) => {
    // Hapus simbol mata uang, titik ribuan, dan koma desimal untuk mendapatkan angka murni
    return value.replace(/[Rp.]/g, '').replace(/,/g, '');
  };

  // If control and name are provided, use react-hook-form Controller
  if (control && name) {
    return (
      <div className="space-y-2">
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Input
              id={name}
              type="text"
              className="text-left"
              {...props}
              // Tampilkan nilai yang sudah diformat
              value={formatCurrency(value)}
              onChange={(e) => {
                // Saat input berubah, simpan nilai MURNI (tanpa format Rp.) di state RHF
                const rawValue = parseCurrency(e.target.value);
                onChange(rawValue === '' ? '' : parseFloat(rawValue));
              }}
            />
          )}
        />
      </div>
    );
  }

  // Standalone mode - use value and onChange props directly
  return (
    <Input
      type="text"
      {...props}
      value={formatCurrency(propValue)}
      onChange={(e) => {
        const rawValue = parseCurrency(e.target.value);
        propOnChange?.(rawValue === '' ? '' : parseFloat(rawValue));
      }}
    />
  );
};

export { CurrencyInput };

