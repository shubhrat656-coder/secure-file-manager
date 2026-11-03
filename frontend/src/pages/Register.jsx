import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-1">Create an account</h1>
      <p className="text-slate-500 mb-6 text-sm">
        New accounts start as regular users. An admin can promote you to an approver role.
      </p>

      {error && <p className="bg-rose-50 text-rose-700 text-sm p-2 rounded mb-4">{error}</p>}

      <form onSubmit={submit} className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
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
          placeholder="Password (min 6 characters)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded font-medium disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4">
        Already registered? <Link to="/login" className="text-sky-600">Sign in</Link>
      </p>
    </div>
  );
}
