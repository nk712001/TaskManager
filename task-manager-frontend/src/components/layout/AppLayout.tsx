import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import Footer from './Footer.tsx';
import styled from 'styled-components';
import type { ReactNode } from 'react';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const ContentWrapper = styled(Content)`
  margin: 0 16px 24px;
  overflow: initial;
  min-height: calc(100vh - 64px - 69px); /* Subtract header and footer height */
`;

const StyledContent = styled.div`
  padding: 24px;
  background: #fff;
  min-height: calc(100vh - 64px); /* Full height minus header */
  margin-left: 200px; /* Match sidebar width */
  margin-top: 64px; /* Match header height */
  width: calc(100% - 200px); /* Full width minus sidebar */
  position: fixed;
  overflow-y: auto; /* Enable scrolling for content */
  right: 0;
  top: 0;
`;

const StyledSidebar = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
`;

const MainContent = styled.div`
  margin-left: 200px; /* Match sidebar width */
  transition: margin 0.2s;
  min-height: 100vh;
`;

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <StyledLayout>
      <StyledSidebar>
        <Sidebar />
      </StyledSidebar>
      <MainContent>
        <Header />
        <ContentWrapper>
          <StyledContent>
            {children || <Outlet />}
          </StyledContent>
        </ContentWrapper>
        <Footer />
      </MainContent>
    </StyledLayout>
  );
};

export default AppLayout;
