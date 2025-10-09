import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';

const AdminManageScreens: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>({ screenId:'', screenName:'', meta: { rows: 8, columns: 12 }, seatClasses: [], seats: [] });

  const fetchRows = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiService.adminListScreens(page, limit);
      if (res.success) setRows(res.data || []); else setError(res.error || 'Failed to load');
    } catch (e:any) { setError(e?.message || 'Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRows(); }, [page]);

  const save = async () => {
    try {
      const payload = form;
      const res = await apiService.adminCreateScreen(payload);
      if (res.success) { setModalOpen(false); fetchRows(); }
    } catch {}
  };

  const remove = async (screenId:string) => {
    if (!confirm('Delete this screen layout?')) return;
    try { const res = await apiService.adminDeleteScreen(screenId); if (res.success) fetchRows(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Screens</h1>
        <button onClick={()=>setModalOpen(true)} className="px-3 py-2 bg-red-600 rounded text-white">Add / Upsert Screen</button>
      </div>
      {loading ? <div className="text-gray-400">Loading…</div> : error ? <div className="text-red-400">{error}</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="p-2">Screen ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Rows</th>
                <th className="p-2">Columns</th>
                <th className="p-2">Updated</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id} className="border-t border-gray-700 text-gray-200">
                  <td className="p-2">{r.screenId}</td>
                  <td className="p-2">{r.screenName || '-'}</td>
                  <td className="p-2">{r.meta?.rows}</td>
                  <td className="p-2">{r.meta?.columns}</td>
                  <td className="p-2">{new Date(r.updatedAt).toLocaleString()}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={()=>remove(r.screenId)} className="px-2 py-1 bg-gray-700 rounded text-white">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded p-4 w-full max-w-lg">
            <h2 className="text-white font-semibold mb-3">Upsert Screen</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.screenId||''} onChange={e=>setForm({...form, screenId:e.target.value})} placeholder="Screen ID (e.g., 1)" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input value={form.screenName||''} onChange={e=>setForm({...form, screenName:e.target.value})} placeholder="Screen Name" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input type="number" value={form.meta?.rows||8} onChange={e=>setForm({...form, meta:{...form.meta, rows: parseInt(e.target.value||'0',10)}})} placeholder="Rows" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input type="number" value={form.meta?.columns||12} onChange={e=>setForm({...form, meta:{...form.meta, columns: parseInt(e.target.value||'0',10)}})} placeholder="Columns" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setModalOpen(false)} className="px-3 py-2 bg-gray-700 rounded text-white">Cancel</button>
              <button onClick={save} className="px-3 py-2 bg-red-600 rounded text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageScreens;


