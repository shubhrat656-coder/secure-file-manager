import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file first');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      await api.post('/files', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('File uploaded. It now needs approval: Level 1, then Level 2, then the Manager.');
      setFile(null);
      setTimeout(() => navigate('/'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-1">Upload a file</h1>
      <p className="text-slate-500 text-sm mb-6">
        Every file enters the approval chain: Level 1 &rarr; Level 2 &rarr; Manager.
      </p>

      {error && <p className="bg-rose-50 text-rose-700 text-sm p-2 rounded mb-4">{error}</p>}
      {message && <p className="bg-emerald-50 text-emerald-700 text-sm p-2 rounded mb-4">{message}</p>}

      <form onSubmit={submit} className="space-y-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full border rounded px-3 py-2"
        />
        <button
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded font-medium disabled:opacity-60"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
