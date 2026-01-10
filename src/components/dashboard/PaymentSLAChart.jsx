import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { calculateSLAStatus } from "@/utils/helpers/TransactionHelper";
import { useRange } from "@/hooks/useRange";
import { randomPastDate, randomSLADate } from "@/utils/generators";

export default function PaymentSLAChart() {

  // Generate transactions data
  const transactions = useRange(10).map((i) => {
    const tanggal_po_tagihan = randomPastDate(90);
    const tanggal_transaksi = randomSLADate(tanggal_po_tagihan);

    return {
      id: i + 1,
      tanggal_transaksi,
      tanggal_po_tagihan,
    };
  });

  // Calculate SLA statistics
  const slaStats = transactions.reduce((acc, tx) => {
    if (!tx.tanggal_po_tagihan) return acc;

    const slaStatus = calculateSLAStatus(tx.tanggal_po_tagihan, tx.tanggal_transaksi);
    acc[slaStatus] = (acc[slaStatus] || 0) + 1;
    return acc;
  }, {});

  const totalWithSLA = Object.values(slaStats).reduce((sum, val) => sum + val, 0);

  const pieData = [
    {
      name: 'Tepat Waktu',
      value: slaStats.ontime || 0,
      color: '#10b981',
      icon: CheckCircle2
    },
    {
      name: 'H+1',
      value: slaStats['h+1'] || 0,
      color: '#f59e0b',
      icon: Clock
    },
    {
      name: 'Terlambat',
      value: slaStats.late || 0,
      color: '#ef4444',
      icon: AlertTriangle
    }
  ];

  const complianceRate = totalWithSLA > 0
    ? ((slaStats.ontime || 0) / totalWithSLA * 100).toFixed(1)
    : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0]) {
      const data = payload[0];
      const value = data?.value || 0;
      const name = data?.name || '';
      const percentage = totalWithSLA > 0 ? ((value / totalWithSLA) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900">{name}</p>
          <p className="text-sm text-slate-600">
            {value} transaksi ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-semibold">Ketepatan Pembayaran Sales</CardTitle>
        <p className="text-sm text-slate-500">Statistik SLA pembayaran sales berdasarkan tanggal PO/Tagihan</p>
      </CardHeader>
      <CardContent className="pt-6">
        {totalWithSLA === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Belum ada data transaksi dengan tanggal PO/Tagihan
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                <p className="text-sm text-slate-600 mb-1">Tingkat Kepatuhan SLA</p>
                <p className="text-4xl font-semibold text-green-600">{complianceRate}%</p>
                <p className="text-xs text-slate-500 mt-1">
                  {slaStats.ontime || 0} dari {totalWithSLA} transaksi tepat waktu
                </p>
              </div>

              <div className="space-y-2">
                {pieData.map((item, idx) => {
                  const IconComponent = item.icon;
                  const percentage = totalWithSLA > 0 ? ((item.value / totalWithSLA) * 100).toFixed(1) : 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <IconComponent className="w-5 h-5" style={{ color: item.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">{percentage}% dari total</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold" style={{ color: item.color }}>
                          {item.value}
                        </p>
                        <p className="text-xs text-slate-500">transaksi</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
