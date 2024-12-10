import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './css/style.css';
import './fonts/stylesheet.css';
import { Amplify } from "aws-amplify";
// import 'jsvectormap/dist/css/jsvectormap.css';
import 'flatpickr/dist/flatpickr.min.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
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
