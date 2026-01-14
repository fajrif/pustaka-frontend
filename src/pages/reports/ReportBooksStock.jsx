import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Filter, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import BooksStockFilterDialog from '@/components/dialogs/reports/BooksStockFilterDialog';
import ExportButtons from '@/components/reports/ExportButtons';
import { formatRupiah } from '@/utils/formatters';
import { exportToPDF, exportToExcel, generateReportFilename } from '@/utils/exportUtils';
import { useToast } from '@/components/ui/use-toast';

const ReportBooksStock = () => {
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
    queryKey: ['reportBooksStock', filters],
    queryFn: async () => {
      const response = await api.get('/reports/books-stock', { params: filters });
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
  const prepareChartData = () => {
    if (!reportData?.books) return [];

    const groupedByType = {};
    reportData.books.forEach(book => {
      const typeName = book.jenis_buku?.name || 'Lainnya';
      if (!groupedByType[typeName]) {
        groupedByType[typeName] = { name: typeName, stock: 0, lowStock: 0 };
      }
      groupedByType[typeName].stock += book.stock || 0;
      if (book.stock < (filters.low_stock_threshold || 10)) {
        groupedByType[typeName].lowStock += 1;
      }
    });

    return Object.values(groupedByType).slice(0, 10);
  };

  const chartData = prepareChartData();

  // Export handlers
  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setIsExportingPDF(true);
    try {
      await exportToPDF(tableRef.current, generateReportFilename('StokBuku', 'pdf'));
      toast({ title: "Success", description: "PDF berhasil diexport", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal export PDF", variant: "destructive" });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    if (!reportData?.books?.length) return;
    setIsExportingExcel(true);
    try {
      const columns = [
        { key: 'code', header: 'Kode', width: 15 },
        { key: 'name', header: 'Nama Buku', width: 30 },
        { key: 'jenis_buku', header: 'Jenis', width: 15, accessor: (item) => item.jenis_buku?.name || '-' },
        { key: 'jenjang_studi', header: 'Jenjang', width: 15, accessor: (item) => item.jenjang_studi?.name || '-' },
        { key: 'curriculum', header: 'Kurikulum', width: 15, accessor: (item) => item.curriculum?.name || '-' },
        { key: 'stock', header: 'Stok', width: 10 },
        { key: 'price', header: 'Harga', width: 15, accessor: (item) => formatRupiah(item.price) },
      ];
      exportToExcel(reportData.books, columns, generateReportFilename('StokBuku', 'xlsx'), 'Stok Buku');
      toast({ title: "Success", description: "Excel berhasil diexport", variant: "success" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal export Excel", variant: "destructive" });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const threshold = filters.low_stock_threshold || 10;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Laporan Stok Buku</h1>
            <p className="text-slate-500 font-normal mt-1">Monitoring stok buku dan identifikasi stok rendah</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Tentang Laporan Stok Buku</h3>
                <p className="text-sm text-slate-700">
                  Laporan ini menampilkan daftar semua buku beserta jumlah stok saat ini.
                  Buku dengan stok di bawah batas akan ditandai sebagai stok rendah.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters & Export */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilterDialog(true)}
                    className="gap-2 relative"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    {getActiveFilterCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </Button>
                </div>
                <ExportButtons
                  onExportPDF={handleExportPDF}
                  onExportExcel={handleExportExcel}
                  isExportingPDF={isExportingPDF}
                  isExportingExcel={isExportingExcel}
                  disabled={!reportData?.books?.length}
                />
              </div>

              {/* Active Filters */}
              {getActiveFilterCount() > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-500">Filter aktif:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {filters.jenis_buku_id && (
                      <Badge variant="secondary" className="gap-1">
                        Jenis Buku
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, jenis_buku_id: '' }))} />
                      </Badge>
                    )}
                    {filters.jenjang_studi_id && (
                      <Badge variant="secondary" className="gap-1">
                        Jenjang Studi
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, jenjang_studi_id: '' }))} />
                      </Badge>
                    )}
                    {filters.curriculum_id && (
                      <Badge variant="secondary" className="gap-1">
                        Kurikulum
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, curriculum_id: '' }))} />
                      </Badge>
                    )}
                    {filters.kelas && (
                      <Badge variant="secondary" className="gap-1">
                        Kelas: {filters.kelas}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, kelas: '' }))} />
                      </Badge>
                    )}
                    {filters.low_stock_threshold && (
                      <Badge variant="secondary" className="gap-1">
                        Batas Stok: {filters.low_stock_threshold}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, low_stock_threshold: '' }))} />
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
                  <p className="text-sm text-blue-600 font-medium">Total Buku</p>
                  <p className="text-2xl font-semibold text-blue-900">{reportData.summary.total_books || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Total Stok</p>
                  <p className="text-2xl font-semibold text-green-900">{reportData.summary.total_stock || 0}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-medium">Stok Rendah</p>
                  <p className="text-2xl font-semibold text-red-900">{reportData.summary.low_stock_count || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Total Nilai</p>
                  <p className="text-2xl font-semibold text-purple-900">{formatRupiah(reportData.summary.total_value || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="p-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Stok per Jenis Buku</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stock" name="Total Stok" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Data Table */}
          <CardContent className="pt-6">
            <div ref={tableRef}>
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : !reportData?.books?.length ? (
                <div className="text-center py-8 text-slate-500">
                  Tidak ada data untuk ditampilkan
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">No</TableHead>
                        <TableHead className="w-[100px]">Kode</TableHead>
                        <TableHead>Nama Buku</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Jenjang</TableHead>
                        <TableHead>Kurikulum</TableHead>
                        <TableHead className="text-center">Stok</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.books.map((book, index) => (
                        <TableRow key={book.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {book.jenis_buku?.code || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{book.name}</TableCell>
                          <TableCell>{book.jenis_buku?.name || '-'}</TableCell>
                          <TableCell>{book.jenjang_studi?.name || '-'}</TableCell>
                          <TableCell>{book.curriculum?.name || '-'}</TableCell>
                          <TableCell className="text-center font-semibold">{book.stock || 0}</TableCell>
                          <TableCell className="text-right">{formatRupiah(book.price)}</TableCell>
                          <TableCell className="text-center">
                            {(book.stock || 0) < threshold ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Rendah
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Aman
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
      <BooksStockFilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default ReportBooksStock;
