import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Card } from 'antd';
import styles from './BookingStatusPieChart.module.scss';

export default function BookingStatusPieChart({ data, total }) {
  return (
    <div className={styles.chartItem}>
      <Card 
        title="Thống kê đặt phòng" 
        className={styles.chartCard}
        bordered={false}
      >
        <div className={styles.contentWrapper}>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={data}
                  cx="40%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          backgroundColor: 'white',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}>
                          <p style={{ 
                            margin: '0',
                            color: data.color,
                            fontWeight: 500,
                            fontSize: '14px'
                          }}>
                            {data.name}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <text
                  x="40%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '24px',
                    fill: '#1e293b',
                    fontWeight: '500'
                  }}
                >
                  {total}
                  <tspan
                    x="40%"
                    dy="25"
                    style={{
                      fontSize: '14px',
                      fill: '#64748b',
                      fontWeight: '400'
                    }}
                  >
                    Tổng số
                  </tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.legendContainer}>
            <div className={styles.legendTitle}>Chi tiết trạng thái</div>
            {data.map((entry, index) => (
              <div key={index} className={styles.legendItem}>
                <span 
                  className={styles.legendColor} 
                  style={{ backgroundColor: entry.color }}
                />
                <span className={styles.legendText}>
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
} 