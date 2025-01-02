import React, { useState, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';

interface FormFields {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}
interface CreateUserBQAProps {
    setUser: (newUser: any) => void;
    user: {
      email: string;
      name: string;
    };
  }
const CreateUserBQA: React.FC<CreateUserBQAProps> = ({ setUser, user }) => {
  const [formFields, setFormFields] = useState<FormFields>({
    email: '',
    code: '',
    password: '',
    confirmPassword: ''
  });
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newFields = {
      ...formFields,
      [e.target.name]: e.target.value
    };
    setFormFields(newFields);
    
    // Handle email validation error message here instead
    if (e.target.name === 'email') {
      if (!validateEmail(e.target.value)) {
        setErrorMessage('Only @bqa.gov.bh email addresses are allowed to register');
      } else {
        setErrorMessage('');
      }
    }
  };

  // Updated email validation to only allow @bqa.gov.bh domain
  const validateEmail = (email: string): boolean => {
    // First check if it's a valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Then check if it's from the allowed domain
    return email.toLowerCase().endsWith('@bqa.gov.bh');
  };

  const isInitialFormValid = () => {
    // Only return the boolean result, don't set any state here
    return validateEmail(formFields.email) && 
           formFields.password.length >= 8 &&
           formFields.password === formFields.confirmPassword;
  };
  const isConfirmationFormValid = () => {
    return formFields.code.length > 0;
  };

  const handleInitialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    // Additional check before submission
    if (!validateEmail(formFields.email)) {
      setErrorMessage('Only @bqa.gov.bh email addresses are allowed to register');
      setIsLoading(false);
      return;
    }

    try {
      await signUp({
        username: formFields.email,
        password: formFields.password,
        options: {
          userAttributes: {
            email: formFields.email,
          },
          autoSignIn: true
        }
      });

      setSuccessMessage('Verification code sent to your email.');
      setIsCodeSent(true);
    } catch (error) {
      console.error('Error details:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
  
    try {
      await confirmSignUp({
        username: formFields.email,
        confirmationCode: formFields.code
      });
  
      // Add this line to update the user after successful confirmation
      setUser({ email: formFields.email, name: '' });
  
      setSuccessMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/Auth/SignIn');
      }, 3000);
    } catch (error) {
      console.error('Error details:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error confirming sign up');
    } finally {
      setIsLoading(false);
    }
  };

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
            onChange={handleInputChange}
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
            onChange={handleInputChange}
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
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mb-5">
        <input
          type="submit"
          value={isLoading ? "Creating Account..." : "Create Account"}
          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90 disabled:opacity-50"
          disabled={isLoading || !isInitialFormValid()}
        />
      </div>
    </form>
  );

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
            onChange={handleInputChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="mb-5">
        <input
          type="submit"
          value={isLoading ? "Verifying..." : "Verify Account"}
          className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90 disabled:opacity-50"
          disabled={isLoading || !isConfirmationFormValid()}
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