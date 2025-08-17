import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Spin } from 'antd';
import type { AuthUser } from '../../contexts/AuthContext';
import { parseJwt } from '../../utils/jwt';

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
          if (parsedAuth.tokens?.accessToken) {
            // Parse JWT to get user info
            const decodedToken = parseJwt(parsedAuth.tokens.accessToken);
            console.log('Decoded JWT from storage:', decodedToken);
            
            if (decodedToken) {
              // Map JWT roles to our app's role format (ensuring type safety)
              const mapRole = (roles: unknown = []): 'admin' | 'user' => {
                const rolesArray = Array.isArray(roles) ? roles as string[] : [];
                return rolesArray.includes('ROLE_ADMIN') ? 'admin' : 'user';
              };
              
              // Create user object with all required fields, including userId from the token
              const userFromToken: AuthUser = {
                id: decodedToken.userId || 'unknown',
                userId: decodedToken.userId || 1, // Use the numeric userId from the token
                email: decodedToken.sub || '', // Using sub (email) as the email
                name: decodedToken.sub?.split('@')[0] || 'User',
                role: mapRole(decodedToken.roles)
              };
              
              console.log('Created user with userId:', userFromToken.userId);
              
              console.log('Mapped user from token:', userFromToken);
              
              // Update user with data from token
              setUser(userFromToken);
              setTokens(parsedAuth.tokens);
              
              // Update storage with complete user data
              const updatedAuth = {
                ...parsedAuth,
                user: userFromToken
              };
              
              const storage = localStorage.getItem('taskmanager_auth') ? localStorage : sessionStorage;
              storage.setItem('taskmanager_auth', JSON.stringify(updatedAuth));
              
              return;
            }
          }
          
          // If we get here, the token was invalid or missing required data
          console.log('Invalid or expired auth data');
          localStorage.removeItem('taskmanager_auth');
          sessionStorage.removeItem('taskmanager_auth');
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
