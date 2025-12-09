import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parseISO, startOfMonth, eachMonthOfInterval } from "date-fns";
import { id } from "date-fns/locale";
import { formatRupiah } from "@/utils/formatters";
import { randomPrice } from "@/utils/generators";

export default function BudgetTrendChart({ sales }) {

  // Generate monthly data
  const generateMonthlyData = () => {
    // if (!project?.tanggal_mulai || !project?.jangka_waktu) return [];

    const project = {
      tanggal_mulai: "2025-11-14T00:00:00Z",
      jangka_waktu: 5
    }

    const startDate = parseISO(project.tanggal_mulai);
    const months = eachMonthOfInterval({
      start: startDate,
      end: new Date(startDate.getFullYear(), startDate.getMonth() + project.jangka_waktu - 1, 1)
    });

    return months.map(month => {
      const periodeBulan = format(month, 'yyyy-MM');

      // Get sales for this month
      const totalBudget = randomPrice(50000000, 120000000);

      // Get credit for this month
      const totalActual = randomPrice(100000000, 450000000);

      return {
        bulan: format(month, 'MMM yy', { locale: id }),
        tunai: totalBudget / 1000000, // Convert to millions
        kredit: totalActual / 1000000,
        variance: (totalBudget - totalActual) / 1000000
      };
    });
  };

  const monthlyData = generateMonthlyData();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length >= 2) {
      const bulan = payload[0]?.payload?.bulan || '';
      const tunai = payload[0]?.value || 0;
      const kredit = payload[1]?.value || 0;
      const variance = tunai - kredit;

      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900 mb-2">{bulan}</p>
          <p className="text-sm text-blue-600">
            Tunai: {formatRupiah(tunai * 1000000)}
          </p>
          <p className="text-sm text-green-600">
            Kredit: {formatRupiah(kredit * 1000000)}
          </p>
          <p className={`text-sm ${variance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
            Selisih: {formatRupiah(variance * 1000000)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-semibold">Trend Penjualan vs Kredit</CardTitle>
        <p className="text-sm text-slate-500">Perbandingan penjualan tunai dan kredit per bulan (dalam juta rupiah)</p>
      </CardHeader>
      <CardContent className="pt-6">
        {monthlyData.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Belum ada data untuk ditampilkan
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="bulan"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={{ stroke: '#e2e8f0' }}
                label={{ value: 'Jutaan (Rp)', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar
                dataKey="tunai"
                fill="#3b82f6"
                name="Tunai"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="kredit"
                fill="#10b9b6"
                name="Kredit"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
