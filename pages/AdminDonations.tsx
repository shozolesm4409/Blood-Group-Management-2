
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getDonations, updateDonationStatus, deleteDonationRecord } from '../services/api';
import { Card, Badge, Toast, useToast, ConfirmModal } from '../components/UI';
import { DonationRecord, DonationStatus } from '../types';
import { Check, X, User as UserIcon, Trash2 } from 'lucide-react';

export const AdminDonations = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    const data = await getDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatus = async (id: string, status: DonationStatus) => {
    if (!user) return;
    try {
      await updateDonationStatus(id, status, user);
      showToast(`Donation ${status}.`);
      fetchData();
    } catch (e) { showToast("Operation failed.", "error"); }
  };

  const handleDelete = async () => {
    if (!user || !deleteId) return;
    setActionLoading(true);
    try {
      await deleteDonationRecord(deleteId, user);
      showToast("Record archived.");
      setDeleteId(null);
      fetchData();
    } catch (e) { showToast("Delete failed.", "error"); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300">Syncing Records...</div>;

  return (
    <div className="space-y-6">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Archive Record?" message="This donation record will be moved to system archives." isLoading={actionLoading} />
      
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Donation Management</h1>
      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2rem]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase text-slate-500">
            <tr><th className="px-6 py-5">Donor</th><th className="px-6 py-5">Group</th><th className="px-6 py-5">Units</th><th className="px-6 py-5">Status</th><th className="px-6 py-5 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donations.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm">
                      {d.userAvatar ? (
                        <img src={d.userAvatar} className="w-full h-full object-cover" alt={d.userName} />
                      ) : (
                        <UserIcon className="p-2.5 text-slate-300 w-full h-full" />
                      )}
                    </div>
                    <span className="font-bold text-slate-900">{d.userName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-red-600 font-black">{d.userBloodGroup}</td>
                <td className="px-6 py-4">{d.units}ml</td>
                <td className="px-6 py-4"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')}>{d.status}</Badge></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {d.status === DonationStatus.PENDING && (
                      <>
                        <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-xl transition-all shadow-sm" title="Approve"><Check size={18}/></button>
                        <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl transition-all shadow-sm" title="Reject"><X size={18}/></button>
                      </>
                    )}
                    <button onClick={() => setDeleteId(d.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors" title="Delete Record"><Trash2 size={18} /></button>
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
