import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Filter, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CreditsFilterDialog from '@/components/dialogs/reports/CreditsFilterDialog';
import DateRangePicker from '@/components/reports/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { exportToPDF, exportToExcel, generateReportFilename } from '@/utils/exportUtils';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

const statusConfig = {
  0: { label: 'Pesanan', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  1: { label: 'Lunas', className: 'bg-green-50 text-green-700 border-green-200' },
  2: { label: 'Angsuran', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const ReportCredits = () => {
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
    queryKey: ['reportCredits', filters],
    queryFn: async () => {
      const response = await api.get('/reports/credits', { params: filters });
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
  const prepareStatusChart = () => {
    if (!reportData?.summary) return [];
    return [
      { name: 'Lunas', value: reportData.summary.paid_count || 0 },
      { name: 'Belum Lunas', value: reportData.summary.unpaid_count || 0 },
      { name: 'Jatuh Tempo', value: reportData.summary.overdue_count || 0 },
    ].filter(item => item.value > 0);
  };

  const statusChartData = prepareStatusChart();

  // Export handlers
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportToPDF(tableRef.current, generateReportFilename('Piutang', 'pdf'));
      toast({ title: "Success", description: "PDF berhasil diexport", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal export PDF", variant: "destructive" });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData?.credits?.length) return;
    setIsExportingExcel(true);
    try {
      const columns = [
        { key: 'no_invoice', header: 'No Faktur', width: 20 },
        { key: 'sales_associate', header: 'Sales', width: 20, accessor: (item) => item.sales_associate?.name || '-' },
        { key: 'transaction_date', header: 'Tanggal', width: 15, accessor: (item) => formatDate(item.transaction_date) },
        { key: 'total_amount', header: 'Total', width: 18, accessor: (item) => formatRupiah(item.total_amount) },
        { key: 'remaining_amount', header: 'Sisa', width: 18, accessor: (item) => formatRupiah(item.remaining_amount) },
        { key: 'due_date', header: 'Jatuh Tempo', width: 15, accessor: (item) => formatDate(item.due_date) },
        { key: 'status', header: 'Status', width: 12, accessor: (item) => statusConfig[item.status]?.label || '-' },
      ];
      exportToExcel(reportData.credits, columns, generateReportFilename('Piutang', 'xlsx'), 'Piutang');
      toast({ title: "Success", description: "Excel berhasil diexport", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal export Excel", variant: "destructive" });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Laporan Piutang</h1>
            <p className="text-slate-500 font-normal mt-1">Monitoring piutang dan status pembayaran</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Laporan Piutang</h3>
                <p className="text-sm text-slate-700">
                  Laporan ini menampilkan daftar transaksi kredit yang belum lunas,
                  termasuk status jatuh tempo dan sisa pembayaran.
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
                    disabled={!reportData?.credits?.length}
                  />
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFilterCount() > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Filter aktif:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.sales_associate_id && (
                      <Badge variant="secondary" className="gap-1">
                        Sales Associate
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, sales_associate_id: '' }))} />
                      </Badge>
                    )}
                    {filters.overdue_only && (
                      <Badge variant="secondary" className="gap-1">
                        {filters.overdue_only === 'true' ? 'Jatuh Tempo' : 'Belum Jatuh Tempo'}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, overdue_only: '' }))} />
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
                  <p className="text-sm text-blue-600 font-medium">Total Piutang</p>
                  <p className="text-2xl font-semibold text-blue-900">{reportData.summary.total_credits || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Total Nilai</p>
                  <p className="text-2xl font-semibold text-purple-900">{formatRupiah(reportData.summary.total_amount || 0)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium">Total Sisa</p>
                  <p className="text-2xl font-semibold text-orange-900">{formatRupiah(reportData.summary.remaining_amount || 0)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Jatuh Tempo</p>
                  <p className="text-2xl font-semibold text-red-900">{reportData.summary.overdue_count || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {statusChartData.length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Status Pembayaran</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
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
              ) : !reportData?.credits?.length ? (
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
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Sisa</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.credits.map((credit, index) => (
                        <TableRow key={credit.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{credit.no_invoice}</TableCell>
                          <TableCell>{credit.sales_associate?.name || '-'}</TableCell>
                          <TableCell>{formatDate(credit.transaction_date)}</TableCell>
                          <TableCell className="text-right">{formatRupiah(credit.total_amount)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatRupiah(credit.remaining_amount)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {formatDate(credit.due_date)}
                              {isOverdue(credit.due_date) && credit.remaining_amount > 0 && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {credit.remaining_amount <= 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Lunas
                              </Badge>
                            ) : isOverdue(credit.due_date) ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Jatuh Tempo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className={statusConfig[credit.status]?.className}>
                                {statusConfig[credit.status]?.label || '-'}
                              </Badge>
                            )}
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
      <CreditsFilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default ReportCredits;
