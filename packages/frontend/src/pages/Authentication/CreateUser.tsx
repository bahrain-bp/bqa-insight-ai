import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { Dispatch, SetStateAction } from 'react';

export type SetStateType<T> = Dispatch<SetStateAction<T>>;

export interface CreateUserProps {
  setUser: SetStateType<any>;
  user: any;
}

interface FormData {
  email: string;
  password: string;
  name: string;
}

// API URL to call the Lambda function via API Gateway
const API_URL = `${import.meta.env.VITE_API_URL}/createUser`;

const CreateUser: React.FC<CreateUserProps> = ({ setUser }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: ''
  });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string>('');
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    return email.toLowerCase().endsWith('@bqa.com');
  };

  const validatePassword = (password: string): boolean => {
    // Add your password policy here, e.g. minimum length, special characters, etc.
    const passwordPolicy = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Example: at least 8 characters, letters and digits
    return passwordPolicy.test(password);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate email format
    if (!validateEmail(formData.email)) {
      setErrorMessage('Only @bqa.com email addresses are allowed');
      return;
    }

    // Validate password against the policy
    if (!validatePassword(formData.password)) {
      setPasswordErrorMessage('Password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    try {
      // Call the Lambda function via the API Gateway
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          tempPassword: formData.password,
          name: formData.name
        })
      });

      // Parse the response data
      const data = await response.json();
      
      // Check the response and take actions accordingly
      if (response.ok) {
        // Navigate to the sign-in page upon success
        navigate('/signin');
      } else {
        // Display an error message if the response is not OK
        setErrorMessage(data.message || 'Error creating user');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error creating user. Please try again.');
    }
  };

  return (
    <>
      <Breadcrumb pageName="Create User" />
      <div className="flex justify-center">
        <div className="max-w-md">
          <div className="p-4 sm:p-12.5 xl:p-17.5 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <h2 className="mb-9 text-2xl font-bold text-black dark:text-white sm:text-title-xl2">
              Create BQA User
            </h2>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-danger bg-opacity-10 border border-danger text-danger text-sm">
                {errorMessage}
              </div>
            )}
            {passwordErrorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-danger bg-opacity-10 border border-danger text-danger text-sm">
                {passwordErrorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Email (@bqa.com)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="name@bqa.com"
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Set temporary password"
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="mb-5">
                <input
                  type="submit"
                  value="Create User"
                  className="w-full cursor-pointer rounded-lg border border-primary bg-primary p-4 text-white transition hover:bg-opacity-90"
                />
              </div>

              <p className="text-center">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary">
                  Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateUser;
