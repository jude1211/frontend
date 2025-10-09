import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../services/api';

const AdminManageMovies: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ title: '', genre: '', duration: '' });

  const fetchRows = async () => {
    setLoading(true); setError(null);
    try {
      const res = await apiService.adminListMovies(page, limit);
      if (res.success) setRows(res.data || []); else setError(res.error || 'Failed to load');
    } catch (e:any) { setError(e?.message || 'Failed to load'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchRows(); }, [page]);

  const openNew = () => { setEditRow(null); setForm({ title:'', genre:'', duration:'' }); setModalOpen(true); };
  const openEdit = (row:any) => { setEditRow(row); setForm({ title: row.title, genre: row.genre, duration: row.duration, posterUrl: row.posterUrl, status: row.status, releaseDate: row.releaseDate, trailerUrl: row.trailerUrl }); setModalOpen(true); };

  const save = async () => {
    try {
      if (editRow) {
        const res = await apiService.adminUpdateMovie(editRow._id, form);
        if (res.success) { setModalOpen(false); fetchRows(); }
      } else {
        const res = await apiService.adminCreateMovie(form);
        if (res.success) { setModalOpen(false); fetchRows(); }
      }
    } catch {}
  };

  const remove = async (id:string) => {
    if (!confirm('Delete this movie?')) return;
    try { const res = await apiService.adminDeleteMovie(id); if (res.success) fetchRows(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Movies</h1>
        <button onClick={openNew} className="px-3 py-2 bg-red-600 rounded text-white">Add Movie</button>
      </div>
      {loading ? <div className="text-gray-400">Loading…</div> : error ? <div className="text-red-400">{error}</div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="p-2">Title</th>
                <th className="p-2">Genre</th>
                <th className="p-2">Duration</th>
                <th className="p-2">Status</th>
                <th className="p-2">Release</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id} className="border-t border-gray-700 text-gray-200">
                  <td className="p-2">{r.title}</td>
                  <td className="p-2">{Array.isArray(r.genre) ? r.genre.join('/') : r.genre}</td>
                  <td className="p-2">{r.duration}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.releaseDate || '-'}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => openEdit(r)} className="px-2 py-1 bg-blue-600 rounded text-white">Edit</button>
                    <button onClick={() => remove(r._id)} className="px-2 py-1 bg-gray-700 rounded text-white">Delete</button>
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
            <h2 className="text-white font-semibold mb-3">{editRow ? 'Edit Movie' : 'Add Movie'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.title||''} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Title" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input value={form.genre||''} onChange={e=>setForm({...form, genre:e.target.value})} placeholder="Genre" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input value={form.duration||''} onChange={e=>setForm({...form, duration:e.target.value})} placeholder="Duration" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input value={form.releaseDate||''} onChange={e=>setForm({...form, releaseDate:e.target.value})} placeholder="Release Date (YYYY-MM-DD)" className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input value={form.posterUrl||''} onChange={e=>setForm({...form, posterUrl:e.target.value})} placeholder="Poster URL" className="col-span-2 bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <input value={form.trailerUrl||''} onChange={e=>setForm({...form, trailerUrl:e.target.value})} placeholder="Trailer URL" className="col-span-2 bg-black/40 border border-gray-700 text-white rounded px-3 py-2" />
              <select value={form.status||'active'} onChange={e=>setForm({...form, status:e.target.value})} className="bg-black/40 border border-gray-700 text-white rounded px-3 py-2">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="coming_soon">coming_soon</option>
              </select>
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

export default AdminManageMovies;


