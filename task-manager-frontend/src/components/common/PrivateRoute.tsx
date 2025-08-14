import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Spin } from 'antd';

interface PrivateRouteProps {
  children?: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading, setUser, setTokens } = useAuth();
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);

  // Check for stored auth data on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('taskmanager_auth') || 
                        sessionStorage.getItem('taskmanager_auth');
        
        if (authData) {
          const parsedAuth = JSON.parse(authData);
          console.log('Loaded auth state from storage:', parsedAuth);
          
          // Update auth context if not already set
          if (parsedAuth.user && parsedAuth.tokens?.accessToken) {
            setUser(parsedAuth.user);
            setTokens(parsedAuth.tokens);
          } else {
            console.log('Invalid auth data format');
            // Clear invalid auth data
            localStorage.removeItem('taskmanager_auth');
            sessionStorage.removeItem('taskmanager_auth');
          }
        } else {
          console.log('No auth data found in storage');
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        // Clear any malformed auth data
        localStorage.removeItem('taskmanager_auth');
        sessionStorage.removeItem('taskmanager_auth');
      } finally {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [setUser, setTokens]);

  // Show loading spinner while checking auth state
  if (isLoading || !authChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // If no user is found after checking auth state, redirect to login
  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a user, render the protected content
  return children || <Outlet />;
}
