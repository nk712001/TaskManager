import './theme-switch.css';
import AppRouter from './router';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ConfigProvider } from 'antd';
import { lightTheme, darkTheme } from './theme';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

const queryClient = new QueryClient();

function AppContent() {
  const { theme } = useTheme();
  const antdTheme = theme === 'dark' ? darkTheme : lightTheme;
  return (
    <ConfigProvider theme={antdTheme}>
      <StyledThemeProvider theme={{ ...antdTheme.token }}>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </StyledThemeProvider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
