import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package, Boxes, AlertTriangle, Wallet, ShoppingCart, ShoppingBag } from 'lucide-react';
import BudgetTrendChart from "@/components/dashboard/BudgetTrendChart";
import PaymentSLAChart from "@/components/dashboard/PaymentSLAChart";
import { formatShortRupiah } from '@/utils/formatters';

const Dashboard = () => {

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['dashboardBooksStock'],
    queryFn: async () => {
      const response = await api.get('/reports/books-stock');
      return response.data;
    },
  });

  const summary = reportData?.summary || {};

  const cards = [
    {
      title: "Total Buku",
      value: isLoading ? "..." : (summary.total_books || 0).toLocaleString('id-ID'),
      icon: Package,
      bgColor: "bg-blue-500",
      trend: "Jumlah judul buku",
      trendColor: "text-blue-600"
    },
    {
      title: "Total Stok",
      value: isLoading ? "..." : (summary.total_stock || 0).toLocaleString('id-ID'),
      icon: Boxes,
      bgColor: "bg-green-500",
      trend: "Total eksemplar",
      trendColor: "text-green-600"
    },
    {
      title: "Stok Rendah",
      value: isLoading ? "..." : (summary.low_stock_count || 0).toLocaleString('id-ID'),
      icon: AlertTriangle,
      bgColor: "bg-orange-500",
      trend: summary.low_stock_count > 0 ? "Perlu perhatian" : "Semua aman",
      trendColor: summary.low_stock_count > 0 ? "text-orange-600" : "text-green-600"
    },
    {
      title: "Total Nilai",
      value: isLoading ? "..." : formatShortRupiah(summary.total_value || 0),
      icon: Wallet,
      bgColor: "bg-purple-500",
      trend: "Nilai inventory",
      trendColor: "text-purple-600"
    }
  ];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 font-normal mt-1">Monitoring Stok Buku</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <Card key={index} className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${card.bgColor} rounded-full opacity-10`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2.5 rounded-xl ${card.bgColor} bg-opacity-20`}>
                    <card.icon className={`w-5 h-5 ${card.bgColor.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900 mb-1">
                  {card.value}
                </div>
                <p className={`text-sm font-medium ${card.trendColor}`}>
                  {card.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <Link to="/sales-transactions">
              <Button variant="outline" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Transaksi Penjualan
              </Button>
            </Link>
            <Link to="/purchase-transactions">
              <Button variant="outline" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Transaksi Pembelian
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
