import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/style.css';
import './css/satoshi.css';
import { Amplify } from "aws-amplify";
// import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';
import {RouterRoot} from "./components/RouterRoot.tsx";

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
      <RouterRoot/>
  </React.StrictMode>,
)
Amplify.configure({
  Auth: {
    Cognito:{
    userPoolId: 'us-east-1_3q7TXdnTh',
    userPoolClientId: '7mj42l6n2nhedepncpaeks4814',
  },
}
}
);
