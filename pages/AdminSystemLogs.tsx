
import React, { useEffect, useState } from 'react';
import { getLogs, deleteLogEntry } from '../services/api';
import { Card, Badge, Button, Toast, useToast, ConfirmModal } from '../components/UI';
import { useAuth } from '../AuthContext';
import { AuditLog } from '../types';
import { RotateCcw, User as UserIcon, Trash2 } from 'lucide-react';

export const AdminSystemLogs = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    setActionLoading(true);
    try {
      await deleteLogEntry(deleteId, user);
      showToast("Log entry archived.");
      setDeleteId(null);
      fetchLogs();
    } catch (e) { showToast("Failed to delete log.", "error"); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300">Fetching Logs...</div>;

  return (
    <div className="space-y-6">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Archive Log Entry?" message="This entry will be moved to system archives." isLoading={actionLoading} />
      
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Audit Logs</h1>
        <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2 rounded-xl"><RotateCcw size={16} /> Refresh</Button>
      </div>
      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2rem]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-6 py-5">Time</th>
              <th className="px-6 py-5">User</th>
              <th className="px-6 py-5">Action</th>
              <th className="px-6 py-5">Details</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-400 text-xs font-bold">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                      {log.userAvatar ? (
                        <img src={log.userAvatar} className="w-full h-full object-cover" alt={log.userName} />
                      ) : (
                        <UserIcon className="p-2 text-slate-300 w-full h-full" />
                      )}
                    </div>
                    <span className="font-bold text-slate-900">{log.userName}</span>
                  </div>
                </td>
                <td className="px-6 py-4"><Badge color="blue">{log.action}</Badge></td>
                <td className="px-6 py-4 text-slate-600 font-medium">{log.details}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setDeleteId(log.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors" title="Delete Log">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
