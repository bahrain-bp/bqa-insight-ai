//import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';

const SignOutPage = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(); // Sign out the user
      navigate('/auth/signin'); // Redirect to the sign-in page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Are you sure you want to sign out?</h2>
      <button
        onClick={handleSignOut}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#1e2434',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

export default SignOutPage;
