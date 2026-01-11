import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import UserHome from "./pages/UserHome";
import TechHome from "./pages/TechHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<UserHome />} />
        <Route path="/tech" element={<TechHome />} />
        <Route path="/" element={<Navigate to="/login" replace /> } />
        <Route path="*" element={<Navigate to="/login" replace /> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;