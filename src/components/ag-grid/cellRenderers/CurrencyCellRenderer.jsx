import { formatRupiah } from '@/utils/formatters';

const CurrencyCellRenderer = ({ value }) => {
  if (value === undefined || value === null) {
    return <span className="text-slate-400">Rp 0</span>;
  }

  return <span>{formatRupiah(value)}</span>;
};

export default CurrencyCellRenderer;
