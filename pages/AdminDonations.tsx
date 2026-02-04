
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getDonations, updateDonationStatus, deleteDonationRecord } from '../services/api';
import { Card, Badge, Toast, useToast, ConfirmModal } from '../components/UI';
import { DonationRecord, DonationStatus } from '../types';
import { Check, X, User as UserIcon, Trash2, Calendar, Droplet, MapPin, History } from 'lucide-react';
import clsx from 'clsx';

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
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-100"><History size={28} /></div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Donation Management</h1>
          <p className="text-sm text-slate-500 font-medium">Moderating community contributions.</p>
        </div>
      </div>
      
      {/* Desktop Table View */}
      <Card className="hidden lg:block overflow-hidden border-0 shadow-lg bg-white rounded-[2rem]">
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4 pb-20">
         {donations.map(d => (
           <Card key={d.id} className="p-6 border-0 shadow-lg bg-white rounded-[2.5rem] relative overflow-hidden group">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md flex items-center justify-center">
                     {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-300" />}
                   </div>
                   <div>
                     <p className="font-black text-slate-900 text-lg leading-tight">{d.userName}</p>
                     <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-slate-400" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(d.donationDate).toLocaleDateString()}</p>
                     </div>
                   </div>
                </div>
                <div className="absolute top-4 right-4">
                   <Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')} className="px-3 py-1 ring-4 ring-slate-50">
                      {d.status}
                   </Badge>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-[1.5rem] flex flex-col gap-1 border border-slate-100">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Donation Spec</span>
                   <div className="flex items-center gap-2">
                     <Droplet size={16} className="text-red-500 fill-current" />
                     <span className="text-sm font-black text-slate-700">{d.userBloodGroup} ({d.units}ml)</span>
                   </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-[1.5rem] flex flex-col gap-1 border border-slate-100">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Point of Care</span>
                   <div className="flex items-center gap-2">
                     <MapPin size={16} className="text-blue-500" />
                     <span className="text-[11px] font-bold text-slate-600 truncate">{d.location}</span>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                {d.status === DonationStatus.PENDING ? (
                  <>
                    <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="flex-1 bg-green-50 text-green-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform border border-green-100">
                       <Check size={16} /> Approve
                    </button>
                    <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="flex-1 bg-red-50 text-red-600 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform border border-red-100">
                       <X size={16} /> Reject
                    </button>
                  </>
                ) : (
                  <button onClick={() => setDeleteId(d.id)} className="w-full bg-slate-50 text-slate-400 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-inner border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all">
                     <Trash2 size={16} /> Archive Record
                  </button>
                )}
             </div>
           </Card>
         ))}
      </div>
    </div>
  );
};
