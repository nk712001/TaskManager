import { Layout, Grid } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import Footer from './Footer.tsx';
import styled from 'styled-components';
import type { ReactNode } from 'react';
import { useState } from 'react';

const { Content } = Layout;
const { useBreakpoint } = Grid;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const ContentWrapper = styled(Content)`
  margin: 0 16px 24px;
  overflow: initial;
  min-height: calc(100vh - 64px - 69px); /* Subtract header and footer height */
`;

interface StyledContentProps {
  isMobile: boolean;
}

const StyledContent = styled.div<StyledContentProps>`
  padding: 24px;
  background: var(--bg-color) !important;
  color: var(--text-color) !important;
  min-height: calc(100vh - 64px);
  margin-left: ${({ isMobile }) => (isMobile ? 0 : '200px')};
  margin-top: 64px;
  width: ${({ isMobile }) => (isMobile ? '100%' : 'calc(100% - 200px)')};
  position: ${({ isMobile }) => (isMobile ? 'relative' : 'fixed')};
  overflow-y: ${({ isMobile }) => (isMobile ? 'visible' : 'auto')};
  right: 0;
  top: 0;
  height: ${({ isMobile }) => (isMobile ? 'auto' : 'calc(100vh - 64px)')};
`;

const StyledSidebar = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
`;

interface MainContentProps {
  isMobile: boolean;
}

const MainContent = styled.div<MainContentProps>`
  margin-left: ${({ isMobile }) => (isMobile ? 0 : '200px')};
  transition: margin 0.2s;
  min-height: 100vh;
`;

interface AppLayoutProps {
  children?: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md; // md and up is desktop

  const handleSidebarOpen = () => setSidebarOpen(true);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <StyledLayout>
      <StyledSidebar>
        <Sidebar
          isMobile={isMobile}
          open={sidebarOpen}
          onClose={handleSidebarClose}
        />
      </StyledSidebar>
      <MainContent isMobile={isMobile}>
        <Header isMobile={isMobile} onMenuClick={handleSidebarOpen} />
        <ContentWrapper>
          <StyledContent isMobile={isMobile}>
            {children || <Outlet />}
          </StyledContent>
        </ContentWrapper>
        <Footer />
      </MainContent>
    </StyledLayout>
  );
};

export default AppLayout;
