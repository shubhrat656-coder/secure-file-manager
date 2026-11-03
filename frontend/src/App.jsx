import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Approvals from './pages/Approvals';
import Users from './pages/Users';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {user && <Navbar />}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/upload" element={<Protected><Upload /></Protected>} />
          <Route path="/approvals" element={<Protected><Approvals /></Protected>} />
          <Route path="/users" element={<Protected><Users /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
