
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { UserRole, DonationRecord, DonationStatus, User } from '../types';
import { getDonations, getUserDonations, getUsers, handleDirectoryAccess, handleSupportAccess, updateDonationStatus } from '../services/api';
import { generateDonationInsight } from '../services/geminiService';
import { Card, Badge, Button } from '../components/UI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Droplet, Users, TrendingUp, Sparkles, Trophy, ArrowRight, CheckCircle, BellRing, Clock, ShieldCheck, Check, X, HeartPulse, History, Activity } from 'lucide-react';
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
        const accessReqs = u.filter(usr => usr.directoryAccessRequested || usr.supportAccessRequested)
          .map(usr => ({ ...usr, type: 'ACCESS' }));
        const donationReqs = globalDons.filter(don => don.status === DonationStatus.PENDING)
          .map(don => ({ ...don, type: 'DONATION' }));
        
        setPendingItems([...accessReqs, ...donationReqs]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAction = async (itemId: string, type: string, subType: string, approve: boolean) => {
    if (!user || !isAdminOrEditor) return;
    try {
      if (type === 'ACCESS') {
        if (subType === 'directory') await handleDirectoryAccess(itemId, approve, user);
        else await handleSupportAccess(itemId, approve, user);
      } else if (type === 'DONATION') {
        await updateDonationStatus(itemId, approve ? DonationStatus.COMPLETED : DonationStatus.REJECTED, user);
      }
      fetchData();
    } catch (e) {
      alert("Action failed.");
    }
  };

  const handleGenerateInsight = async () => {
    if (!isAdminOrEditor) return;
    setInsightLoading(true);
    const res = await generateDonationInsight(allDonations);
    setInsight(res);
    setInsightLoading(false);
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest animate-pulse">Initializing Intelligence Hub...</div>;

  // --- Eligibility Calculation ---
  const lastDonationDate = user?.lastDonationDate ? new Date(user.lastDonationDate) : null;
  const nextEligibleDate = lastDonationDate ? new Date(lastDonationDate.getTime() + 90 * 24 * 60 * 60 * 1000) : new Date();
  const today = new Date();
  const diffTime = nextEligibleDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isEligible = !lastDonationDate || diffDays <= 0;
  const progressPercent = lastDonationDate ? Math.min(100, Math.max(0, (90 - diffDays) / 90 * 100)) : 100;

  const globalCompleted = allDonations.filter(d => d.status === DonationStatus.COMPLETED);
  const chartData = prepareMonthlyTrendData(allDonations);
  
  const donationCounts = globalCompleted.reduce((acc, curr) => {
    acc[curr.userId] = (acc[curr.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDonor = [...allUsers].sort((a, b) => (donationCounts[b.id] || 0) - (donationCounts[a.id] || 0))[0];
  const topDonorCount = donationCounts[topDonor?.id] || 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">Intelligence Hub</h1>
          <p className="text-slate-500 font-medium">Monitoring system analytics and community activity.</p>
        </div>
        {isAdminOrEditor && (
          <div className="flex gap-4">
            <Button onClick={handleGenerateInsight} isLoading={insightLoading} variant="secondary" className="rounded-l px-7 shadow-xl">
              <Sparkles className="w-5 h-5 mr-3 text-yellow-400 fill-current" /> AI Analytics
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Volume" value={`${globalCompleted.reduce((a,b)=>a+b.units,0)}ml`} icon={Droplet} color="text-red-600" bg="bg-red-50" />
        <StatCard title="Total Donors" value={allUsers.length} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="System Success" value={globalCompleted.length} icon={CheckCircle} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Queue Size" value={allDonations.filter(d => d.status === DonationStatus.PENDING).length} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 border-0 shadow-2xl bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <HeartPulse size={120} className={isEligible ? "text-green-600" : "text-blue-600"} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3 uppercase tracking-widest">
                <ShieldCheck size={24} className={isEligible ? "text-green-600" : "text-blue-600"} /> Health & Eligibility
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className={clsx(
                    "p-6 rounded-[2rem] border-2",
                    isEligible ? "bg-green-50 border-green-100" : "bg-blue-50 border-blue-100"
                  )}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Current Status</p>
                    <p className={clsx("text-2xl font-black tracking-tight", isEligible ? "text-green-600" : "text-blue-600")}>
                      {isEligible ? "ELIGIBLE TO DONATE" : "RESTING PERIOD"}
                    </p>
                    {!isEligible && (
                      <p className="text-sm font-bold text-slate-500 mt-2">
                         Next blood donation possible in <span className="text-blue-600">{diffDays} days</span>.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl flex-1 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Donated</p>
                      <p className="font-bold text-slate-900">{lastDonationDate ? lastDonationDate.toLocaleDateString() : 'Never'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl flex-1 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contribution</p>
                      <p className="font-bold text-slate-900">{userDonations.filter(d => d.status === DonationStatus.COMPLETED).length} Times</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Recovery Progress</span>
                    <span className="text-2xl font-black text-slate-900">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={clsx("h-full transition-all duration-1000", isEligible ? "bg-green-500" : "bg-blue-500")}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                    মেডিকেল গাইডলাইন অনুযায়ী একবার রক্ত দেওয়ার পর শরীর পুরোপুরি স্বাভাবিক অবস্থায় ফিরতে ৩ মাস বা ৯০ দিন সময় লাগে। আমরা আপনার স্বাস্থ্য সুরক্ষায় এই বিরতি বজায় রাখার পরামর্শ দেই।
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 border-0 shadow-lg min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest">
                <TrendingUp size={24} className="text-red-600" /> Donation Trends
              </h3>
              <Badge color="gray">Last 6 Months</Badge>
            </div>
            <div className="flex-1 w-full min-h-[300px] relative">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      stroke="#cbd5e1" 
                      fontSize={10} 
                      fontWeight="900" 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#cbd5e1" 
                      fontSize={10} 
                      fontWeight="900" 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <Tooltip 
                      cursor={{ stroke: '#ef4444', strokeWidth: 1 }} 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', 
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest italic">
                  Not enough data for trending
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          {isAdminOrEditor && (
            <Card className="p-8 border-0 shadow-xl bg-white overflow-hidden animate-in slide-in-from-right-10 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-3">
                  <BellRing className="text-red-600" size={20} /> Recent Updates
                </h3>
                {pendingItems.length > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-l shadow-sm animate-pulse">{pendingItems.length}</span>
                )}
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-l border border-slate-100 flex flex-col gap-3 group hover:border-red-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-l bg-white border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.type === 'DONATION' ? (
                          item.userAvatar ? <img src={item.userAvatar} className="w-full h-full object-cover" /> : <Droplet className="text-red-600" size={20} />
                        ) : (
                          item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" /> : <Users className="p-2.5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.type === 'DONATION' ? item.userName : item.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge color={item.type === 'DONATION' ? 'red' : 'blue'} className="text-[8px] py-0 px-1.5">
                            {item.type === 'DONATION' ? 'Donation' : 'Access'}
                          </Badge>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {item.type === 'DONATION' ? `${item.units}ml` : (item.bloodGroup || 'User')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(item.id, item.type, item.directoryAccessRequested ? 'directory' : 'support', true)} className="flex-1 bg-white border border-slate-200 p-2 rounded-l text-green-600 hover:bg-green-600 hover:text-white transition-all flex justify-center shadow-sm">
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleAction(item.id, item.type, item.directoryAccessRequested ? 'directory' : 'support', false)} className="flex-1 bg-white border border-slate-200 p-2 rounded-l text-red-600 hover:bg-red-600 hover:text-white transition-all flex justify-center shadow-sm">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {pendingItems.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center opacity-30">
                    <CheckCircle size={48} className="mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Nothing pending</p>
                  </div>
                )}
              </div>
              
              <Link to="/notifications" className="w-full flex items-center justify-center gap-3 px-4 py-4 mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-l border border-dashed border-slate-200">
                Action Center <ArrowRight size={14} />
              </Link>
            </Card>
          )}

          <Card className="p-8 border-0 shadow-xl bg-white overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-3">
                <History className="text-blue-600" size={20} /> My Activity Feed
              </h3>
            </div>
            
            <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {userDonations.slice(0, 5).map((item, idx) => (
                <div key={idx} className="relative pl-12 group">
                  <div className={clsx(
                    "absolute left-0 top-1 w-10 h-10 rounded-xl border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110",
                    item.status === DonationStatus.COMPLETED ? "bg-green-100 text-green-600" : (item.status === DonationStatus.REJECTED ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600")
                  )}>
                    {item.status === DonationStatus.COMPLETED ? <Check size={18} /> : (item.status === DonationStatus.REJECTED ? <X size={18} /> : <Activity size={18} />)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(item.donationDate).toLocaleDateString()}</p>
                    <p className="text-sm font-bold text-slate-900">Donation {item.status.toLowerCase()} at {item.location}</p>
                  </div>
                </div>
              ))}
              {userDonations.length === 0 && (
                <div className="py-10 text-center text-slate-300 italic text-sm font-medium">No activity recorded yet.</div>
              )}
            </div>

            <Link to="/my-donations" className="w-full flex items-center justify-center gap-3 px-4 py-4 mt-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors bg-slate-50 rounded-l border border-dashed border-slate-200">
              Full Activity Logs <ArrowRight size={14} />
            </Link>
          </Card>

          <Card className="p-8 bg-[#0F172A] text-white border-0 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/20 to-transparent pointer-events-none"></div>
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Trophy size={200} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-yellow-500/20 rounded-xl text-yellow-500 border border-yellow-500/20">
                  <Trophy size={20} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Top Donor Achievement</h3>
              </div>
              <div className="text-center py-6">
                <div className="relative inline-block mb-6">
                  <div className="w-28 h-28 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-[1.5rem] mx-auto flex items-center justify-center text-4xl font-black border-4 border-slate-800 shadow-2xl group-hover:rotate-6 transition-transform overflow-hidden">
                    {topDonor?.avatar ? (
                      <img src={topDonor.avatar} className="w-full h-full object-cover" alt="Top Donor" />
                    ) : (
                      <span className="text-slate-300">{topDonor?.name.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-slate-900 p-2 rounded-l shadow-xl border-4 border-slate-900">
                    <Sparkles size={16} />
                  </div>
                </div>
                <p className="text-2xl font-black tracking-tighter mb-1">{topDonor?.name || 'Searching...'}</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge color="red" className="bg-red-500/10 text-red-400 border border-red-500/20">{topDonor?.bloodGroup || 'N/A'}</Badge>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-l p-4 border border-white/10">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Contributions</p>
                   <p className="text-3xl font-black text-yellow-500">{topDonorCount} Donations</p>
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
  <Card className="p-3 border-0 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow cursor-default group">
    <div className={`p-4 rounded-[1.5rem] ${bg} transition-transform group-hover:scale-110 duration-300`}>
      <Icon className={`w-6 h-6 ${color} fill-current`} />
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tighter">{value}</p>
    </div>
  </Card>
);

const prepareMonthlyTrendData = (donations: DonationRecord[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const last6Months = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      name: months[d.getMonth()],
      fullDate: `${d.getFullYear()}-${d.getMonth()}`,
      value: 0
    });
  }

  donations.filter(d => d.status === DonationStatus.COMPLETED).forEach(d => {
    const date = new Date(d.donationDate);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const entry = last6Months.find(m => m.fullDate === key);
    if (entry) entry.value += 1;
  });

  return last6Months;
};
