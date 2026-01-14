import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingBag, Filter, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PurchasesFilterDialog from '@/components/dialogs/reports/PurchasesFilterDialog';
import DateRangePicker from '@/components/reports/DateRangePicker';
import ExportButtons from '@/components/reports/ExportButtons';
import { formatRupiah, formatDate } from '@/utils/formatters';
import { exportToPDF, exportToExcel, generateReportFilename } from '@/utils/exportUtils';
import { useToast } from '@/components/ui/use-toast';

const statusConfig = {
  0: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  1: { label: 'Selesai', className: 'bg-green-50 text-green-700 border-green-200' },
  2: { label: 'Dibatalkan', className: 'bg-red-50 text-red-700 border-red-200' },
};

const ReportPurchases = () => {
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
    queryKey: ['reportPurchases', filters],
    queryFn: async () => {
      const response = await api.get('/reports/purchases', { params: filters });
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

  // Prepare chart data - group by publisher
  const prepareChartData = () => {
    if (!reportData?.purchases) return [];

    const groupedByPublisher = {};
    reportData.purchases.forEach(purchase => {
      const publisherName = purchase.publisher?.name || 'Lainnya';
      if (!groupedByPublisher[publisherName]) {
        groupedByPublisher[publisherName] = { name: publisherName, total: 0, count: 0 };
      }
      groupedByPublisher[publisherName].total += purchase.total_amount || 0;
      groupedByPublisher[publisherName].count += 1;
    });

    return Object.values(groupedByPublisher)
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

  const handleExportExcel = () => {
    if (!reportData?.purchases?.length) return;
    setIsExportingExcel(true);
    try {
      const columns = [
        { key: 'no_po', header: 'No PO', width: 20 },
        { key: 'publisher', header: 'Penerbit', width: 25, accessor: (item) => item.publisher?.name || '-' },
        { key: 'purchase_date', header: 'Tanggal', width: 15, accessor: (item) => formatDate(item.purchase_date) },
        { key: 'total_items', header: 'Total Item', width: 12 },
        { key: 'total_amount', header: 'Total Nilai', width: 18, accessor: (item) => formatRupiah(item.total_amount) },
        { key: 'status', header: 'Status', width: 12, accessor: (item) => statusConfig[item.status]?.label || '-' },
      ];
      exportToExcel(reportData.purchases, columns, generateReportFilename('Pembelian', 'xlsx'), 'Pembelian');
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
                    disabled={!reportData?.purchases?.length}
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
                        Penerbit
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
                  <p className="text-2xl font-semibold text-blue-900">{reportData.summary.total_purchases || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Total Nilai</p>
                  <p className="text-2xl font-semibold text-purple-900">{formatRupiah(reportData.summary.total_amount || 0)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Selesai</p>
                  <p className="text-2xl font-semibold text-green-900">{reportData.summary.completed_count || 0}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-900">{reportData.summary.pending_count || 0}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Pembelian per Penerbit</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(value) => formatRupiah(value)} />
                  <Tooltip formatter={(value) => formatRupiah(value)} />
                  <Legend />
                  <Bar dataKey="total" name="Total Pembelian" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          <CardContent className="pt-6">
            <div ref={tableRef}>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : !reportData?.purchases?.length ? (
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
                        <TableHead>Penerbit</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-center">Total Item</TableHead>
                        <TableHead className="text-right">Total Nilai</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.purchases.map((purchase, index) => (
                        <TableRow key={purchase.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{purchase.no_po}</TableCell>
                          <TableCell>{purchase.publisher?.name || '-'}</TableCell>
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
