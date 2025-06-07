import {  ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { Card } from 'antd';
import styles from './MonthlyRevenueChart.module.scss';

export default function MonthlyRevenueChart({ data }) {
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
  };

  // Calculate appropriate ticks based on data range
  const calculateTicks = (data) => {
    if (!data || data.length === 0) return [0, 100000, 200000, 500000, 1000000];
    
    const maxRevenue = Math.max(...data.map(item => item.revenue));
    
    if (maxRevenue <= 1000000) {
      return [0, 100000, 200000, 500000, 1000000];
    } else if (maxRevenue <= 5000000) {
      return [0, 1000000, 2000000, 3000000, 4000000, 5000000];
    } else if (maxRevenue <= 10000000) {
      return [0, 2000000, 4000000, 6000000, 8000000, 10000000];
    } else {
      const step = Math.ceil(maxRevenue / 5000000) * 1000000;
      return [0, step, step * 2, step * 3, step * 4, step * 5];
    }
  };

  return (
    <div className={styles.chartItem}>
      <Card 
        title="Doanh thu theo tháng" 
        className={styles.chartCard}
        bordered={false}
      >
        <div className={styles.chartDescription}>
          Thống kê doanh thu trong 6 tháng gần đây
        </div>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={5}
              />
              <YAxis 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dx={-5}
                tickFormatter={formatYAxis}
                ticks={calculateTicks(data)}
              />
              <Tooltip 
                contentStyle={{
                  background: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  padding: '8px'
                }}
                formatter={(value) => [
                  `${new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(value)}`,
                  'Doanh thu'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 