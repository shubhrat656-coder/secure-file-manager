import { useEffect, useState } from 'react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Approvals() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/approvals/pending');
      setFiles(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setBusyId(id);
    try {
      await api.post(`/approvals/${id}/${action}`, {});
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Approvals</h1>
      <p className="text-slate-500 text-sm mb-4">Files waiting at your approval stage.</p>

      {error && <p className="text-rose-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : files.length === 0 ? (
        <p className="text-slate-500">Nothing is waiting for you right now.</p>
      ) : (
        <div className="space-y-3">
          {files.map((f) => (
            <div key={f.id} className="bg-white rounded-xl shadow p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{f.original_name}</p>
                <p className="text-xs text-slate-500">
                  Uploaded by {f.uploaded_by_name} · {new Date(f.created_at).toLocaleString()}
                </p>
                <div className="mt-2"><StatusBadge status={f.status} /></div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  disabled={busyId === f.id}
                  onClick={() => act(f.id, 'approve')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  disabled={busyId === f.id}
                  onClick={() => act(f.id, 'reject')}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
