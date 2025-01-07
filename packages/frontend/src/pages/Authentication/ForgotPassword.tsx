import { useState, ChangeEvent } from "react"; // Importing necessary hooks and event types from React
import { Link } from "react-router-dom"; // For routing to the sign-in page after successful password reset
import { resetPassword, confirmResetPassword, 
  type ResetPasswordOutput, type ConfirmResetPasswordInput } from 'aws-amplify/auth'; // AWS Amplify methods for handling password reset functionality
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb"; // Breadcrumb component to display the current page

// Define the structure of the form fields with email, code, password, and confirmPassword
type FormFields = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

export default function PasswordResetPage() {
  // State hooks to manage form data, validation, and processing states
  const [formFields, setFormFields] = useState<FormFields>({
    code: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isCodeSent, setIsCodeSent] = useState(false); // Track if the reset code has been sent
  const [isPasswordConfirmed, setIsPasswordConfirmed] = useState(false); // Track if the password has been successfully reset
  const [, setIsProcessingConfirm] = useState(false); // Track if password confirmation is being processed
  const [, setIsProcessingCode] = useState(false); // Track if the reset code request is being processed

  // Handle input changes and update the form fields state
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormFields({
      ...formFields,
      [e.target.id]: e.target.value // Dynamically update the specific field
    });
  };

  // Check if the email field is valid for sending the reset code
  function isCodeFormValid() {
    return formFields.email.length > 0;
  }

  // Check if the password reset form is valid (code, password, and confirmation password match)
  function isPasswordResetFormValid() {
    return (
      formFields.code.length > 0 &&
      formFields.password.length > 0 &&
      formFields.password === formFields.confirmPassword
    );
  }

  // Handle sending the password reset code to the email
  async function handleSendResetCode(event: any) {
    event.preventDefault(); // Prevent default form submission
    setIsProcessingCode(true); // Set processing state to true while the code is being sent

    try {
      const output = await resetPassword({ username: formFields.email }); // Send reset code via AWS Amplify
      setIsCodeSent(true); // Set the flag to indicate the code has been sent
      handlePasswordResetNextSteps(output); // Handle next steps after the code is sent
    } catch (error) {
      console.error(error); // Log any errors
      setIsProcessingCode(false); // Reset processing state if an error occurs
    }
  }

  // Handle the next steps based on the output from the resetPassword method
function handlePasswordResetNextSteps(output: ResetPasswordOutput) {
  // Destructure the 'nextStep' property from the output of the resetPassword method
  const { nextStep } = output;
  // Switch on the 'resetPasswordStep' property to determine the next action
  switch (nextStep.resetPasswordStep) {
    // If the reset password step requires confirmation with a code
    case 'CONFIRM_RESET_PASSWORD_WITH_CODE':
      // Retrieve the details of how the code was delivered (e.g., via email or SMS)
      const deliveryDetails = nextStep.codeDeliveryDetails;
      // Log the delivery medium (how the confirmation code was sent to the user)
      console.log(`Confirmation code sent to ${deliveryDetails?.deliveryMedium}`);
      break;
    // If the password reset is complete and no further actions are needed
    case 'DONE':
      // Log that the password reset was successful
      console.log('Password reset successful.');
      break;
  }
}


  // Handle confirming the password reset with the provided confirmation code and new password
  async function handleConfirmPasswordReset(event: any) {
    event.preventDefault(); // Prevent default form submission
    setIsProcessingConfirm(true); // Set processing state to true while confirming the password reset

    const input: ConfirmResetPasswordInput = {
      username: formFields.email,
      confirmationCode: formFields.code,
      newPassword: formFields.password
    };

    try {
      await confirmResetPassword(input); // Call AWS Amplify to confirm password reset
      setIsPasswordConfirmed(true); // Set flag to true once password is confirmed
    } catch (error) {
      console.error(error); // Log any errors
      setIsProcessingConfirm(false); // Reset processing state if an error occurs
    }
  }

  // Render the form where the user enters their email to receive the reset code
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
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <button
            type="submit"
            disabled={!isCodeFormValid()} // Disable button if email field is empty
            className="submit-button bg-primary"
          >
            Send Confirmation Code
          </button>
        </form>
      </div>
    );
  }

  // Render the form for resetting the password using the confirmation code
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
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">New Password</label>
            <input
              type="password"
              id="password"
              value={formFields.password}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={formFields.confirmPassword}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
          <button
            type="submit"
            disabled={!isPasswordResetFormValid()} // Disable button if form is invalid
            className="submit-button bg-primary"
          >
            Confirm Password Reset
          </button>
        </form>
      </div>
    );
  }

  // Render the success message when the password reset is confirmed
  function renderResetSuccessMessage() {
    return (
      <div className="success-message">
        <p>Password Reset is Successful. <Link to="/Auth/SignIn">Sign In</Link></p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageName="Reset Password" /> {/* Display the breadcrumb for the page */}
      <div>
        {/* Conditionally render the appropriate form based on the reset state */}
        {!isCodeSent
          ? renderEmailInputForm() // Show email input form if code not sent
          : !isPasswordConfirmed
          ? renderPasswordResetForm() // Show password reset form if password not confirmed
          : renderResetSuccessMessage()} {/* Show success message if password is confirmed */}
      </div>
    </>
  );
}
