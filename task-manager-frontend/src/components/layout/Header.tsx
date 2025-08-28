import { Layout, Dropdown, Avatar, Menu } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';

const { Header: AntHeader } = Layout;

const StyledHeader = styled(AntHeader)`
  padding: 0 24px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: fixed;
  width: calc(100% - 200px);
  z-index: 9;
  right: 0;
  height: 64px;
  line-height: 64px;
`;

import { MenuUnfoldOutlined } from '@ant-design/icons';
import type { FC } from 'react';

interface HeaderProps {
  isMobile: boolean;
  onMenuClick: () => void;
}

const Header: FC<HeaderProps> = ({ isMobile, onMenuClick }) => {
  const { logout, user } = useAuth();

  const menu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <StyledHeader style={{ width: isMobile ? '100%' : 'calc(100% - 200px)' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isMobile && (
          <MenuUnfoldOutlined
            style={{ fontSize: 22, marginRight: 16, cursor: 'pointer' }}
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          />
        )}
        <div className="logo" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          Task Manager
        </div>
      </div>
      <div className="user-actions">
        <Dropdown overlay={menu} trigger={['click']}>
          <div style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <span>{user?.name || 'User'}</span>
          </div>
        </Dropdown>
      </div>
    </StyledHeader>
  );
};

export default Header;
