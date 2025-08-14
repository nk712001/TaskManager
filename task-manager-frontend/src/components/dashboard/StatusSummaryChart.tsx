import React from 'react';
import { Progress, Space } from 'antd';

export interface StatusData {
  status: string;
  value: number;
}

interface StatusSummaryChartProps {
  data: StatusData[];
}

const StatusSummaryChart: React.FC<StatusSummaryChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {data.map(item => (
        <div key={item.status} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: 120 }}>{item.status}</span>
          <Progress percent={Math.round((item.value / total) * 100)} showInfo format={p => `${item.value} (${p}%)`} style={{ flex: 1 }} />
        </div>
      ))}
    </Space>
  );
};

export default StatusSummaryChart;
