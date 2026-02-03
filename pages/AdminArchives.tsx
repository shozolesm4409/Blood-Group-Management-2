
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getDeletedUsers, getDeletedDonations, getDeletedLogs, getDeletedFeedbacks, getDeletedNotices, restoreDeletedUser, restoreDeletedDonation, restoreDeletedLog, restoreDeletedFeedback, restoreDeletedNotice, permanentlyDeleteArchivedFeedback } from '../services/api';
import { Card, Toast, useToast, ConfirmModal } from '../components/UI';
import { Trash2, RotateCcw, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';

export const AdminArchives = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'donations' | 'logs' | 'feedbacks' | 'notices'>('users');
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    let res = [];
    if (tab === 'users') res = await getDeletedUsers();
    else if (tab === 'donations') res = await getDeletedDonations();
    else if (tab === 'logs') res = await getDeletedLogs();
    else if (tab === 'feedbacks') res = await getDeletedFeedbacks();
    else if (tab === 'notices') res = await getDeletedNotices();
    setData(res);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleRestore = async (id: string) => {
    if (!user) return;
    try {
      if (tab === 'users') await restoreDeletedUser(id, user);
      else if (tab === 'donations') await restoreDeletedDonation(id, user);
      else if (tab === 'logs') await restoreDeletedLog(id, user);
      else if (tab === 'feedbacks') await restoreDeletedFeedback(id, user);
      else if (tab === 'notices') await restoreDeletedNotice(id, user);
      showToast("Restored.");
      fetchData();
    } catch (e) { showToast("Failed.", "error"); }
  };

  const handlePermanentDelete = async () => {
    if (!user || !confirmId) return;
    try {
      if (tab === 'feedbacks') await permanentlyDeleteArchivedFeedback(confirmId, user);
      showToast("Erased.");
      setConfirmId(null);
      fetchData();
    } catch (e) { showToast("Failed.", "error"); }
  };

  return (
    <div className="space-y-6">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!confirmId} onClose={() => setConfirmId(null)} onConfirm={handlePermanentDelete} title="Erase Permanently?" message="This action is irreversible." />
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Archives</h1>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          {['users', 'donations', 'logs', 'feedbacks', 'notices'].map(t => (
            <button key={t} onClick={() => setTab(t as any)} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", tab === t ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>{t}</button>
          ))}
        </div>
      </div>
      <Card className="overflow-hidden min-h-[400px] border-0 shadow-lg bg-white rounded-[2rem]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
            <tr><th className="px-6 py-4">Identity / Description</th><th className="px-6 py-4">Deleted At</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    {(item.avatar || item.userAvatar) && (
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                        <img src={item.avatar || item.userAvatar} className="w-full h-full object-cover" />
                      </div>
                    )}
                    {!item.avatar && !item.userAvatar && (tab === 'users' || tab === 'donations') && (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                        <UserIcon size={18} className="text-slate-300" />
                      </div>
                    )}
                    <p className="font-black text-slate-900">{item.name || item.userName || item.subject || item.action || 'Archived Entry'}</p>
                  </div>
                </td>
                <td className="px-6 py-5 text-slate-400 text-xs font-bold">{new Date(item.deletedAt).toLocaleString()}</td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleRestore(item.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><RotateCcw size={18}/></button>
                    <button onClick={() => setConfirmId(item.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
