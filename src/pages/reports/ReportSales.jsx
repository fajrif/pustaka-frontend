import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Filter, X } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SalesFilterDialog from '@/components/dialogs/reports/SalesFilterDialog';
import DateRangePicker from '@/components/reports/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { exportToPDF, exportToExcel, generateReportFilename } from '@/utils/exportUtils';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const statusConfig = {
  0: { label: 'Pesanan', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  1: { label: 'Lunas', className: 'bg-green-50 text-green-700 border-green-200' },
  2: { label: 'Angsuran', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const paymentTypeConfig = {
  T: { label: 'Tunai', className: 'bg-green-50 text-green-700 border-green-200' },
  K: { label: 'Kredit', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const ReportSales = () => {
  const { toast } = useToast();
  const tableRef = useRef(null);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({});
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;
  };

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reportSales', filters],
    queryFn: async () => {
      const response = await api.get('/reports/sales', { params: filters });
      return response.data;
    },
  });

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilterDialog(false);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  // Prepare chart data
  const preparePaymentTypeChart = () => {
    if (!reportData?.summary) return [];
    return [
      { name: 'Tunai', value: reportData.summary.cash_total || 0 },
      { name: 'Kredit', value: reportData.summary.credit_total || 0 },
    ].filter(item => item.value > 0);
  };

  const paymentTypeChartData = preparePaymentTypeChart();

  // Export handlers
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportToPDF(tableRef.current, generateReportFilename('Penjualan', 'pdf'));
      toast({ title: "Success", description: "PDF berhasil diexport", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal export PDF", variant: "destructive" });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData?.transactions?.length) return;
    setIsExportingExcel(true);
    try {
      const columns = [
        { key: 'no_invoice', header: 'No Faktur', width: 20 },
        { key: 'sales_associate', header: 'Sales', width: 20, accessor: (item) => item.sales_associate?.name || '-' },
        { key: 'transaction_date', header: 'Tanggal', width: 15, accessor: (item) => formatDate(item.transaction_date) },
        { key: 'payment_type', header: 'Tipe Bayar', width: 12, accessor: (item) => paymentTypeConfig[item.payment_type]?.label || '-' },
        { key: 'total_amount', header: 'Total', width: 18, accessor: (item) => formatRupiah(item.total_amount) },
        { key: 'status', header: 'Status', width: 12, accessor: (item) => statusConfig[item.status]?.label || '-' },
      ];
      exportToExcel(reportData.transactions, columns, generateReportFilename('Penjualan', 'xlsx'), 'Penjualan');
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
            <h1 className="text-2xl font-semibold text-slate-900">Laporan Penjualan</h1>
            <p className="text-slate-500 font-normal mt-1">Monitoring transaksi penjualan buku</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Laporan Penjualan</h3>
                <p className="text-sm text-slate-700">
                  Laporan ini menampilkan semua transaksi penjualan dengan filter berdasarkan periode,
                  tipe pembayaran, status, dan sales associate.
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
                  onStartDateChange={(date) => setFilters(prev => ({ ...prev, start_date: date }))}
                  onEndDateChange={(date) => setFilters(prev => ({ ...prev, end_date: date }))}
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
                    disabled={!reportData?.transactions?.length}
                  />
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFilterCount() > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Filter aktif:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.payment_type && (
                      <Badge variant="secondary" className="gap-1">
                        Tipe: {paymentTypeConfig[filters.payment_type]?.label}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, payment_type: '' }))} />
                      </Badge>
                    )}
                    {filters.status && (
                      <Badge variant="secondary" className="gap-1">
                        Status: {statusConfig[filters.status]?.label}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, status: '' }))} />
                      </Badge>
                    )}
                    {filters.sales_associate_id && (
                      <Badge variant="secondary" className="gap-1">
                        Sales Associate
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, sales_associate_id: '' }))} />
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
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Total Penjualan</p>
                  <p className="text-2xl font-semibold text-green-900">{formatRupiah(reportData.summary.total_amount || 0)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-sm text-emerald-600 font-medium">Tunai</p>
                  <p className="text-2xl font-semibold text-emerald-900">{formatRupiah(reportData.summary.cash_total || 0)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium">Kredit</p>
                  <p className="text-2xl font-semibold text-orange-900">{formatRupiah(reportData.summary.credit_total || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {paymentTypeChartData.length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Distribusi Tipe Pembayaran</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={paymentTypeChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentTypeChartData.map((entry, index) => (
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
              ) : !reportData?.transactions?.length ? (
                <div className="text-center py-8 text-slate-500">
                  Tidak ada data untuk ditampilkan
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead>No Faktur</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-center">Tipe Bayar</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.transactions.map((trx, index) => (
                        <TableRow key={trx.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{trx.no_invoice}</TableCell>
                          <TableCell>{trx.sales_associate?.name || '-'}</TableCell>
                          <TableCell>{formatDate(trx.transaction_date)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={paymentTypeConfig[trx.payment_type]?.className}>
                              {paymentTypeConfig[trx.payment_type]?.label || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatRupiah(trx.total_amount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={statusConfig[trx.status]?.className}>
                              {statusConfig[trx.status]?.label || '-'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Dialog */}
      <SalesFilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default ReportSales;
