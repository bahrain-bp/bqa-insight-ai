import { useEffect, useState } from 'react'; // Importing React hooks for state and side effects
import { Navigate, useLocation } from 'react-router-dom'; // Importing necessary components from react-router-dom for navigation and location tracking
import { getCurrentUser } from '@aws-amplify/auth'; // Importing Amplify's method to get the current authenticated user

// Interface to define the expected props for the ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode; // This represents any child components that are passed to the ProtectedRoute
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // State to track authentication status
  // 'loading' means we are checking the auth status
  // 'authenticated' means the user is logged in
  // 'unauthenticated' means the user is not logged in
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  // useLocation hook to track the current location (URL path) so we can redirect the user after sign-in
  const location = useLocation();

  // useEffect hook to check the authentication status when the component mounts
  useEffect(() => {
    checkAuth(); // Call checkAuth function to verify user's authentication status
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  // Function to check if the user is authenticated
  const checkAuth = async () => {
    try {
      // Attempt to get the current authenticated user using Amplify's getCurrentUser method
      await getCurrentUser();
      setAuthStatus('authenticated'); // If user is found, set authStatus to 'authenticated'
    } catch (error) {
      // If there's an error (i.e., no user is authenticated), set authStatus to 'unauthenticated'
      setAuthStatus('unauthenticated');
    }
  };

  // Loading state: Show a loading spinner while we are checking the auth status
  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen"> {/* Center the loading spinner on the page */}
        <div className="text-center">
          {/* A simple spinner component */}
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading...</p> {/* Display loading message */}
        </div>
      </div>
    );
  }

  // If the user is unauthenticated, redirect them to the sign-in page
  if (authStatus === 'unauthenticated') {
    return (
      <Navigate 
        to="/auth/signin" // Redirect to the sign-in page
        state={{ from: location.pathname }} // Store the attempted page URL so that the user can be redirected back after signing in
        replace // Replace the current entry in the history stack to prevent back navigation to the protected page
      />
    );
  }

  // If the user is authenticated, render the child components passed to the ProtectedRoute
  return <>{children}</>;
};

export default ProtectedRoute;
