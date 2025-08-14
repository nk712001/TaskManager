import React from 'react';
import { Card, Col, Row } from 'antd';

interface OverviewData {
  title: string;
  value: number;
  color?: string;
}

interface OverviewCardsProps {
  data: OverviewData[];
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ data }) => (
  <Row gutter={16}>
    {data.map((item) => (
      <Col xs={24} sm={12} md={6} key={item.title} style={{ marginBottom: 16 }}>
        <Card bordered style={{ borderLeft: `4px solid ${item.color || '#1890ff'}` }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{item.title}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: item.color || '#1890ff' }}>{item.value}</div>
        </Card>
      </Col>
    ))}
  </Row>
);

export default OverviewCards;
