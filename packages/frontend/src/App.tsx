import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Loader from './Loader';
import PageTitle from './components/PageTitle';
import SignIning from './pages/Authentication/SignIn';
import PasswordResetPage from './pages/Authentication/ForgotPassword';
import ChatBot from './pages/Chat';
import ECommerce from './pages/Dashboard/ECommerce';
import DefaultLayout from './layout/DefaultLayout';
import ModifyPassword from './pages/Authentication/ChangePassword';
import ReportUpload from "./pages/ReportUpload.tsx";
import SignOutPage from './pages/Authentication/SignOut.tsx';

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
              <PageTitle title="InsightAI" />
              <ChatBot />
            </>
          }
        />
      
    
        <Route path="Auth/SignIn" element={<SignIning setUser={setUser} user={user}/>} />

        <Route path="/signout" element={<SignOutPage />} />
        <Route
          path="/auth/ForgotPassword"
          element={
            <>
              <PageTitle title="Reset your password | InsightAI" />
              <PasswordResetPage/>
            </>
          }
        />
        <Route
          path="/auth/ChangePassword"
          element={
            <>
              <PageTitle title="Change Password | InsightAI" />
              <ModifyPassword />
            </>
          }
        />
          <Route
            path="/report/upload"
            element={
                <>
                    <PageTitle title="Report Upload" />
                    <ReportUpload />
                </>
                }
            />
      </Routes>
    </DefaultLayout>
  );
}

export default App;
