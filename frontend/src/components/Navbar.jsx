import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const APPROVER_ROLES = ['level1', 'level2', 'manager', 'admin'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isApprover = APPROVER_ROLES.includes(user.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <Link to="/" className="font-semibold text-lg">Secure File Manager</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="hover:text-sky-300">Files</Link>
          <Link to="/upload" className="hover:text-sky-300">Upload</Link>
          {isApprover && <Link to="/approvals" className="hover:text-sky-300">Approvals</Link>}
          {user.role === 'admin' && <Link to="/users" className="hover:text-sky-300">Users</Link>}
          <span className="text-slate-400 hidden sm:inline">{user.name} · {user.role}</span>
          <button
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
