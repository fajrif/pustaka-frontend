import { cn } from '@/lib/utils';

const BadgeCellRenderer = ({ value, colorClasses }) => {
  if (!value) return <span className="text-slate-400">-</span>;

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-px rounded text-[10px] font-medium border leading-tight',
        colorClasses?.bg || 'bg-gray-100',
        colorClasses?.text || 'text-gray-800',
        colorClasses?.border || 'border-gray-200'
      )}
    >
      {value}
    </span>
  );
};

export default BadgeCellRenderer;
