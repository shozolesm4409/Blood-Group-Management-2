
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getUsers, requestDirectoryAccess } from '../services/api';
import { Card, Badge, Button, Input, Select, Toast, useToast } from '../components/UI';
import { User, BloodGroup, UserRole } from '../types';
import { Lock, ShieldAlert, MapPin, Phone, Calendar, User as UserIcon, Search, Droplets, Heart, Info, Filter } from 'lucide-react';

export const DonorDirectory = () => {
  const { user, updateUser } = useAuth();
  // Fix: Correct initialization of toast state from useToast hook to avoid using variable before declaration
  const { toastState, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');
  const [group, setGroup] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user?.hasDirectoryAccess || user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR) {
      getUsers().then(setUsers);
    }
  }, [user]);

  const hasAccess = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.hasDirectoryAccess;

  const handleRequest = async () => {
    if (!user) return;
    setRequesting(true);
    try {
      await requestDirectoryAccess(user);
      updateUser({ ...user, directoryAccessRequested: true });
      showToast("Access requested.");
    } catch (e) { showToast("Failed.", "error"); }
    finally { setRequesting(false); }
  };

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 animate-in fade-in duration-500">
        <Toast {...toastState as any} onClose={hideToast} />
        <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white rounded-[3rem]">
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner"><Lock size={48} /></div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Directory Locked</h2>
            <p className="text-slate-500 font-medium leading-relaxed">নিরাপত্তার স্বার্থে ডোনার ডিরেক্টরি শুধুমাত্র ভেরিফাইড ইউজারদের জন্য উন্মুক্ত। তথ্য দেখতে এক্সেস রিকোয়েস্ট পাঠান।</p>
          </div>
          {user?.directoryAccessRequested ? (
            <div className="p-6 bg-yellow-50 text-yellow-700 rounded-2xl flex items-center justify-center gap-3 border border-yellow-100 font-black uppercase tracking-widest text-xs"><ShieldAlert size={18} /> Awaiting Verification</div>
          ) : (
            <Button onClick={handleRequest} isLoading={requesting} className="w-full py-5 rounded-2xl text-lg">Request Access to Directory</Button>
          )}
        </Card>
      </div>
    );
  }

  const filtered = users.filter(u => (u.name.toLowerCase().includes(filter.toLowerCase()) || u.location.toLowerCase().includes(filter.toLowerCase())) && (group === '' || u.bloodGroup === group));

  const checkEligibility = (lastDate?: string) => {
    if (!lastDate) return true;
    const days = Math.ceil((new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
    return days >= 90;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Donor Directory</h1>
          <p className="text-slate-500 font-medium">Find lifesavers in your local community.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-1 lg:w-96">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors z-10">
               <Search size={20} />
             </div>
             <input 
               placeholder="Search name or location..." 
               value={filter} 
               onChange={e => setFilter(e.target.value)} 
               className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none shadow-xl shadow-slate-200/50 focus:ring-4 focus:ring-red-500/5 focus:border-red-600 transition-all placeholder:text-slate-300"
             />
          </div>
          <div className="relative group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors z-10 pointer-events-none">
               <Filter size={18} />
             </div>
             <select 
               value={group} 
               onChange={e => setGroup(e.target.value)} 
               className="w-full sm:w-44 pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest outline-none shadow-xl shadow-slate-200/50 focus:border-red-600 cursor-pointer appearance-none text-slate-700"
             >
               <option value="">Groups</option>
               {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(u => {
          const isEligible = checkEligibility(u.lastDonationDate);
          return (
            <Card key={u.id} className="group relative overflow-hidden p-8 border-0 shadow-lg bg-white rounded-[2.5rem] hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 opacity-[0.03] rounded-full -translate-y-12 translate-x-12"></div>
              
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden border-4 border-white shadow-xl group-hover:rotate-6 transition-transform">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt={u.name} /> : <UserIcon size={24} />}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 text-white flex items-center justify-center rounded-lg border-2 border-white text-[10px] font-black shadow-lg">
                    {u.bloodGroup}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-slate-900 truncate group-hover:text-red-600 transition-colors leading-tight mb-1">{u.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge color={isEligible ? 'green' : 'red'} className="text-[8px] py-0.5 px-2 ring-2 ring-slate-50">
                      {isEligible ? 'ELIGIBLE' : 'ON REST'}
                    </Badge>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">{u.idNumber}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-blue-500 shadow-sm"><MapPin size={16}/></div>
                  <span className="text-sm font-bold text-slate-700">{u.location}</span>
                </div>
                <div className="flex items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-green-500 shadow-sm"><Phone size={16}/></div>
                  <span className="text-sm font-bold text-slate-700">{u.phone}</span>
                </div>
                {u.lastDonationDate && (
                  <div className="flex items-center gap-3 bg-red-50/50 p-3 rounded-2xl border border-red-100/50">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm"><Calendar size={16}/></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-red-600 opacity-60">Last Donate</span>
                      <span className="text-sm font-black text-slate-700">{new Date(u.lastDonationDate).toLocaleDateString('bn-BD')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-dashed border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <Info size={12} />
                   <span>Community Score</span>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-red-600 shadow-sm"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-800 shadow-sm"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 shadow-sm"></div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
