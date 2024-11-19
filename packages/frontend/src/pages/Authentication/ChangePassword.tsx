import { useState } from "react";
import { updatePassword } from 'aws-amplify/auth';
import { toast } from 'react-toastify'; // Import toast from react-toastify
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for react-toastify

const ModifyPassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handlePasswordChange = async (e: any) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      console.log('New password and confirm password do not match');
      toast.error('New password and confirm password do not match');
      return;
    }
    try {
      await updatePassword({ oldPassword: currentPassword, newPassword });
      console.log('Password updated successfully');
      toast.success('Password updated successfully');
    } catch (err) {
      console.log('Error updating password:', err);
      toast.error('Password should be +6 characters, 1 Capital letter, 1 Symbol, and 1 Number');
    }
  };

  return (
    <div>
      <h1>Modify Password</h1>

      <form onSubmit={handlePasswordChange}>
        <div>
          <label htmlFor="currentPassword">Current Password:</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
          />
        </div>
        <div>
          <label htmlFor="newPassword">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="6+ Characters, 1 Capital letter, 1 Number, 1 Symbol"
            required
          />
        </div>
        <div>
          <label htmlFor="confirmNewPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
        </div>
        <div>
          <button type="submit">
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default ModifyPassword;
// export default ModifyPassword;
// import { useState } from "react";
// import { updatePassword } from 'aws-amplify/auth';
// import { toast } from 'react-toastify'; // Import toast from react-toastify
// import 'react-toastify/dist/ReactToastify.css'; // Import the CSS for react-toastify

// const ModifyPassword: React.FC = () => {
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');

//   const handlePasswordChange = async (e: any) => {
//     e.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       console.log('New password and confirm password do not match');
//       toast.error('New password and confirm password do not match');
//       return;
//     }
//     try {
//       await updatePassword({ oldPassword: currentPassword, newPassword });
//       console.log('Password updated successfully');
//       toast.success('Password updated successfully');
//     } catch (err) {
//       console.log('Error updating password:', err);
//       toast.error('Password should be +6 characters, 1 Capital letter, 1 Symbol, and 1 Number');
//     }
//   };

//   return (
//     <div className="modify-password-container">
//       <h1 className="modify-password-title">Modify Password</h1>

//       <form onSubmit={handlePasswordChange}>
//         <div className="form-group">
//           <label htmlFor="currentPassword" className="form-label">
//             Current Password:
//           </label>
//           <input
//             type="password"
//             id="currentPassword"
//             value={currentPassword}
//             onChange={(e) => setCurrentPassword(e.target.value)}
//             placeholder="Enter current password"
//             required
//             className="form-input"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="newPassword" className="form-label">
//             New Password:
//           </label>
//           <input
//             type="password"
//             id="newPassword"
//             value={newPassword}
//             onChange={(e) => setNewPassword(e.target.value)}
//             placeholder="6+ Characters, 1 Capital letter, 1 Number, 1 Symbol"
//             required
//             className="form-input"
//           />
//         </div>
//         <div className="form-group">
//           <label htmlFor="confirmNewPassword" className="form-label">
//             Confirm New Password:
//           </label>
//           <input
//             type="password"
//             id="confirmNewPassword"
//             value={confirmNewPassword}
//             onChange={(e) => setConfirmNewPassword(e.target.value)}
//             placeholder="Confirm new password"
//             required
//             className="form-input"
//           />
//         </div>
//         <div className="form-group">
//           <button type="submit" className="submit-button">
//             Change Password
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ModifyPassword;