import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/style.css';
import './fonts/stylesheet.css';
import { Amplify } from "aws-amplify";
// import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';
import {RouterRoot} from "./components/RouterRoot.tsx";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
      <RouterRoot/>
  </React.StrictMode>,
)
// Log the User Pool ID to the console (useful for debugging)
console.log("Pool: ", import.meta.env.VITE_USER_POOL_ID);

// Configure AWS Amplify to work with Cognito for authentication
Amplify.configure({
  Auth: {
    Cognito: {
      // Use environment variables for configuration, falling back to an empty string if undefined
      userPoolId: import.meta.env.VITE_USER_POOL_ID || "",
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "",
    },
  }
});