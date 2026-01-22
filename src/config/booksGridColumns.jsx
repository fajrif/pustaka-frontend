import BadgeCellRenderer from '@/components/ag-grid/cellRenderers/BadgeCellRenderer';
import ActionMenuCellRenderer from '@/components/ag-grid/cellRenderers/ActionMenuCellRenderer';
import CurrencyCellRenderer from '@/components/ag-grid/cellRenderers/CurrencyCellRenderer';
import DropdownFloatingFilter from '@/components/ag-grid/floatingFilters/DropdownFloatingFilter';
import {
  getJenisBukuColor,
  getJenjangStudiColor,
  getMerkBukuColor,
} from '@/config/bookColorMappings';

/**
 * Create column definitions for Books AG Grid
 * @param {Object} options - Options for column actions
 * @param {Function} options.onEdit - Callback when edit is clicked
 * @param {Function} options.onDelete - Callback when delete is clicked
 * @returns {Array} Column definitions array
 */
export const createBooksColumnDefs = ({ onEdit, onDelete }) => [
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
      const colorClasses = getJenisBukuColor(code);
      return <BadgeCellRenderer value={code} colorClasses={colorClasses} />;
    },
    filterValueGetter: (params) => {
      const data = params.data?.jenis_buku;
      if (!data) return '';
      return data.code;
    },
  },
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
        <span
          className="text-black-400 hover:text-black-600 hover:underline cursor-pointer"
          onClick={() => onEdit(params.data)}
        >
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
  {
    headerName: 'Kelas',
    field: 'kelas',
    width: 80,
    sortable: true,
    filter: true,
    cellStyle: { textAlign: 'center' },
    valueGetter: (params) => {
      const kelas = params.data?.kelas;
      if (!kelas) return '-';
      // Handle both object and string types
      if (typeof kelas === 'object') {
        return kelas.name || kelas.code || '-';
      }
      return kelas;
    },
  },
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
  {
    headerName: 'Tahun',
    field: 'year',
    width: 80,
    sortable: true,
    filter: true,
    cellStyle: { textAlign: 'center' },
  },
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
  {
    headerName: 'Halaman',
    field: 'no_pages',
    width: 90,
    sortable: true,
    filter: 'agNumberColumnFilter',
    cellStyle: { textAlign: 'center' },
    valueFormatter: (params) => (params.value ? params.value : '-'),
  },
  {
    headerName: 'Harga',
    field: 'price',
    width: 130,
    sortable: true,
    filter: 'agNumberColumnFilter',
    cellRenderer: CurrencyCellRenderer,
    cellStyle: { fontWeight: '500' },
  },
  {
    headerName: 'Stock',
    field: 'stock',
    width: 80,
    sortable: true,
    filter: 'agNumberColumnFilter',
    cellStyle: { textAlign: 'center' },
  },
  {
    headerName: '',
    field: 'actions',
    width: 60,
    pinned: 'right',
    sortable: false,
    filter: false,
    resizable: false,
    cellRenderer: (params) => (
      <ActionMenuCellRenderer
        data={params.data}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
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
