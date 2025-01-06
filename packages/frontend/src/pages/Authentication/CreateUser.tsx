import React, { useState, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

// Defining the structure of the form fields
interface FormFields {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

// Defining the properties of the component, including setUser function and user data
interface CreateUserBQAProps {
  setUser: (newUser: any) => void;
  user: {
    email: string;
    name: string;
  };
}

const CreateUserBQA: React.FC<CreateUserBQAProps> = ({ setUser }) => {
  // State hooks for managing form fields, loading status, and error/success messages
  const [formFields, setFormFields] = useState<FormFields>({
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
  });
  const [isCodeSent, setIsCodeSent] = useState(false); // To track if the verification code was sent
  const [errorMessage, setErrorMessage] = useState<string>(''); // To track error messages
  const [successMessage, setSuccessMessage] = useState<string>(''); // To track success messages
  const [isLoading, setIsLoading] = useState<boolean>(false); // To track the loading state
  const navigate = useNavigate(); // Navigation hook for routing

  // Handles changes in form fields
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFields = {
      ...formFields,
      [e.target.name]: e.target.value // Dynamically updates the form field based on name
    };
    setFormFields(newFields);
    
    // Handle email validation error message when email changes
    if (e.target.name === 'email') {
      if (!validateEmail(e.target.value)) {
        setErrorMessage('Only @bqa.gov.bh email addresses are allowed to register');
      } else {
        setErrorMessage('');
      }
    }
  };

  // Email validation: checks if the email is in a valid format and belongs to the allowed domain
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic regex for email format validation
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Only allows email addresses with the domain @bqa.gov.bh (currently commented out)
    return true;
  };

  // Validates the form when registering, checking email, password, and confirmation password
  const isInitialFormValid = () => {
    return validateEmail(formFields.email) && 
           formFields.password.length >= 8 && // Password length validation
           formFields.password === formFields.confirmPassword; // Password match validation
  };

  // Validates the confirmation form for entering the verification code
  const isConfirmationFormValid = () => {
    return formFields.code.length > 0; // Code must be entered
  };

  // Handles the form submission for creating the account (sign-up)
  const handleInitialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    // Additional check before submitting: ensures email is valid
    if (!validateEmail(formFields.email)) {
      setErrorMessage('Only @bqa.gov.bh email addresses are allowed to register');
      setIsLoading(false);
      return;
    }

    try {
      // Calling AWS Amplify's signUp function to create a new user account
      await signUp({
        username: formFields.email,
        password: formFields.password,
        options: {
          userAttributes: {
            email: formFields.email,
          },
          autoSignIn: true // Automatically signs in the user after successful account creation
        }
      });

      setSuccessMessage('Verification code sent to your email.');
      setIsCodeSent(true); // Set to true to render the confirmation form
    } catch (error) {
      console.error('Error details:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred during sign up');
    } finally {
      setIsLoading(false); // Stop loading animation
    }
  };

  // Handles the form submission for confirming the user's account with the verification code
  const handleConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
  
    try {
      // Calling AWS Amplify's confirmSignUp function to confirm the user's sign-up
      await confirmSignUp({
        username: formFields.email,
        confirmationCode: formFields.code
      });
  
      // Updating the user state after successful confirmation
      setUser({ email: formFields.email, name: '' });
  
      setSuccessMessage('Account created successfully! Redirecting to login...');
      // Redirect to the login page after a successful confirmation
      setTimeout(() => {
        navigate('/Auth/SignIn');
      }, 3000);
    } catch (error) {
      console.error('Error details:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error confirming sign up');
    } finally {
      setIsLoading(false); // Stop loading animation
    }
  };

  // Renders the initial form to create an account
  const renderInitialForm = () => (
    <form onSubmit={handleInitialSubmit}>
      <div className="mb-6">
        <label className="mb-2.5 block font-medium text-black dark:text-white">
          Email
        </label>
        <div className="relative">
          <input
            type="email"
            name="email"
            placeholder="Enter your @bqa.gov.bh email"
            className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            value={formFields.email}
            onChange={handleInputChange} // Handle email input change
            disabled={isLoading}
          />
        </div>
        <small className="text-gray-500 mt-1">Only @bqa.gov.bh email addresses are allowed</small>
      </div>

      <div className="mb-6">
        <label className="mb-2.5 block font-medium text-black dark:text-white">
          Password
        </label>
        <div className="relative">
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            value={formFields.password}
            onChange={handleInputChange} // Handle password input change
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-2.5 block font-medium text-black dark:text-white">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            value={formFields.confirmPassword}
            onChange={handleInputChange} // Handle confirm password input change
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mb-5">
        <input
          type="submit"
          value={isLoading ? "Creating Account..." : "Create Account"}
          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90 disabled:opacity-50"
          disabled={isLoading || !isInitialFormValid()} // Disable button if the form is not valid
        />
      </div>
    </form>
  );

  // Renders the confirmation form where the user enters the verification code
  const renderConfirmationForm = () => (
    <form onSubmit={handleConfirmation}>
      <div className="mb-6">
        <label className="mb-2.5 block font-medium text-black dark:text-white">
          Verification Code
        </label>
        <div className="relative">
          <input
            type="text"
            name="code"
            placeholder="Enter verification code"
            className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            value={formFields.code}
            onChange={handleInputChange} // Handle verification code input change
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mb-5">
        <input
          type="submit"
          value={isLoading ? "Verifying..." : "Verify Account"}
          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90 disabled:opacity-50"
          disabled={isLoading || !isConfirmationFormValid()} // Disable button if the form is not valid
        />
      </div>
    </form>
  );

  return (
    <>
      <Breadcrumb pageName="Create User" />
      <div className="flex justify-center">
        <div className="max-w-md">
          <div className="p-4 sm:p-12.5 xl:p-17.5 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
              {isCodeSent ? 'Verify Your Account' : 'Create Account'}
            </h2>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-danger bg-opacity-10 border border-danger text-danger text-sm">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-6 p-4 rounded-lg bg-success bg-opacity-10 border border-success text-success text-sm">
                {successMessage}
              </div>
            )}

            {/* Render either the initial form or the confirmation form based on the state */}
            {!isCodeSent ? renderInitialForm() : renderConfirmationForm()}

            <p className="text-center">
              Already have an account?{' '}
              <Link to="/signin" className="text-primary">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUserBQA;
