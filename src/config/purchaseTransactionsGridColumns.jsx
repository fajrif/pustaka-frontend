import { Badge } from '@/components/ui/badge';
import { formatDate, formatRupiah } from '@/utils/formatters';
import DropdownFloatingFilter from '@/components/ag-grid/floatingFilters/DropdownFloatingFilter';
import PurchaseTransactionActionMenuCellRenderer from '@/components/ag-grid/cellRenderers/PurchaseTransactionActionMenuCellRenderer';

// Status Badge Component
const StatusBadge = ({ status }) => {
    const config = {
        0: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        1: { label: 'Selesai', className: 'bg-green-50 text-green-700 border-green-200' },
        2: { label: 'Dibatalkan', className: 'bg-red-50 text-red-700 border-red-200' },
    };
    const { label, className } = config[status] || config[0];
    return <Badge variant="outline" className={className}>{label}</Badge>;
};

export const createPurchaseTransactionsColumnDefs = ({ onView, onEdit, onDelete, onComplete, onCancel }) => [
    {
        field: 'no_invoice',
        headerName: 'No PO',
        width: 180,
        pinned: 'left',
        cellRenderer: (params) => {
            if (!params.value) return 'N/A';
            return (
                <span
                    className="uppercase cursor-pointer hover:underline hover:text-purple-600 font-medium"
                    onClick={() => onView(params.data)}
                >
                    {params.value}
                </span>
            );
        },
        filter: 'agTextColumnFilter',
        floatingFilter: true,
    },
    {
        field: 'supplier.code',
        headerName: 'Penerbit',
        width: 150,
        valueGetter: (params) => params.data.supplier?.code || 'N/A',
        cellRenderer: (params) => {
            const supplierName = params.data.supplier?.name || '';
            return (
                <span
                    className="font-medium uppercase"
                    title={supplierName}
                >
                    {params.value}
                </span>
            );
        },
        filter: 'agTextColumnFilter',
        floatingFilter: true,
    },
    {
        field: 'purchase_date',
        headerName: 'Tanggal',
        width: 150,
        cellRenderer: (params) => {
            return <span className="text-sm text-slate-600">{formatDate(params.value)}</span>;
        },
        cellClass: 'justify-center',
        filter: 'agDateColumnFilter',
        filterParams: {
            browserDatePicker: true,
            inRangeInclusive: true,
            maxNumConditions: 1,
            // Server-side filtering: comparator always returns 0 to prevent double filtering
            // The server already filters by date, AG Grid should not filter again
            comparator: () => 0,
            minValidYear: 2000,
            maxValidYear: 2100,
        },
        floatingFilter: true,
    },
    {
        field: 'total_items',
        headerName: 'Items',
        width: 80,
        cellClass: 'justify-center',
        cellRenderer: (params) => {
            const totalQuantity = params.data?.items?.reduce((sum, item) => {
                return sum + (item.quantity || 0);
            }, 0) || 0;
            return <span className="font-medium">{totalQuantity}</span>;
        },
        sortable: false,
        filter: false,
    },
    {
        field: 'total_amount',
        headerName: 'Total',
        width: 150,
        type: 'rightAligned',
        cellRenderer: (params) => {
            return <span className="font-medium">{formatRupiah(params.value)}</span>;
        },
        filter: 'agNumberColumnFilter',
        filterParams: {
            // Server-side filtering: always pass to prevent double filtering
            // The server already filters by amount, AG Grid should not filter again
            inRangeInclusive: true,
        },
        floatingFilter: true,
        cellClass: 'justify-end',
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 130,
        cellRenderer: (params) => {
            return <StatusBadge status={params.value} />;
        },
        cellClass: 'justify-center',
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
        floatingFilterComponent: DropdownFloatingFilter,
        floatingFilterComponentParams: {
            staticOptions: [
                { value: '0', label: 'Pending' },
                { value: '1', label: 'Selesai' },
                { value: '2', label: 'Dibatalkan' }
            ],
            placeholder: 'Semua',
        },
    },
    {
        field: 'created_at',
        headerName: 'Tanggal Buat',
        width: 180,
        cellRenderer: (params) => {
            return <span className="text-sm text-slate-600">{formatDate(params.value, 'dd/MM/yyyy HH:mm')}</span>;
        },
        cellClass: 'justify-center',
        filter: 'agDateColumnFilter',
        filterParams: {
            browserDatePicker: true,
            inRangeInclusive: true,
            maxNumConditions: 1,
            // Server-side filtering: comparator always returns 0 to prevent double filtering
            // The server already filters by date, AG Grid should not filter again
            comparator: () => 0,
            minValidYear: 2000,
            maxValidYear: 2100,
        },
        floatingFilter: true,
    },
    {
        headerName: '',
        field: 'actions',
        pinned: 'right',
        width: 60,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params) => (
            <PurchaseTransactionActionMenuCellRenderer
                data={params.data}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onCancel={onCancel}
            />
        ),
    },
];

export const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: false,
    cellStyle: {
        display: 'flex',
        alignItems: 'center',
    },
};
