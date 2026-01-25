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
 * Create column definitions for Sales Books Selection AG Grid
 * @param {Object} options - Options for column actions
 * @param {Object} options.selectedBooks - Object containing selected books with quantities
 * @param {Function} options.onCheckboxChange - Callback when checkbox is toggled
 * @param {Function} options.onQuantityChange - Callback when quantity is changed
 * @param {Function} options.onSelectAll - Callback when select all is toggled
 * @param {Array} options.allBooks - All available books for select all functionality
 * @returns {Array} Column definitions array
 */
export const createSalesBooksColumnDefs = ({ selectedBooks, onCheckboxChange, onQuantityChange, onSelectAll, allBooks }) => [
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
            // Only count books with stock > 0 for select all
            const inStockBooks = allBooks?.filter(book => book.stock > 0) || [];
            const totalInStockBooks = inStockBooks.length;
            const selectedCount = Object.keys(selectedBooks).length;
            const allSelected = totalInStockBooks > 0 && selectedCount === totalInStockBooks;
            const someSelected = selectedCount > 0 && selectedCount < totalInStockBooks;

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
                        onChange={() => onSelectAll(!allSelected)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                        title={allSelected ? "Unselect All" : "Select All (In Stock Only)"}
                    />
                </div>
            );
        },
        cellRenderer: (params) => {
            const isSelected = !!selectedBooks[params.data.id];
            const stock = params.data.stock || 0;
            const isOutOfStock = stock === 0;

            return (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isOutOfStock}
                        onChange={() => onCheckboxChange(params.data)}
                        className={`w-4 h-4 text-green-600 rounded focus:ring-green-500 ${isOutOfStock ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                            }`}
                        title={isOutOfStock ? 'Out of stock' : ''}
                    />
                </div>
            );
        },
    },
    // Jenis Buku
    {
        headerName: 'Jenis Buku',
        field: 'jenis_buku.code',
        width: 110,
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
            if (!code) return null;
            const colorClasses = getJenisBukuColor(code);
            return <BadgeCellRenderer value={code} colorClasses={colorClasses} />;
        },
        filterValueGetter: (params) => {
            const data = params.data?.jenis_buku;
            if (!data) return '';
            return data.code;
        },
    },
    // Bidang Studi
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
    // Jenjang Studi
    {
        headerName: 'Jenjang',
        field: 'jenjang_studi.code',
        width: 90,
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
            if (!code) return null;
            const colorClasses = getJenjangStudiColor(code);
            return <BadgeCellRenderer value={code} colorClasses={colorClasses} />;
        },
        filterValueGetter: (params) => {
            const data = params.data?.jenjang_studi;
            if (!data) return '';
            return data.code;
        },
    },
    // Kurikulum
    {
        headerName: 'Kurikulum',
        field: 'curriculum.name',
        width: 110,
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
            labelFormatter: (item) => item.name,
            placeholder: 'Semua',
        },
        filterValueGetter: (params) => {
            const data = params.data?.curriculum;
            if (!data) return '';
            return data.name;
        },
    },
    // Kelas
    {
        headerName: 'Kelas',
        field: 'kelas',
        width: 70,
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
    },
    // Periode
    {
        headerName: 'Periode',
        field: 'periode',
        width: 80,
        sortable: true,
        filter: 'agTextColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
    },
    // Tahun
    {
        headerName: 'Tahun',
        field: 'year',
        width: 80,
        sortable: true,
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
    },
    // Merk Buku
    {
        headerName: 'Merk Buku',
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
    // Penerbit
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
    // Halaman
    {
        headerName: 'Halaman',
        field: 'no_pages',
        width: 90,
        sortable: true,
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
        cellStyle: {
            textAlign: 'center',
        },
    },
    // Harga - pinned right (second in pinned group)
    {
        headerName: 'Harga',
        field: 'price',
        width: 120,
        pinned: 'right',
        sortable: true,
        filter: 'agNumberColumnFilter',
        floatingFilter: true,
        suppressHeaderFilterButton: true,
        suppressHeaderMenuButton: true,
        suppressFloatingFilterButton: true,
        cellRenderer: (params) => {
            return <CurrencyCellRenderer value={params.value} />;
        },
    },
    // Stock - pinned right (first in pinned group)
    {
        headerName: 'Stock',
        field: 'stock',
        width: 80,
        pinned: 'right',
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellStyle: (params) => {
            const stock = params.value || 0;
            let color = '';
            let fontWeight = '500';

            if (stock <= 5) {
                // Alert: Red text
                color = '#dc2626'; // red-600
                fontWeight = '700';
            } else if (stock <= 10) {
                // Warning: Orange text
                color = '#ea580c'; // orange-600
                fontWeight = '700';
            }

            return {
                textAlign: 'center',
                color,
                fontWeight,
                display: 'flex',
                alignItems: 'center',
            };
        },
    },
    // Quantity - pinned right (last in pinned group)
    {
        headerName: 'Qty',
        field: 'quantity',
        width: 100,
        pinned: 'right',
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params) => {
            const isSelected = !!selectedBooks[params.data.id];
            const stock = params.data.stock || 0;

            if (!isSelected) return null;

            return (
                <div className="flex items-center justify-center">
                    <input
                        type="number"
                        min="1"
                        max={stock}
                        value={selectedBooks[params.data.id]?.quantity || 1}
                        onChange={(e) => onQuantityChange(params.data.id, e.target.value, stock)}
                        className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            );
        },
    },
    // Subtotal column - pinned right
    {
        headerName: 'Subtotal',
        field: 'subtotal',
        width: 150,
        pinned: 'right',
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params) => {
            const isSelected = !!selectedBooks[params.data.id];
            if (!isSelected) return null;

            const { quantity } = selectedBooks[params.data.id];
            const price = params.data.price;
            const subtotal = quantity * price;

            return (
                <div className="flex items-center justify-end font-semibold text-green-600">
                    {formatRupiah(subtotal)}
                </div>
            );
        },
    },
];

// Default column definition
export const defaultColDef = {
    resizable: true,
    sortable: false,
    filter: false,
    floatingFilter: false,
};
