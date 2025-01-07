import { useState, ChangeEvent } from "react"; // Import React hooks for managing state and handling input change events
import { Link } from "react-router-dom"; // Import Link component for navigation to other routes
import { resetPassword, confirmResetPassword, 
  type ResetPasswordOutput, type ConfirmResetPasswordInput } from 'aws-amplify/auth'; // Importing Amplify methods for handling password reset
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb"; // Import Breadcrumb component for navigation hierarchy

// Define the structure of the form fields with email, code, password, and confirmPassword
type FormFields = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

export default function PasswordResetPage() {
  // State variables to manage form fields, whether code is sent, whether the password is confirmed, and processing flags
  const [formFields, setFormFields] = useState<FormFields>({
    code: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isCodeSent, setIsCodeSent] = useState(false); // Flag to track whether the reset code was sent
  const [isPasswordConfirmed, setIsPasswordConfirmed] = useState(false); // Flag to track whether the password was confirmed
  const [, setIsProcessingConfirm] = useState(false); // Flag to track processing state for confirmation
  const [, setIsProcessingCode] = useState(false); // Flag to track processing state for code sending

  // Function to handle input changes and update the corresponding form field in the state
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormFields({
      ...formFields, // Preserve previous form field values
      [e.target.id]: e.target.value // Update the specific form field based on input ID
    });
  };

  // Function to validate the email input form (checks if the email is provided)
  function isCodeFormValid() {
    return formFields.email.length > 0;
  }

  // Function to validate the password reset form (checks if code and password match)
  function isPasswordResetFormValid() {
    return (
      formFields.code.length > 0 &&
      formFields.password.length > 0 &&
      formFields.password === formFields.confirmPassword // Password and confirmation should match
    );
  }

  // Function to send the password reset code to the user's email
  async function handleSendResetCode(event: any) {
    event.preventDefault(); // Prevent default form submission behavior
    setIsProcessingCode(true); // Set processing flag to true while waiting for the reset code

    try {
      // Call Amplify's resetPassword method to send the code
      const output = await resetPassword({ username: formFields.email });
      setIsCodeSent(true); // Update state to indicate the code has been sent
      handlePasswordResetNextSteps(output); // Proceed with the next steps based on the response
    } catch (error) {
      console.error(error); // Log errors if any occur
      setIsProcessingCode(false); // Set processing flag back to false if an error occurs
    }
  }

  // Function to handle the next steps after the reset code is sent
  function handlePasswordResetNextSteps(output: ResetPasswordOutput) {
    const { nextStep } = output; // Get the next step in the password reset process
    switch (nextStep.resetPasswordStep) {
      case 'CONFIRM_RESET_PASSWORD_WITH_CODE': // If the next step requires code confirmation
        const deliveryDetails = nextStep.codeDeliveryDetails;
        console.log(`Confirmation code sent to ${deliveryDetails?.deliveryMedium}`); // Log delivery details
        break;
      case 'DONE': // If password reset is successful
        console.log('Password reset successful.');
        break;
    }
  }

  // Function to handle password confirmation after the user inputs the code and new password
  async function handleConfirmPasswordReset(event: any) {
    event.preventDefault(); // Prevent default form submission behavior
    setIsProcessingConfirm(true); // Set processing flag to true while confirming the password

    const input: ConfirmResetPasswordInput = {
      username: formFields.email, // Pass email as the username for confirmation
      confirmationCode: formFields.code, // Pass the confirmation code provided by the user
      newPassword: formFields.password // New password entered by the user
    };

    try {
      // Call Amplify's confirmResetPassword method to confirm the new password
      await confirmResetPassword(input);
      setIsPasswordConfirmed(true); // Update state to indicate the password has been confirmed
    } catch (error) {
      console.error(error); // Log errors if any occur
      setIsProcessingConfirm(false); // Set processing flag back to false if an error occurs
    }
  }

  // Function to render the email input form where the user enters their email
  function renderEmailInputForm() {
    return (
      <div className="forgot-password-container">
        <h1 className="forgot-password-title">Enter Your Email</h1>
        <form onSubmit={handleSendResetCode}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              autoFocus
              type="email"
              id="email"
              value={formFields.email}
              required
              onChange={handleInputChange} // Handle input change for email
              className="form-input"
            />
          </div>
          <button
            type="submit"
            disabled={!isCodeFormValid()} // Disable button if the email is not valid
            className="submit-button bg-primary"
          >
            Send Confirmation Code
          </button>
        </form>
      </div>
    );
  }

  // Function to render the password reset form where the user enters the reset code and new password
  function renderPasswordResetForm() {
    return (
      <div className="modify-password-container">
        <h1 className="modify-password-title">Reset Your Password</h1>
        <form onSubmit={handleConfirmPasswordReset}>
          <div className="form-group">
            <label htmlFor="code" className="form-label">Confirmation Code</label>
            <input
              autoFocus
              type="tel"
              id="code"
              value={formFields.code}
              onChange={handleInputChange} // Handle input change for confirmation code
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">New Password</label>
            <input
              type="password"
              id="password"
              value={formFields.password}
              onChange={handleInputChange} // Handle input change for new password
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={formFields.confirmPassword}
              onChange={handleInputChange} // Handle input change for confirming new password
              className="form-input"
            />
          </div>
          <button
            type="submit"
            disabled={!isPasswordResetFormValid()} // Disable button if the form is not valid
            className="submit-button bg-primary"
          >
            Confirm Password Reset
          </button>
        </form>
      </div>
    );
  }

  // Function to render a success message when the password reset is successful
  function renderResetSuccessMessage() {
    return (
      <div className="success-message">
        <p>Password Reset is Successful. <Link to="/Auth/SignIn">Sign In</Link></p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Reset Password" /> {/* Breadcrumb for navigation */}
      <div>
        {/* Conditional rendering based on the state of the process */}
        {!isCodeSent
          ? renderEmailInputForm() // Show email input form if the code has not been sent
          : !isPasswordConfirmed
          ? renderPasswordResetForm() // Show password reset form if the code has been sent, but password is not confirmed
          : renderResetSuccessMessage()} {/* Show success message once password is confirmed */}
      </div>
    </>
  );
}
