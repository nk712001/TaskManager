import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorBgBase: '#fff',
    colorTextBase: '#222',
    borderRadius: 6,
    fontFamily: 'Inter, Arial, sans-serif',
  },
};

// Extend for dark theme in the future if needed
export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorBgBase: '#18191a',
    colorTextBase: '#f0f2f5',
    borderRadius: 6,
    fontFamily: 'Inter, Arial, sans-serif',
  },
};
