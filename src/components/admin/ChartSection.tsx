import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Registration } from '@/pages/AdminDashboard';

interface ChartSectionProps {
  registrations: Registration[];
}

const COLORS = {
  paid: 'hsl(142, 70%, 45%)',
  notPaid: 'hsl(0, 72%, 51%)',
  primary: 'hsl(215, 50%, 23%)',
  secondary: 'hsl(45, 90%, 55%)',
};

const ChartSection = ({ registrations }: ChartSectionProps) => {
  // Fee Paid vs Not Paid data
  const feeData = useMemo(() => {
    const paid = registrations.filter((r) => r.fee_paid).length;
    const notPaid = registrations.filter((r) => !r.fee_paid).length;
    return [
      { name: 'Fee Paid', value: paid, color: COLORS.paid },
      { name: 'Fee Not Paid', value: notPaid, color: COLORS.notPaid },
    ];
  }, [registrations]);

  // Section-wise registration count
  const sectionData = useMemo(() => {
    const sectionCounts: Record<string, number> = {};
    registrations.forEach((r) => {
      const section = r.section.toUpperCase();
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    });
    return Object.entries(sectionCounts)
      .map(([section, count]) => ({ section, count }))
      .sort((a, b) => a.section.localeCompare(b.section));
  }, [registrations]);

  // Daily registration trend
  const dailyData = useMemo(() => {
    const dailyCounts: Record<string, number> = {};
    registrations.forEach((r) => {
      const date = new Date(r.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .slice(-14); // Last 14 days
  }, [registrations]);

  if (registrations.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-card p-8 text-center">
        <p className="text-muted-foreground">No data available for charts</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Pie Chart - Fee Status */}
      <div className="bg-card rounded-xl shadow-card p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-foreground mb-4">Fee Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={feeData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {feeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Section-wise */}
      <div className="bg-card rounded-xl shadow-card p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Section-wise Registrations
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="section"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Daily Trend */}
      <div className="bg-card rounded-xl shadow-card p-6 animate-slide-up lg:col-span-2 xl:col-span-1">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Daily Registration Trend
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.secondary}
                strokeWidth={3}
                dot={{ fill: COLORS.secondary, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: COLORS.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
