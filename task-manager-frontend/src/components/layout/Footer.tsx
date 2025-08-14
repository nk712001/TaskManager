import { Layout, Typography } from 'antd';
import styled from 'styled-components';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const StyledFooter = styled(AntFooter)`
  text-align: center;
  background: #f0f2f5;
  padding: 16px 50px;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <StyledFooter>
      <Text type="secondary">
        © {currentYear} Task Manager. All rights reserved.
      </Text>
    </StyledFooter>
  );
};

export default Footer;
