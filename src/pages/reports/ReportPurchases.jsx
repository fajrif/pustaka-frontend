import React, { useState, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingBag, Filter, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PurchasesFilterDialog from '@/components/dialogs/reports/PurchasesFilterDialog';
import DateRangePicker from '@/components/reports/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import Pagination from '@/components/Pagination';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { exportToPDF, exportToExcel, generateReportFilename } from '@/utils/exportUtils';
import { useToast } from '@/components/ui/use-toast';
import { PAGINATION } from '@/utils/constants';

const statusConfig = {
  0: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  1: { label: 'Selesai', className: 'bg-green-50 text-green-700 border-green-200' },
  2: { label: 'Dibatalkan', className: 'bg-red-50 text-red-700 border-red-200' },
};

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'];

const ReportPurchases = () => {
  const { toast } = useToast();
  const tableRef = useRef(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({});
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const limit = 100;

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;
  };

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reportPurchases', filters, currentPage, limit],
    queryFn: async () => {
      const response = await api.get('/reports/purchases', {
        params: {
          ...filters,
          page: currentPage,
          limit: limit
        }
      });
      return response.data;
    },
    placeholderData: keepPreviousData,
  });

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
    setShowFilterDialog(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prepare chart data - group by supplier
  const prepareChartData = () => {
    if (!reportData?.data) return [];

    const groupedBySupplier = {};
    reportData.data.forEach(purchase => {
      const supplierName = purchase.supplier?.name || 'Lainnya';
      if (!groupedBySupplier[supplierName]) {
        groupedBySupplier[supplierName] = { name: supplierName, total: 0, count: 0 };
      }
      groupedBySupplier[supplierName].total += purchase.total_amount || 0;
      groupedBySupplier[supplierName].count += 1;
    });

    return Object.values(groupedBySupplier)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const chartData = prepareChartData();

  // Export handlers
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportToPDF(tableRef.current, generateReportFilename('Pembelian', 'pdf'));
      toast({ title: "Success", description: "PDF berhasil diexport", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal export PDF", variant: "destructive" });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportData?.data?.length) return;
    setIsExportingExcel(true);
    try {
      // Fetch ALL data using all=true parameter
      const response = await api.get('/reports/purchases', {
        params: {
          ...filters,
          all: true
        }
      });

      const allData = response.data.data;

      const columns = [
        { key: 'no_po', header: 'No PO', width: 20 },
        { key: 'supplier', header: 'Supplier', width: 25, accessor: (item) => item.supplier?.name || '-' },
        { key: 'purchase_date', header: 'Tanggal', width: 15, accessor: (item) => formatDate(item.purchase_date) },
        { key: 'total_items', header: 'Total Item', width: 12 },
        { key: 'total_amount', header: 'Total Nilai', width: 18, accessor: (item) => formatRupiah(item.total_amount) },
        { key: 'status', header: 'Status', width: 12, accessor: (item) => statusConfig[item.status]?.label || '-' },
      ];
      await exportToExcel(allData, columns, generateReportFilename('Pembelian', 'xlsx'), 'Pembelian');
      toast({ title: "Success", description: "Excel berhasil diexport", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal export Excel", variant: "destructive" });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Laporan Pembelian</h1>
            <p className="text-slate-500 font-normal mt-1">Monitoring transaksi pembelian buku</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Laporan Pembelian</h3>
                <p className="text-sm text-slate-700">
                  Laporan ini menampilkan semua transaksi pembelian buku dari penerbit
                  dengan filter berdasarkan periode, penerbit, dan status.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters & Export */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <DateRangePicker
                  startDate={filters.start_date || ''}
                  endDate={filters.end_date || ''}
                  onStartDateChange={(date) => {
                    setFilters(prev => ({ ...prev, start_date: date }));
                    setCurrentPage(PAGINATION.DEFAULT_PAGE);
                  }}
                  onEndDateChange={(date) => {
                    setFilters(prev => ({ ...prev, end_date: date }));
                    setCurrentPage(PAGINATION.DEFAULT_PAGE);
                  }}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterDialog(true)}
                    className="gap-2 relative"
                  >
                    <Filter className="w-4 h-4" />
                    Filter Lainnya
                    {getActiveFilterCount() > 2 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                        {getActiveFilterCount() - 2}
                      </span>
                    )}
                  </Button>
                  <ExportButtons
                    onExportPDF={handleExportPDF}
                    onExportExcel={handleExportExcel}
                    isExportingPDF={isExportingPDF}
                    isExportingExcel={isExportingExcel}
                    disabled={!reportData?.data?.length}
                  />
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFilterCount() > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Filter aktif:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.supplier_id && (
                      <Badge variant="secondary" className="gap-1">
                        Supplier
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, supplier_id: '' }))} />
                      </Badge>
                    )}
                    {filters.status && (
                      <Badge variant="secondary" className="gap-1">
                        Status: {statusConfig[filters.status]?.label}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, status: '' }))} />
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                  >
                    Hapus Semua
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          {/* Summary Cards */}
          {reportData?.summary && (
            <div className="p-4 border-b border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Total Transaksi</p>
                  <p className="text-2xl font-semibold text-blue-900">{reportData.summary.total_transactions || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Total Nilai</p>
                  <p className="text-2xl font-semibold text-purple-900">{formatRupiah(reportData.summary.total_amount || 0)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Selesai</p>
                  <p className="text-2xl font-semibold text-green-900">
                    {reportData.summary.completed_count !== undefined
                      ? reportData.summary.completed_count
                      : (reportData.data || []).filter(p => p.status === 1).length}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-900">
                    {reportData.summary.pending_count !== undefined
                      ? reportData.summary.pending_count
                      : (reportData.data || []).filter(p => p.status === 0).length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Pembelian per Supplier</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8b5cf6"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupiah(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          <CardContent className="pt-6">
            <div ref={tableRef}>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : !reportData?.data?.length ? (
                <div className="text-center py-8 text-slate-500">
                  Tidak ada data untuk ditampilkan
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>No PO</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-center">Total Item</TableHead>
                        <TableHead className="text-right">Total Nilai</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.data.map((purchase, index) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{((currentPage - 1) * limit) + index + 1}</TableCell>
                          <TableCell className="font-medium">{purchase.no_invoice}</TableCell>
                          <TableCell>{purchase.supplier?.name || '-'}</TableCell>
                          <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                          <TableCell className="text-center">{purchase.total_items || 0}</TableCell>
                          <TableCell className="text-right font-semibold">{formatRupiah(purchase.total_amount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={statusConfig[purchase.status]?.className}>
                              {statusConfig[purchase.status]?.label || '-'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Pagination Component */}
            {!isLoading && reportData?.data?.length > 0 && reportData?.pagination && (
              <Pagination
                currentPage={currentPage}
                totalPages={reportData.pagination.total_pages}
                total={reportData.pagination.total}
                limit={reportData.pagination.limit}
                onPageChange={handlePageChange}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Dialog */}
      <PurchasesFilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default ReportPurchases;
