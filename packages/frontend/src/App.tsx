import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Loader from './Loader';
import PageTitle from './components/PageTitle';
import SignIning from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import PasswordResetPage from './pages/Authentication/ForgotPassword';
import ChatBot from './pages/Chat';
import Chart from './pages/Chart';
import ECommerce from './pages/Dashboard/ECommerce';
import FormElements from './pages/Form/FormElements';
import FormLayout from './pages/Form/FormLayout';
import Profile from './pages/Profile';
import Settings from './pages/Setting';
import Tables from './pages/Tables';
import Alerts from './pages/UiElements/Alerts';
import Buttons from './pages/UiElements/Buttons';
import DefaultLayout from './layout/DefaultLayout';
import ModifyPassword from './pages/Authentication/ChangePassword';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return loading ? (
    <Loader />
  ) : (
    <DefaultLayout>
      <Routes>
        <Route
          index
          element={
            <>
              <PageTitle title="InsightAI" />
              <ECommerce />
            </>
          }
        />
        <Route
          path="/chat"
          element={
            <>
              <PageTitle title="Chat " />
              <ChatBot />
            </>
          }
        />
        <Route
          path="/profile"
          element={
            <>
              <PageTitle title="Profile | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Profile />
            </>
          }
        />
        <Route
          path="/forms/form-elements"
          element={
            <>
              <PageTitle title="Form Elements | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <FormElements />
            </>
          }
        />
        <Route
          path="/forms/form-layout"
          element={
            <>
              <PageTitle title="Form Layout | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <FormLayout />
            </>
          }
        />
        <Route
          path="/tables"
          element={
            <>
              <PageTitle title="Tables | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Tables />
            </>
          }
        />
        <Route
          path="/settings"
          element={
            <>
              <PageTitle title="Settings | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Settings />
            </>
          }
        />
        <Route
          path="/chart"
          element={
            <>
              <PageTitle title="Basic Chart | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Chart />
            </>
          }
        />
        <Route
          path="/ui/alerts"
          element={
            <>
              <PageTitle title="Alerts | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Alerts />
            </>
          }
        />
        <Route
          path="/ui/buttons"
          element={
            <>
              <PageTitle title="Buttons | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <Buttons />
            </>
          }
        />
        <Route path="Auth/SignIn" element={<SignIning setUser={setUser} user={user}/>} />

        <Route
          path="/auth/signup"
          element={
            <>
              <PageTitle title="Signup | TailAdmin - Tailwind CSS Admin Dashboard Template" />
              <SignUp />
            </>
            
          }
          
        />
        <Route
          path="/auth/ForgotPassword"
          element={
            <>
              <PageTitle title="Reset your password | EduScribe" />
              <PasswordResetPage/>
            </>
          }
        />
        <Route
          path="/auth/ChangePassword"
          element={
            <>
              <PageTitle title="Change Password | EduScribe" />
              <ModifyPassword />
            </>
          }
        />
      </Routes>
    </DefaultLayout>
  );
}

export default App;
