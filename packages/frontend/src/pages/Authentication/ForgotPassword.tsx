import { useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { resetPassword, confirmResetPassword,
   type ResetPasswordOutput, type ConfirmResetPasswordInput } from 'aws-amplify/auth';

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
      <div>
        <h1>{('enterEmail')}</h1>

        <form onSubmit={handleSendResetCode}>
          <input
            autoFocus
            type="email"
            id="email"
            value={formFields.email}
            required
            onChange={handleInputChange}
          />
          <button
            type="submit"
            disabled={!isCodeFormValid()}
          >
            {('confirmation')}
          </button>
        </form>
      </div>
    );
  }

  function renderPasswordResetForm() {
    return (

      <div>
        <form onSubmit={handleConfirmPasswordReset}>
          <div>
            <label htmlFor="code">{('confirmationCode')}</label>
            <input
              autoFocus
              type="tel"
              id="code"
              value={formFields.code}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="newPassword">{('newPassword')}</label>
            <input
              type="password"
              id="password"
              value={formFields.password}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword">{('confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              value={formFields.confirmPassword}
              onChange={handleInputChange}
            />
          </div>
          <button
            type="submit"
            disabled={!isPasswordResetFormValid()}
          >
            {('confirm')}
          </button>
        </form>
      </div>
    );
  }

  function renderResetSuccessMessage() {
    return (
      <div>
        <p>{('password Reset is Successfull')} <Link to="/Auth/SignIn">{('SignIn')}</Link></p>
      </div>
    );
  }

  return (
    <div>
      {!isCodeSent
        ? renderEmailInputForm()
        : !isPasswordConfirmed
        ? renderPasswordResetForm()
        : renderResetSuccessMessage()}
    </div>
  );
}