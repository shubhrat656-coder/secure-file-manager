import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-slate-500 mb-6 text-sm">Sign in to manage and approve files.</p>

      {error && <p className="bg-rose-50 text-rose-700 text-sm p-2 rounded mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded font-medium disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4">
        No account? <Link to="/register" className="text-sky-600">Register</Link>
      </p>
    </div>
  );
}
