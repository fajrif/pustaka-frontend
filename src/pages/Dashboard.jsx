import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Wallet, TrendingUp, AlertCircle, FolderKanban } from 'lucide-react';
import BudgetTrendChart from "@/components/dashboard/BudgetTrendChart";
import PaymentSLAChart from "@/components/dashboard/PaymentSLAChart";
import { formatRupiah, formatShortRupiah } from '@/utils/formatters';

const Dashboard = () => {

  const calculateMetrics = () => {
    const totalSales = 2437000000;
    const totalSalesCount = 257;
    const totalCredit = 1653000000;
    const remainingCredit = 0;
    const percentageCredit = 0;
    const activeProjects = 0;
    const alertCount = 56;

    return {
      totalSales,
      totalSalesCount,
      totalCredit,
      remainingCredit,
      percentageCredit,
      activeProjects,
      alertCount,
    };
  };

  const metrics = calculateMetrics();

  const cards = [
    {
      title: "Total Penjualan",
      value: formatShortRupiah(metrics.totalSales),
      icon: Wallet,
      bgColor: "bg-blue-500",
      trend: `${metrics.totalSalesCount} sales`,
      trendColor: "text-blue-600"
    },
    {
      title: "Total Piutang",
      value: formatShortRupiah(metrics.totalCredit),
      icon: TrendingUp,
      bgColor: "bg-green-500",
      trend: `${metrics.percentageCredit.toFixed(1)}% belum terbayar`,
      trendColor: metrics.percentage > 80 ? "text-orange-600" : "text-green-600"
    },
    {
      title: "Total Sisa Kredit",
      value: formatShortRupiah(metrics.remainingCredit),
      icon: FolderKanban,
      bgColor: "bg-purple-500",
      trendColor: "text-purple-600"
    },
    {
      title: "Alert Tagihan",
      value: `${metrics.alertCount} tagihan`,
      icon: AlertCircle,
      bgColor: "bg-orange-500",
      trend: metrics.alertCount > 0 ? "Perlu perhatian" : "Semua aman",
      trendColor: metrics.alertCount > 0 ? "text-orange-600" : "text-green-600"
    }
  ];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 font-normal mt-1">Monitoring Transaksi Penjualan Buku</p>
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
            <Link to="/transactions">
              <Button variant="outline">Lihat Semua Transaksi</Button>
            </Link>
            <Link to="/credit-transactions">
              <Button variant="outline">Lihat Semua Piutang</Button>
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BudgetTrendChart />
            <PaymentSLAChart />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
