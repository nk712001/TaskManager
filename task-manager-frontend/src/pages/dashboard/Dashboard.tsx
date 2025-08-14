import { Card, Typography } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Title, Paragraph } = Typography;

const StyledCard = styled(Card)`
  text-align: center;
  margin-top: 24px;
`;

const Dashboard = () => {
  return (
    <div>
      <Title level={2}>Welcome to Task Manager</Title>
      <Paragraph>Get started by creating a new project or task.</Paragraph>
      
      <StyledCard>
        <SmileOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <Title level={4}>Your Dashboard is Ready!</Title>
        <p>This is a placeholder for your dashboard content.</p>
      </StyledCard>
    </div>
  );
};

export default Dashboard;
