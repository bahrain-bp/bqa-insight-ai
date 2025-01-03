import { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { resetPassword, confirmResetPassword, 
  type ResetPasswordOutput, type ConfirmResetPasswordInput } from 'aws-amplify/auth';
import Breadcrumb from "../../components/Breadcrumbs/Breadcrumb";

type FormFields = {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
};

export default function PasswordResetPage() {
  const [formFields, setFormFields] = useState<FormFields>({
    code: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isPasswordConfirmed, setIsPasswordConfirmed] = useState(false);
  const [, setIsProcessingConfirm] = useState(false);
  const [, setIsProcessingCode] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormFields({
      ...formFields,
      [e.target.id]: e.target.value
    });
  };

  function isCodeFormValid() {
    return formFields.email.length > 0;
  }

  function isPasswordResetFormValid() {
    return (
      formFields.code.length > 0 &&
      formFields.password.length > 0 &&
      formFields.password === formFields.confirmPassword
    );
  }

  async function handleSendResetCode(event: any) {
    event.preventDefault();
    setIsProcessingCode(true);

    try {
      const output = await resetPassword({ username: formFields.email });
      setIsCodeSent(true);
      handlePasswordResetNextSteps(output);
    } catch (error) {
      console.error(error);
      setIsProcessingCode(false);
    }
  }

  function handlePasswordResetNextSteps(output: ResetPasswordOutput) {
    const { nextStep } = output;
    switch (nextStep.resetPasswordStep) {
      case 'CONFIRM_RESET_PASSWORD_WITH_CODE':
        const deliveryDetails = nextStep.codeDeliveryDetails;
        console.log(`Confirmation code sent to ${deliveryDetails?.deliveryMedium}`);
        break;
      case 'DONE':
        console.log('Password reset successful.');
        break;
    }
  }

  async function handleConfirmPasswordReset(event: any) {
    event.preventDefault();
    setIsProcessingConfirm(true);

    const input: ConfirmResetPasswordInput = {
      username: formFields.email,
      confirmationCode: formFields.code,
      newPassword: formFields.password
    };

    try {
      await confirmResetPassword(input);
      setIsPasswordConfirmed(true);
    } catch (error) {
      console.error(error);
      setIsProcessingConfirm(false);
    }
  }

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
            disabled={!isCodeFormValid()}
            className="submit-button bg-primary"
            
          >
            Send Confirmation Code
          </button>
        </form>
      </div>
    );
  }

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
            disabled={!isPasswordResetFormValid()}
            className="submit-button bg-primary"
          >
            Confirm Password Reset
          </button>
        </form>
      </div>
    );
  }

  function renderResetSuccessMessage() {
    return (
      <div className="success-message">
        <p>Password Reset is Successful. <Link to="/Auth/SignIn">Sign In</Link></p>
      </div>
    );
  }

  return (
  <>
    <Breadcrumb pageName="Reset Password" />
    <div>
      {!isCodeSent
        ? renderEmailInputForm()
        : !isPasswordConfirmed
        ? renderPasswordResetForm()
        : renderResetSuccessMessage()}
    </div>
  </>
  );
}

