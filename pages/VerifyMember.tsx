
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs } from '@firebase/firestore';
import { db } from '../services/api';
import { User, BloodGroup } from '../types';
import { Card, Badge, Button } from '../components/UI';
// Added User as UserIcon to imports
import { CheckCircle2, ShieldCheck, Droplet, MapPin, Calendar, ArrowLeft, AlertCircle, Search, User as UserIcon } from 'lucide-react';

export const VerifyMember = () => {
  const { idNumber } = useParams();
  const [member, setMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), where('idNumber', '==', idNumber));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data() as User;
          setMember(data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [idNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Authenticating Identity...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full p-10 text-center border-0 shadow-2xl rounded-[3rem] bg-white">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Invalid ID</h1>
          <p className="text-slate-500 font-medium mb-8">This identity token could not be found in our verified member database.</p>
          <Link to="/">
            <Button className="w-full rounded-2xl py-4">Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-8">
           <Link to="/" className="flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-colors">
             <ArrowLeft size={20} /> Back
           </Link>
           <div className="flex items-center gap-2 text-red-600 font-black text-sm">
             <ShieldCheck size={18} /> Verified Member
           </div>
        </div>

        <Card className="p-10 border-0 shadow-2xl rounded-[3rem] bg-white relative overflow-hidden text-center">
          {/* Status Banner */}
          <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
          
          <div className="mb-8 relative">
             <div className="w-32 h-32 rounded-3xl bg-slate-100 mx-auto overflow-hidden border-4 border-white shadow-xl">
               {member.avatar ? (
                 <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center"><UserIcon size={48} className="text-slate-200" /></div>
               )}
             </div>
             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <CheckCircle2 size={20} />
             </div>
          </div>

          <div className="space-y-2 mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{member.name}</h1>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{member.idNumber}</p>
            <Badge color="green" className="px-6 py-1.5 mt-4 text-[10px] ring-4 ring-green-50">Authentic Donor Account</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 text-left">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-sm"><Droplet size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Blood Group</p>
                  <p className="text-xl font-black text-slate-900">{member.bloodGroup}</p>
               </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm"><MapPin size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Last Location</p>
                  <p className="text-lg font-bold text-slate-700">{member.location}</p>
               </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-sm"><Calendar size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Verified Experience</p>
                  <p className="text-lg font-bold text-slate-700">{member.lastDonationDate ? `Last Contribution: ${new Date(member.lastDonationDate).toLocaleDateString()}` : 'New Life-Saver Member'}</p>
               </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-dashed border-slate-100 text-slate-400 font-medium text-xs">
            This verification page serves as proof of membership in the BloodLink platform. 
            Generated on {new Date().toLocaleString()}
          </div>
        </Card>
      </div>
    </div>
  );
};
