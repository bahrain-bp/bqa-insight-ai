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
console.log("Pool: ", import.meta.env.VITE_USER_POOL_ID)
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID || "",
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || "",
    },
  }
});
