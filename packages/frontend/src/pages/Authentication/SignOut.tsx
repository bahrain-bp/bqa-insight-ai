import { useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';

const SignOutButton = () => {
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
    <button
      onClick={handleSignOut}
      style={{
        padding: '8px 16px', // Reduced padding
        fontSize: '14px', // Smaller font size
        backgroundColor: '#003366',
        color: 'white',
        border: 'none',
        borderRadius: '8px', // Slightly reduced radius
        cursor: 'pointer',
      }}
    >
      Logout
    </button>
  );
};

export default SignOutButton;
