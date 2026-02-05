import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface MetricsChartProps {
  data: any[];
  metrics: string[];
  height?: number;
  type?: 'line' | 'area';
}

const metricColors: Record<string, string> = {
  cost: '#ef4444',
  conversions: '#10b981',
  clicks: '#3b82f6',
  impressions: '#8b5cf6',
  ctr: '#f59e0b',
  roas: '#06b6d4'
};

const metricLabels: Record<string, string> = {
  cost: 'Cost ($)',
  conversions: 'Conversions',
  clicks: 'Clicks',
  impressions: 'Impressions',
  ctr: 'CTR (%)',
  roas: 'ROAS'
};

export default function MetricsChart({
  data,
  metrics,
  height = 300,
  type = 'line'
}: MetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Ortak bileşenleri bir fonksiyon olarak tanımlayalım
  const renderGridAndAxes = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
      <YAxis stroke="#6b7280" fontSize={12} />
      <Tooltip
        contentStyle={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}
      />
      <Legend />
    </>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'area' ? (
        <AreaChart data={data}>
          {renderGridAndAxes()}
          {metrics.map((metric) => (
            <Area
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={metricColors[metric] || '#3b82f6'}
              fill={metricColors[metric] || '#3b82f6'}
              fillOpacity={0.3}
              strokeWidth={2}
              name={metricLabels[metric] || metric}
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart data={data}>
          {renderGridAndAxes()}
          {metrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={metricColors[metric] || '#3b82f6'}
              strokeWidth={2}
              name={metricLabels[metric] || metric}
              dot={false}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}