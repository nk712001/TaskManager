import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  overflow: auto;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  box-shadow: 2px 0 8px 0 rgba(29, 35, 41, 0.05);
  z-index: 10;
  
  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
  }
`;

const LogoContainer = styled.div`
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #001529;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
`;

import { Drawer } from 'antd';
import type { FC } from 'react';

interface SidebarProps {
  isMobile: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isMobile, open, onOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
    },
    {
      key: '/tasks',
      icon: <CheckSquareOutlined />,
      label: 'Tasks',
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Users',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  if (isMobile) {
    return (
      <Drawer
        title={<LogoContainer>TM</LogoContainer>}
        placement="left"
        closable
        onClose={onClose}
        open={open}
        bodyStyle={{ padding: 0 }}
        width={200}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ height: '100%', borderRight: 0 }}
          items={menuItems}
          onClick={(item) => {
            navigate(item.key);
            onClose();
          }}
        />
      </Drawer>
    );
  }

  return (
    <StyledSider width={200} theme="light">
      <LogoContainer>TM</LogoContainer>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: '100%', borderRight: 0 }}
        items={menuItems}
        onClick={(item) => navigate(item.key)}
      />
    </StyledSider>
  );
};

export default Sidebar;
