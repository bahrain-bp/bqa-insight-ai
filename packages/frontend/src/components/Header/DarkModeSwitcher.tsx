import {NavLink} from 'react-router-dom';
import Login from '../../images/logo/login.svg';
import { useEffect,useState } from 'react';
import { getCurrentUser } from '@aws-amplify/auth';
import SignOutButton from '../../pages/Authentication/SignOut';

const DarkModeSwitcher = () => {
    const [loggedIn, setLoggedIn] = useState(false);

    const checkUserSignIn = async () => {
        try {
          const user = await getCurrentUser();
          console.log("logged in user: ", user);
          if(user){
              setLoggedIn(true);
          }else{
              setLoggedIn(false);
          }
         
   
          
        } catch (error) {
          console.log("User not signed in:", error);
         setLoggedIn(false);
        }
      };
    useEffect(  () => {
    
        checkUserSignIn();
      }, [setLoggedIn, getCurrentUser, checkUserSignIn]);

    return (
        <div className="flex items-center">
            <table className="table-auto">
                <tbody>
                <tr>
                   {loggedIn ? (
                    <>
                    <td>
                    <SignOutButton />
                    </td>
                    <td className="px-2">
                     <NavLink to="/auth/signin">
                         <img src={Login} alt="Login" width="40" height="40"/>
                     </NavLink>
                 </td>
                    </>
                    
                   ) : (<>
                <td style={{paddingTop: 9.5}}>
                     <NavLink to="/auth/signin">
                         Login
                     </NavLink>
                 </td>
                 <td className="px-2">
                     <NavLink to="/auth/signin">
                         <img src={Login} alt="Login" width="40" height="40"/>
                     </NavLink>
                 </td>
                   </>
                  
                   )}
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default DarkModeSwitcher;
