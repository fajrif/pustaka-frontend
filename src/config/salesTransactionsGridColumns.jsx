import { Badge } from '@/components/ui/badge';
import { formatDate, formatRupiah } from '@/utils/formatters';
import DropdownFloatingFilter from '@/components/ag-grid/floatingFilters/DropdownFloatingFilter';
import SalesTransactionActionMenuCellRenderer from '@/components/ag-grid/cellRenderers/SalesTransactionActionMenuCellRenderer';



// Status Badge Component
const StatusBadge = ({ status }) => {
    const config = {
        0: { label: 'Pesanan', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        1: { label: 'Lunas', className: 'bg-green-50 text-green-700 border-green-200' },
        2: { label: 'Angsuran', className: 'bg-blue-50 text-blue-700 border-blue-200' }
    };
    const { label, className } = config[status] || config[0];
    return <Badge variant="outline" className={className}>{label}</Badge>;
};

// Payment Type Badge Component
const PaymentTypeBadge = ({ paymentType }) => {
    if (paymentType === 'T') {
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tunai</Badge>;
    }
    return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Kredit</Badge>;
};

export const createSalesTransactionsColumnDefs = ({ onView, onInvoice, onEdit, onDelete }) => [
    {
        field: 'no_invoice',
        headerName: 'No Faktur',
        width: 180,
        pinned: 'left',
        cellRenderer: (params) => {
            if (!params.value) return 'N/A';
            return (
                <span
                    className="uppercase cursor-pointer hover:underline hover:text-blue-600 font-medium"
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
        field: 'sales_associate.name',
        headerName: 'Sales Associate',
        width: 200,
        valueGetter: (params) => params.data.sales_associate?.name || 'N/A',
        cellRenderer: (params) => {
            return <span className="font-medium">{params.value}</span>;
        },
        filter: 'agTextColumnFilter',
        floatingFilter: true,
    },
    {
        field: 'transaction_date',
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
            comparator: (filterLocalDateAtMidnight, cellValue) => {
                if (cellValue == null) return -1;

                // Handle date strings (YYYY-MM-DD format)
                const dateParts = cellValue.split('-');
                const cellDate = new Date(
                    Number(dateParts[0]),
                    Number(dateParts[1]) - 1,
                    Number(dateParts[2])
                );

                if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                    return 0;
                }
                if (cellDate < filterLocalDateAtMidnight) {
                    return -1;
                }
                return 1;
            },
            minValidYear: 2000,
            maxValidYear: 2100,
        },
        floatingFilter: true,
    },
    {
        field: 'payment_type',
        headerName: 'Pembayaran',
        width: 130,
        cellRenderer: (params) => {
            return <PaymentTypeBadge paymentType={params.value} />;
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
                { value: 'T', label: 'Tunai' },
                { value: 'K', label: 'Kredit' }
            ],
            placeholder: 'Semua',
        },
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
                { value: '0', label: 'Pesanan' },
                { value: '1', label: 'Lunas' },
                { value: '2', label: 'Angsuran' }
            ],
            placeholder: 'Semua',
        },
    },
    {
        field: 'shipping',
        headerName: 'Pengiriman',
        width: 110,
        cellClass: 'justify-center',
        cellRenderer: (params) => {
            const hasShipping = params.value;
            const displayText = hasShipping ? 'Yes' : 'No';
            const colorClass = hasShipping ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
            return <span className={colorClass}>{displayText}</span>;
        },
        sortable: false,
        filter: false,
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
            <SalesTransactionActionMenuCellRenderer
                data={params.data}
                onView={onView}
                onInvoice={onInvoice}
                onEdit={onEdit}
                onDelete={onDelete}
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
