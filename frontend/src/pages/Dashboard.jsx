import { useEffect, useState } from 'react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/files');
      setFiles(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const download = async (file) => {
    try {
      const res = await api.get(`/files/${file.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Download failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Files</h1>
        <button onClick={load} className="text-sm text-sky-600 hover:underline">Refresh</button>
      </div>

      {error && <p className="text-rose-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : files.length === 0 ? (
        <p className="text-slate-500">No files yet. Upload one from the Upload tab.</p>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="p-3">File</th>
                <th className="p-3">Uploaded by</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-t">
                  <td className="p-3 font-medium">{f.original_name}</td>
                  <td className="p-3">{f.uploaded_by_name}</td>
                  <td className="p-3"><StatusBadge status={f.status} /></td>
                  <td className="p-3 text-slate-500">
                    {new Date(f.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    {f.status === 'approved' ? (
                      <button onClick={() => download(f)} className="text-sky-600 hover:underline">
                        Download
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">Awaiting approval</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
