import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components for different roles
import Login from './pages/login';
import Signup from './pages/signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import SecretaryDashboard from './pages/secretary/SecretaryDashboard';
import UserDashboard from './pages/user/UserDashboard';
import UnregisterDashboard from './pages/user/UnregisterDashboard';
import UserMemo from './pages/user/UserMemo';
import MemoDetails from './components/Memodetails';
import AdminCreateMemo from './pages/admin/AdminCreateMemo';
import InviteMember from './pages/admin/InviteMember';
import AdminMemoManager from './pages/admin/AdminMemoManager';
import AdminMemoDetails from './pages/admin/AdminMemoDetails';
import AdminRecieveMemoDetails from './pages/admin/AdminRecieveMemoDetails';
import Admincalendar from './pages/admin/Admincalendar';
import AdminReport from './pages/admin/AdminReport';
import AdminsentReport from './pages/admin/AdminsentReport';
import Adminfacultymanager from './pages/admin/AdminFacultyManager';
import Secretarycreatememo from './pages/secretary/SecretaryCreateMemo';
import Secretarymemomanager from './pages/secretary/SecretaryMemoManager';
import Secretarymemodetails from './pages/secretary/SecretaryMemoDetails';
import SecretaryRecieveMemoDetails from './pages/secretary/SecretaryRecieveMemoDetails';
import Secretarycalendar from './pages/secretary/SecretaryCalendar';
import SecretaryReport from './pages/secretary/SecretaryReport';
import SecretarysentReport from './pages/secretary/SecretarySentReport';
import Secretaryfacultymanager from './pages/secretary/SecretaryFacultyManager';
import Usercalendar from './pages/user/UserCalendar';
import UserReport from './pages/user/UserReport';

const NotFound = () => <h1>404 Not Found</h1>;

const App = () => {
  return (
    <>
      <ToastContainer />
      <Router>
        <Switch>
          <Route exact path="/" component={Login} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/signup" component={Signup} />
          <Route exact path="/unregisteruser/dashboard" component={UnregisterDashboard} />
          <Route exact path="/user/dashboard" component={UserDashboard} />
          <Route exact path="/user/memo" component={UserMemo} />
          <Route exact path="/user/memo/:memoId" component={MemoDetails} />
          <Route exact path="/user/calendar" component={Usercalendar} />
          <Route exact path="/user/report_list" component={UserReport} />

          <Route exact path="/admin/dashboard" component={AdminDashboard} />
          <Route exact path="/admin/inviteMember" component={InviteMember} />
          <Route exact path="/admin/faculty_Manager" component={Adminfacultymanager} />
          <Route exact path="/admin/memo_create" component={AdminCreateMemo} />
          <Route exact path="/admin/memo_manager" component={AdminMemoManager} />
          <Route exact path="/admin/memo_Icreate/:memoId" component={AdminMemoDetails} />
          <Route exact path="/admin/recieve_memo/:memoId" component={AdminRecieveMemoDetails} />
          <Route exact path="/admin/calendar" component={Admincalendar} />
          <Route exact path="/admin/report_list" component={AdminReport} />
          <Route exact path="/admin/sent_report/:memoId" component={AdminsentReport} />

          <Route exact path="/secretary/dashboard" component={SecretaryDashboard} />
          <Route exact path="/secretary/faculty_manager" component={Secretaryfacultymanager} />
          <Route exact path="/secretary/memo_create" component={Secretarycreatememo}/>
          <Route exact path="/secretary/memo_manager" component={Secretarymemomanager} />
          <Route exact path="/secretary/memo_Icreate/:memoId" component={Secretarymemodetails} />
          <Route exact path="/secretary/recieve_memo/:memoId" component={SecretaryRecieveMemoDetails} />
          <Route exact path="/secretary/calendar" component={Secretarycalendar} />
          <Route exact path="/secretary/report_list" component={SecretaryReport} />
          <Route exact path="/secretary/sent_report/:memoId" component={SecretarysentReport} />

          <Route component={NotFound} />
        </Switch>
      </Router>
    </>
  );
};

export default App;
