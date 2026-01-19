import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import UserHome from "./pages/UserHome";
import TechHome from "./pages/TechHome";
import ProtectedRoute from "./components/protectedRoute";
import Signup from "./pages/Signup";
import SubmitTicket from "./pages/SubmitTicket";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={
          <ProtectedRoute role="user">
            <UserHome />
          </ProtectedRoute>
        }/>
        <Route path="/tech" element={
          <ProtectedRoute role="tech">
            <TechHome />
          </ProtectedRoute>
        }/>
        <Route path="/" element={<Navigate to="/login" replace /> } />
        <Route path="*" element={<Navigate to="/login" replace /> } />
        <Route path="/signup" element={<Signup />} />
        <Route path="/user/submit-ticket" element={
          <ProtectedRoute role="user">
            <SubmitTicket />
          </ProtectedRoute>
        }/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;