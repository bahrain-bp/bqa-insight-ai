import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Loader from './Loader';
import PageTitle from './components/PageTitle';
import SignIning from './pages/Authentication/SignIn';
import PasswordResetPage from './pages/Authentication/ForgotPassword';
import DefaultLayout from './layout/DefaultLayout';
import ModifyPassword from './pages/Authentication/ChangePassword';
import FileManagement from "./pages/FileManagement.tsx";
import SignOutPage from './pages/Authentication/SignOut.tsx';
import BasicView from './pages/BasicView/BasicView.tsx';
import { SchoolReviews } from './pages/SchoolReviews.tsx';
import { VocationalReviews } from './pages/VocationalReviews.tsx';
import { UniversityReviews } from './pages/UniversitiesReviews.tsx';
import ProtectedRoute from './pages/Authentication/ProtectedRouteComp.tsx';
//import CreateUser from './pages/Authentication/CreateUser.tsx';
import CreateUserBQA from './pages/Authentication/CreateUserBQA.tsx';

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
              <BasicView />
            </>
          }
        />

      <Route path="/auth/signin" element={<SignIning setUser={setUser} user={user} />} />
      <Route 
        path="/fileManagement" 
        element={
          <ProtectedRoute>
            <FileManagement />
          </ProtectedRoute>
        } 
      />

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
          path="/auth/CreateUserBQA"
          element={
            <>
              <PageTitle title="Create User | InsightAI" />
              <CreateUserBQA 
                setUser={(newUser) => console.log('Set User:', newUser)} 
                user={{ email: '', name: '' }} 
              />
            </>
          }
        />

        
          <Route
            path="/fileManagement"
            element={
                <>
                    <PageTitle title="Manage Files" />
                    <FileManagement />
                </>
                }
            />

          <Route
          path="/Filter"
          element={
            <>
              <PageTitle title="Filter" />
            </>
          }
        />
        <Route
          path="/schoolReviews"
          element={
              <>
                  <PageTitle title="School Reviews" />
                  <SchoolReviews />
              </>
              }
        />
        <Route
          path="/vocationalReviews"
          element={
              <>
                  <PageTitle title="Vocational Reviews" />
                  <VocationalReviews />
              </>
              }
        />
        <Route
          path="/UniversityReviews"
          element={
              <>
                  <PageTitle title="University Reviews" />
                  <UniversityReviews />
              </>
              }
        />
      </Routes>
      
    </DefaultLayout>
  );
}

export default App;
