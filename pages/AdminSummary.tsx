
import React, { useEffect, useState } from 'react';
import { getUsers, getDonations } from '../services/api';
import { Card, Badge } from '../components/UI';
import { User, UserRole, DonationRecord, BloodGroup } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Users, Shield, Edit, User as UserIcon, Activity, Droplet } from 'lucide-react';

export const AdminSummary = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getUsers(), getDonations()]).then(([u, d]) => {
      setUsers(u);
      setDonations(d);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Calculating Summary...</div>;

  const roleData = [
    { name: 'Admins', value: users.filter(u => u.role === UserRole.ADMIN).length, color: '#ef4444' },
    { name: 'Editors', value: users.filter(u => u.role === UserRole.EDITOR).length, color: '#3b82f6' },
    { name: 'Users', value: users.filter(u => u.role === UserRole.USER).length, color: '#10b981' },
  ];

  // Fix: Accurate and robust Blood Group Spread calculation
  const groupData = Object.values(BloodGroup).map(bg => ({
    group: bg,
    count: users.filter(u => u.bloodGroup === bg).length
  }));

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">System Summary</h1>
          <p className="text-slate-500 font-medium">Real-time population and contribution distribution.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Registered</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{users.length}</p>
           </div>
           <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100">
              <Users size={20} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard icon={Shield} title="Administrators" value={roleData[0].value} color="bg-red-50 text-red-600" />
        <SummaryCard icon={Edit} title="Content Editors" value={roleData[1].value} color="bg-blue-50 text-blue-600" />
        <SummaryCard icon={UserIcon} title="General Users" value={roleData[2].value} color="bg-green-50 text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-10 border-0 shadow-lg bg-white rounded-[2.5rem]">
          <h3 className="text-lg font-black text-slate-900 mb-10 flex items-center gap-3 uppercase tracking-widest"><Activity size={24} className="text-red-600" /> Role Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                  {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-4">
             {roleData.map(r => <div key={r.name} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: r.color}}></div><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{r.name}</span></div>)}
          </div>
        </Card>

        <Card className="p-10 border-0 shadow-lg bg-white rounded-[2.5rem]">
          <h3 className="text-lg font-black text-slate-900 mb-10 flex items-center gap-3 uppercase tracking-widest"><Droplet size={24} className="text-blue-600" /> Blood Group Spread</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="group" fontSize={12} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc', radius: 12}} 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '900' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, color }: any) => (
  <Card className="p-6 border-0 shadow-md flex items-center gap-5 hover:shadow-lg transition-all bg-white rounded-[2rem] group">
    <div className={`p-5 rounded-2xl ${color} transition-transform group-hover:scale-110 shadow-inner`}><Icon size={24} /></div>
    <div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none">{title}</p><p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p></div>
  </Card>
);
