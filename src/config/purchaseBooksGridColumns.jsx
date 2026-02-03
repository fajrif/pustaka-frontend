import React from 'react';
import BadgeCellRenderer from '@/components/ag-grid/cellRenderers/BadgeCellRenderer';
import CurrencyCellRenderer from '@/components/ag-grid/cellRenderers/CurrencyCellRenderer';
import DropdownFloatingFilter from '@/components/ag-grid/floatingFilters/DropdownFloatingFilter';
import {
    getJenisBukuColor,
    getJenjangStudiColor,
    getMerkBukuColor,
} from '@/config/bookColorMappings';
import { formatRupiah } from '@/utils/formatters';

/**
 * Create column definitions for Purchase Books Selection AG Grid
 * @param {Object} options - Options for column actions
 * @param {Object} options.selectedBooks - Object containing selected books
 * @param {Function} options.onCheckboxChange - Callback when checkbox is toggled
 * @param {Function} options.onSelectAll - Callback when select all is toggled
 * @param {Array} options.allBooks - All available books for select all functionality
 * @returns {Array} Column definitions array
 */
export const createPurchaseBooksColumnDefs = ({ selectedBooks, onCheckboxChange, onSelectAll, allBooks }) => [
    // Checkbox column - pinned left
    {
        headerName: '',
        field: 'checkbox',
        width: 50,
        pinned: 'left',
        sortable: false,
        filter: false,
        resizable: false,
        checkboxSelection: false, // We'll use custom renderer
        headerComponent: (params) => {
            const totalBooks = allBooks?.length || 0;
            const selectedCount = Object.keys(selectedBooks).length;
            const allSelected = totalBooks > 0 && selectedCount === totalBooks;
            const someSelected = selectedCount > 0 && selectedCount < totalBooks;

            return (
                <div className="flex items-center justify-center h-full">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(input) => {
                            if (input) {
                                input.indeterminate = someSelected;
                            }
                        }}
                        onChange={(e) => onSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        title="Pilih Semua"
                    />
                </div>
            );
        },
        cellRenderer: (params) => {
            const isSelected = !!selectedBooks[params.data.id];

            return (
                <div className="flex items-center justify-center h-full">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onCheckboxChange(params.data)}
                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                </div>
            );
        },
    },
    // Jenis Buku column
    {
        headerName: 'Jenis Buku',
        field: 'jenis_buku.code',
        width: 90,
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
        floatingFilterComponent: DropdownFloatingFilter,
        floatingFilterComponentParams: {
            apiEndpoint: '/jenis-buku',
            dataKey: 'jenis_buku',
            valueKey: 'code',
            labelFormatter: (item) => `[${item.code}] ${item.name}`,
            placeholder: 'Semua',
        },
        cellRenderer: (params) => {
            const code = params.value;
            const colorClasses = getJenisBukuColor(code);
            return <BadgeCellRenderer value={code} colorClasses={colorClasses} />;
        },
        filterValueGetter: (params) => {
            const data = params.data?.jenis_buku;
            if (!data) return '';
            return data.code;
        },
    },
    // Bidang Studi column
    {
        headerName: 'Bidang Studi',
        field: 'bidang_studi',
        width: 180,
        sortable: true,
        filter: true,
        cellRenderer: (params) => {
            const data = params.data?.bidang_studi;
            if (!data) return <span className="text-slate-400">-</span>;
            const displayText = `[${data.code}] ${data.name}`;
            return (
                <span className="text-black-400">
                    {displayText}
                </span>
            );
        },
        filterValueGetter: (params) => {
            const data = params.data?.bidang_studi;
            if (!data) return '';
            return `${data.code} ${data.name}`;
        },
        cellStyle: { fontWeight: '500' },
    },
    // Jenjang Studi column
    {
        headerName: 'Jenjang',
        field: 'jenjang_studi.code',
        width: 100,
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
        floatingFilterComponent: DropdownFloatingFilter,
        floatingFilterComponentParams: {
            apiEndpoint: '/jenjang-studi',
            dataKey: 'jenjang_studi',
            valueKey: 'code',
            labelFormatter: (item) => `[${item.code}] ${item.name}`,
            placeholder: 'Semua',
        },
        cellRenderer: (params) => {
            const code = params.value;
            const colorClasses = getJenjangStudiColor(code);
            return <BadgeCellRenderer value={code} colorClasses={colorClasses} />;
        },
        filterValueGetter: (params) => {
            const data = params.data?.jenjang_studi;
            if (!data) return '';
            return data.code;
        },
    },
    // Kelas column
    {
        headerName: 'Kelas',
        field: 'kelas',
        width: 80,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params) => {
            const kelas = params.value;
            if (!kelas) return <span className="text-slate-400">-</span>;
            return <span className="font-medium">{kelas}</span>;
        },
    },
    // Periode/Semester column
    {
        headerName: 'Semester',
        field: 'periode',
        width: 140,
        sortable: true,
        filter: true,
        valueFormatter: (params) => {
            if (params.value == 1) return 'Semester Ganjil';
            if (params.value == 2) return 'Semester Genap';
            return '-';
        },
    },
    // Year column
    {
        headerName: 'Tahun',
        field: 'year',
        width: 80,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params) => {
            const year = params.value;
            if (!year) return <span className="text-slate-400">-</span>;
            return <span>{year}</span>;
        },
    },
    // Curriculum column
    {
        headerName: 'Kurikulum',
        field: 'curriculum.name',
        width: 120,
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
        floatingFilterComponent: DropdownFloatingFilter,
        floatingFilterComponentParams: {
            apiEndpoint: '/curriculums',
            dataKey: 'curriculums',
            valueKey: 'name',
            labelFormatter: (item) => item.name.toUpperCase(),
            placeholder: 'Semua',
        },
        valueFormatter: (params) => (params.value ? params.value.toUpperCase() : '-'),
    },
    // Merk Buku column
    {
        headerName: 'Merk',
        field: 'merk_buku',
        width: 110,
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
        floatingFilterComponent: DropdownFloatingFilter,
        floatingFilterComponentParams: {
            apiEndpoint: '/merk-buku',
            dataKey: 'merk_buku',
            valueKey: 'code',
            labelFormatter: (item) => `[${item.code}] ${item.name}`,
            placeholder: 'Semua',
        },
        cellRenderer: (params) => {
            const data = params.value;
            if (!data) return <span className="text-slate-400">-</span>;
            const colorClasses = getMerkBukuColor(data.code);
            return <BadgeCellRenderer value={data.code} colorClasses={colorClasses} />;
        },
        filterValueGetter: (params) => {
            const data = params.data?.merk_buku;
            if (!data) return '';
            return data.code;
        },
        tooltipValueGetter: (params) => {
            const data = params.data?.merk_buku;
            return data?.name || '';
        },
    },
    // Penerbit column
    {
        headerName: 'Penerbit',
        field: 'publisher',
        width: 100,
        sortable: true,
        filter: true,
        valueGetter: (params) => {
            const data = params.data?.publisher;
            return data?.code || '-';
        },
        tooltipValueGetter: (params) => {
            const data = params.data?.publisher;
            return data?.name || '';
        },
    },
    // No Pages column
    {
        headerName: 'Halaman',
        field: 'no_pages',
        width: 90,
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params) => {
            const noPages = params.value;
            if (!noPages) return <span className="text-slate-400">-</span>;
            return <span>{noPages}</span>;
        },
    },
    // Stock column - pinned right
    {
        headerName: 'Stok',
        field: 'stock',
        width: 80,
        pinned: 'right',
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: (params) => {
            const stock = params.value || 0;
            const stockColor = stock <= 0 ? 'text-red-600' : stock <= 10 ? 'text-orange-600' : 'text-green-600';
            return (
                <div className={`flex items-center justify-center font-semibold ${stockColor}`}>
                    {stock}
                </div>
            );
        },
    },
    // Harga Jual - pinned right
    {
        headerName: 'Harga Jual',
        field: 'price',
        width: 130,
        pinned: 'right',
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellRenderer: CurrencyCellRenderer,
        cellStyle: { fontWeight: '500' },
    },
];

/**
 * Default column settings for AG Grid
 */
export const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    minWidth: 60,
    flex: 0,
    cellStyle: {
        display: 'flex',
        alignItems: 'center',
    },
};
