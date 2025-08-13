import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import type { ReactNode } from 'react';

// Placeholder for main app/dashboard
function Dashboard() {
  return <div>Dashboard (placeholder)</div>;
}

export default function AppRouter(): ReactNode {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        {/* Add more routes here */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
