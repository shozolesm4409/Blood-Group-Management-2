
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { UserRole, DonationRecord, DonationStatus, User, BloodGroup } from '../types';
import { getDonations, getUserDonations, getUsers, handleDirectoryAccess, handleSupportAccess, handleFeedbackAccess, handleIDCardAccess, updateDonationStatus } from '../services/api';
import { generateDonationInsight } from '../services/geminiService';
import { Card, Badge, Button } from '../components/UI';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Droplet, Users, TrendingUp, Sparkles, Trophy, ArrowRight, CheckCircle, BellRing, Clock, ShieldCheck, Check, X, HeartPulse, History, Activity, Heart, Calendar, Award, Shield, Edit, User as UserIcon, UserCheck, ShieldCheck as ShieldIcon, IdCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export const Dashboard = () => {
  const { user } = useAuth();
  const [userDonations, setUserDonations] = useState<DonationRecord[]>([]);
  const [allDonations, setAllDonations] = useState<DonationRecord[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const isAdminOrEditor = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;

  const fetchData = async () => {
    try {
      const [userDons, globalDons, u] = await Promise.all([
        getUserDonations(user?.id || ''),
        getDonations(),
        getUsers()
      ]);
      
      setUserDonations(userDons);
      setAllDonations(globalDons);
      setAllUsers(u);
      
      if (isAdminOrEditor) {
        const directoryReqs = u.filter(usr => usr.directoryAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Directory' }));
        const supportReqs = u.filter(usr => usr.supportAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Support' }));
        const feedbackReqs = u.filter(usr => usr.feedbackAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'Feedback' }));
        const idCardReqs = u.filter(usr => usr.idCardAccessRequested).map(usr => ({ ...usr, type: 'ACCESS', accessType: 'IDCard' }));
        const donationReqs = globalDons.filter(don => don.status === DonationStatus.PENDING).map(don => ({ ...don, type: 'DONATION', accessType: 'Donation' }));
        
        setPendingItems([...directoryReqs, ...supportReqs, ...feedbackReqs, ...idCardReqs, ...donationReqs].sort((a,b) => b.id.localeCompare(a.id)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAction = async (itemId: string, type: string, accessType: string, approve: boolean) => {
    if (!user || !isAdminOrEditor) return;
    try {
      if (type === 'ACCESS') {
        const sub = accessType.toLowerCase();
        if (sub === 'directory') await handleDirectoryAccess(itemId, approve, user);
        else if (sub === 'support') await handleSupportAccess(itemId, approve, user);
        else if (sub === 'feedback') await handleFeedbackAccess(itemId, approve, user);
        else if (sub === 'idcard') await handleIDCardAccess(itemId, approve, user);
      } else if (type === 'DONATION') {
        await updateDonationStatus(itemId, approve ? DonationStatus.COMPLETED : DonationStatus.REJECTED, user);
      }
      fetchData();
    } catch (e) { alert("Action failed."); }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Initializing Dashboard...</div>;

  const lastDonationDate = user?.lastDonationDate ? new Date(user.lastDonationDate) : null;
  const today = new Date();
  const nextEligibleDate = lastDonationDate ? new Date(lastDonationDate.getTime() + 90 * 24 * 60 * 60 * 1000) : today;
  const isEligible = today >= nextEligibleDate;
  const diffDays = Math.max(0, Math.ceil((nextEligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = lastDonationDate ? Math.min(100, Math.max(0, (90 - diffDays) / 90 * 100)) : 100;
  
  const completedCount = userDonations.filter(d => d.status === DonationStatus.COMPLETED).length;
  const globalCompleted = allDonations.filter(d => d.status === DonationStatus.COMPLETED);

  const topHero = [...allUsers].sort((a, b) => {
    const aCount = allDonations.filter(d => d.userId === a.id && d.status === DonationStatus.COMPLETED).length;
    const bCount = allDonations.filter(d => d.userId === b.id && d.status === DonationStatus.COMPLETED).length;
    return bCount - aCount;
  })[0];

  const topHeroCount = allDonations.filter(d => d.userId === topHero?.id && d.status === DonationStatus.COMPLETED).length;

  const roleData = [
    { name: 'Admins', value: allUsers.filter(u => u.role === UserRole.ADMIN).length, color: '#ef4444' },
    { name: 'Editors', value: allUsers.filter(u => u.role === UserRole.EDITOR).length, color: '#3b82f6' },
    { name: 'Users', value: allUsers.filter(u => u.role === UserRole.USER).length, color: '#10b981' },
  ];

  const groupData = Object.values(BloodGroup).map(bg => ({
    group: bg,
    count: allUsers.filter(u => u.bloodGroup === bg).length
  }));

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitoring system analytics and community activity.</p>
        </div>
        {isAdminOrEditor && <Button onClick={async () => { setInsightLoading(true); const res = await generateDonationInsight(allDonations); setInsight(res); setInsightLoading(false); }} isLoading={insightLoading} variant="secondary"><Sparkles className="w-5 h-5 mr-3 text-yellow-400 fill-current" /> AI Analytics</Button>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Volume" value={`${globalCompleted.reduce((a,b)=>a+b.units,0)}ml`} icon={Droplet} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Total Donors" value={allUsers.length} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="System Success" value={globalCompleted.length} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Queue Size" value={allDonations.filter(d => d.status === DonationStatus.PENDING).length} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-10 border-0 shadow-2xl bg-white relative overflow-hidden rounded-[2.5rem]">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Health & Eligibility</h3>
              </div>

              <div className="flex flex-col lg:flex-row gap-12">
                <div className="flex-1 space-y-8">
                  <div className={clsx(
                    "p-8 rounded-[2rem] border-2 transition-all duration-500",
                    isEligible ? "bg-green-50 border-green-100 ring-4 ring-green-50/50" : "bg-blue-50 border-blue-100 ring-4 ring-blue-50/50"
                  )}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Current Status</p>
                    <p className={clsx("text-3xl font-black tracking-tighter mb-1", isEligible ? "text-green-600" : "text-blue-600")}>
                      {isEligible ? "ELIGIBLE TO DONATE" : "RESTING PERIOD"}
                    </p>
                    {!isEligible && (
                      <p className="text-sm font-bold text-slate-500/80">
                        Next blood donation possible in <span className="text-blue-600 font-black">{diffDays} days</span>.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Last Donated</p>
                      <p className="text-lg font-black text-slate-900">{user?.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : 'No Records'}</p>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Contribution</p>
                      <p className="text-lg font-black text-slate-900">{completedCount} Times</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-48 flex flex-col items-center justify-center text-center space-y-6">
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      <Heart className={clsx("w-full h-full stroke-[1.5] transition-colors duration-500", isEligible ? "text-green-100" : "text-blue-100")} />
                      <Activity className={clsx("absolute text-red-600 animate-pulse", isEligible ? "opacity-100" : "opacity-30")} size={32} />
                      <div className="absolute -bottom-2 right-0 bg-white shadow-xl border border-slate-50 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="text-xl font-black text-slate-900">{Math.round(progressPercent)}%</span>
                      </div>
                   </div>
                   <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recovery Progress</p>
                     <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className={clsx("h-full transition-all duration-1000", isEligible ? "bg-green-500" : "bg-blue-500")} style={{ width: `${progressPercent}%` }} />
                     </div>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed max-w-[150px]">
                      মেডিকেল গাইডলাইন অনুযায়ী একবার রক্ত দেওয়ার পর শরীর স্বাভাবিক অবস্থায় ফিরতে ৩ মাস বা ৯০ দিন সময় লাগে।
                   </p>
                </div>
              </div>
            </div>
          </Card>

          {isAdminOrEditor && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 border-0 shadow-lg bg-white rounded-[2.5rem]">
                  <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest"><Activity size={24} className="text-red-600" /> Role Distribution</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={roleData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                          {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-8 border-0 shadow-lg bg-white rounded-[2.5rem]">
                  <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-widest"><Droplet size={24} className="text-blue-600" /> Blood Spread</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={groupData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="group" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc', radius: 12}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Admin Summary Cards Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Users" 
                  value={allUsers.filter(u => u.role === UserRole.USER).length} 
                  icon={UserIcon} 
                  color="text-green-600" 
                  bg="bg-green-50" 
                />
                <StatCard 
                  title="Total Admin" 
                  value={allUsers.filter(u => u.role === UserRole.ADMIN).length} 
                  icon={ShieldIcon} 
                  color="text-red-600" 
                  bg="bg-red-50" 
                />
                <StatCard 
                  title="Total Editor" 
                  value={allUsers.filter(u => u.role === UserRole.EDITOR).length} 
                  icon={Edit} 
                  color="text-blue-600" 
                  bg="bg-blue-50" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {isAdminOrEditor && (
            <Card className="p-8 border-0 shadow-xl bg-white overflow-hidden rounded-[2.5rem]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-3"><BellRing className="text-red-600" size={20} /> Recent Updates</h3>
                {pendingItems.length > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-l shadow-sm animate-pulse">{pendingItems.length}</span>}
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-red-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center">
                        {item.userAvatar || item.avatar ? <img src={item.userAvatar || item.avatar} className="w-full h-full object-cover" /> : <Droplet className="text-red-600" size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.userName || item.name}</p>
                        <Badge color={item.type === 'DONATION' ? 'red' : 'blue'} className="text-[8px] py-0 px-1.5">{item.accessType === 'IDCard' ? 'ID Card' : item.accessType} Request</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(item.id, item.type, item.accessType, true)} className="flex-1 bg-white border border-slate-200 p-2 rounded-xl text-green-600 hover:bg-green-600 hover:text-white transition-all flex justify-center shadow-sm"><Check size={16} /></button>
                      <button onClick={() => handleAction(item.id, item.type, item.accessType, false)} className="flex-1 bg-white border border-slate-200 p-2 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all flex justify-center shadow-sm"><X size={16} /></button>
                    </div>
                  </div>
                ))}
                {pendingItems.length === 0 && <div className="text-center py-12 opacity-30 font-black uppercase text-[10px]">Nothing pending</div>}
              </div>
            </Card>
          )}

          <Card className="p-10 bg-[#0F172A] text-white border-0 shadow-2xl relative overflow-hidden rounded-[3rem] group">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.2),transparent_70%)] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-full mb-10">
                <Trophy size={16} className="text-yellow-500 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">Top Contributor</span>
              </div>

              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-tr from-yellow-500 to-red-500 rounded-[2.5rem] opacity-20 blur-xl group-hover:opacity-40 transition-opacity"></div>
                <div className="w-32 h-32 bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl font-black border-4 border-slate-800 shadow-2xl overflow-hidden relative z-10">
                  {topHero?.avatar ? (
                    <img src={topHero.avatar} className="w-full h-full object-cover" alt={topHero.name} />
                  ) : (
                    <span className="text-slate-500">{topHero?.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-slate-900 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl z-20 ring-4 ring-[#0F172A]">
                  <Award size={20} />
                </div>
              </div>

              <div className="space-y-1 mb-8">
                <h4 className="text-2xl font-black tracking-tight group-hover:text-yellow-500 transition-colors">{topHero?.name || 'Loading...'}</h4>
                <div className="flex items-center justify-center gap-2">
                   <Badge color="red" className="bg-red-500/20 text-red-400 border border-red-500/30 font-black">{topHero?.bloodGroup || 'N/A'}</Badge>
                   <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{topHero?.location || 'Unknown'}</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Total</p>
                   <p className="text-xl font-black text-white">{topHeroCount}</p>
                   <p className="text-[8px] font-bold text-slate-500">Donations</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                   <p className="text-xl font-black text-yellow-500">HERO</p>
                   <p className="text-[8px] font-bold text-slate-500">Rank #1</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
  <Card className="p-3 border-0 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow group rounded-[1.5rem]">
    <div className={`p-4 rounded-[1.25rem] ${bg} transition-transform group-hover:scale-110 shadow-inner`}><Icon className={`w-6 h-6 ${color} fill-current`} /></div>
    <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p><p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p></div>
  </Card>
);
