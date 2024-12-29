import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '@aws-amplify/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      await getCurrentUser();
      setAuthStatus('authenticated');
    } catch (error) {
      setAuthStatus('unauthenticated');
    }
  };

  if (authStatus === 'loading') {
    // You can replace this with a proper loading component
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    // Redirect to signin while saving the attempted URL
    return (
      <Navigate 
        to="/auth/signin" 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;