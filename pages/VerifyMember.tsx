
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from '@firebase/firestore';
import { db, logVerificationCheck } from '../services/api';
import { User, DonationFeedback, FeedbackStatus, DonationStatus } from '../types';
import { Card, Badge, Button } from '../components/UI';
import { CheckCircle2, ShieldCheck, Droplet, MapPin, Calendar, AlertCircle, Search, User as UserIcon, MessageSquareQuote, Quote, QrCode, Clock, History } from 'lucide-react';
import clsx from 'clsx';

export const VerifyMember = () => {
  const { idNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [member, setMember] = useState<User | null>(null);
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [donationCount, setDonationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searchId, setSearchId] = useState('');

  // Determine if we are in admin mode or public mode
  const isAdminView = location.pathname.startsWith('/admin');
  const baseRoute = isAdminView ? '/admin/verify' : '/verify';

  const fetchData = async (queryValue: string) => {
    setLoading(true);
    setError(false);
    try {
      // First try searching by ID Number
      const qId = query(collection(db, 'users'), where('idNumber', '==', queryValue.toUpperCase()));
      let snap = await getDocs(qId);
      
      // If not found, try searching by Phone Number
      if (snap.empty) {
        const qPhone = query(collection(db, 'users'), where('phone', '==', queryValue));
        snap = await getDocs(qPhone);
      }
      
      if (!snap.empty) {
        const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as User;
        setMember(userData);
        
        // Log the verification check
        await logVerificationCheck(userData.id, userData.name, userData.bloodGroup);
        
        // Fetch feedbacks
        const fq = query(
          collection(db, 'feedbacks'), 
          where('userId', '==', userData.id),
          where('status', '==', FeedbackStatus.APPROVED)
        );
        const fSnap = await getDocs(fq);
        const feedbackData = fSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationFeedback));
        setFeedbacks(feedbackData);

        // Fetch completed donation count
        const dq = query(
          collection(db, 'donations'),
          where('userId', '==', userData.id),
          where('status', '==', DonationStatus.COMPLETED)
        );
        const dSnap = await getDocs(dq);
        setDonationCount(dSnap.size);

      } else {
        setMember(null);
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idNumber) {
      fetchData(idNumber);
    } else {
      setMember(null);
      setError(false);
    }
  }, [idNumber]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`${baseRoute}/${searchId.trim()}`);
    }
  };

  const checkEligibility = (lastDate?: string) => {
    if (!lastDate) return { eligible: true, daysLeft: 0 };
    const lastDonation = new Date(lastDate);
    const today = new Date();
    const nextEligible = new Date(lastDonation.getTime() + 90 * 24 * 60 * 60 * 1000);
    const diffTime = nextEligible.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      eligible: diffDays <= 0,
      daysLeft: Math.max(0, diffDays)
    };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Authenticating Identity...</p>
      </div>
    );
  }

  // No ID provided - Search UI
  if (!idNumber) {
    return (
      <div className={clsx("flex flex-col items-center justify-center", !isAdminView && "py-20 px-6")}>
        <div className="max-w-xl w-full space-y-8 animate-in fade-in duration-500">
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-200">
                <ShieldCheck size={40} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Identity Verification</h1>
              <p className="text-slate-500 font-medium">পাবলিক ভেরিফিকেশন সিস্টেম। ডোনার আইডি অথবা ফোন নম্বর দিয়ে সত্যতা যাচাই করুন।</p>
           </div>

           <Card className="p-10 border-0 shadow-2xl rounded-[3rem] bg-white">
              <form onSubmit={handleSearch} className="space-y-6">
                 <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">System ID or Phone Number</label>
                    <div className="relative group">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={20} />
                       <input 
                         type="text" 
                         placeholder="ID (e.g. BL-361013) or Phone Number" 
                         value={searchId}
                         onChange={(e) => setSearchId(e.target.value)}
                         className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-lg font-bold text-slate-900 focus:bg-white focus:border-red-600/30 outline-none transition-all placeholder:text-slate-300"
                         required
                       />
                    </div>
                 </div>
                 <Button type="submit" className="w-full py-5 rounded-2xl text-lg shadow-xl shadow-red-100">ভেরিফাই করুন</Button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                 <div className="inline-flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                   <QrCode size={14} /> Scan ID Card for Auto-Verify
                 </div>
              </div>
           </Card>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className={clsx("flex flex-col items-center justify-center p-6", !isAdminView && "py-20")}>
        <Card className="max-w-md w-full p-10 text-center border-0 shadow-2xl rounded-[3rem] bg-white">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Invalid Credentials</h1>
          <p className="text-slate-500 font-medium mb-8">This identity token or phone number could not be found in our verified member database.</p>
          <div className="space-y-3">
            <Button onClick={() => navigate(baseRoute)} className="w-full rounded-2xl py-4 shadow-lg shadow-red-100">Try Another Search</Button>
          </div>
        </Card>
      </div>
    );
  }

  const { eligible, daysLeft } = checkEligibility(member.lastDonationDate);

  return (
    <div className={clsx("px-6", !isAdminView && "py-12")}>
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-4">
             <button onClick={() => navigate(baseRoute)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-red-600 transition-colors text-sm">
               <Search size={18} /> New Search
             </button>
           </div>
           <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
             <ShieldCheck size={16} /> Verified Member
           </div>
        </div>

        <Card className="p-10 border-0 shadow-2xl rounded-[3rem] bg-white relative overflow-hidden text-center">
          <div className={`absolute top-0 left-0 w-full h-2 ${eligible ? 'bg-green-500' : 'bg-red-500'}`}></div>
          
          <div className="mb-8 relative">
             <div className="w-32 h-32 rounded-3xl bg-slate-100 mx-auto overflow-hidden border-4 border-white shadow-xl">
               {member.avatar ? (
                 <img src={member.avatar} className="w-full h-full object-cover" alt={member.name} />
               ) : (
                 <div className="w-full h-full flex items-center justify-center"><UserIcon size={48} className="text-slate-200" /></div>
               )}
             </div>
             <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${eligible ? 'bg-green-500' : 'bg-red-500'} text-white w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg`}>
                <CheckCircle2 size={20} />
             </div>
          </div>

          <div className="space-y-2 mb-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{member.name}</h1>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{member.idNumber}</p>
            <div className="flex justify-center gap-3 mt-4">
              <Badge color="blue" className="px-6 py-1.5 text-[10px] ring-4 ring-blue-50 uppercase tracking-widest font-black">Authentic Account</Badge>
              <Badge color={eligible ? 'green' : 'red'} className="px-6 py-1.5 text-[10px] ring-4 ring-red-50 uppercase tracking-widest font-black">
                {eligible ? 'ELIGIBLE' : 'ON REST'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-sm"><Droplet size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">রক্তের গ্রুপ</p>
                  <p className="text-xl font-black text-slate-900">{member.bloodGroup}</p>
               </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm"><MapPin size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ডোনার এলাকা</p>
                  <p className="text-lg font-bold text-slate-700 truncate max-w-[120px]">{member.location}</p>
               </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm"><History size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">মোট রক্তদান</p>
                  <p className="text-xl font-black text-slate-900">{donationCount} বার</p>
               </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shadow-sm"><Clock size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">পরবর্তী রক্তদান</p>
                  <p className={clsx("text-lg font-black", eligible ? "text-green-600" : "text-red-600")}>
                    {eligible ? 'এখনই সম্ভব' : `${daysLeft} দিন পর`}
                  </p>
               </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5 md:col-span-2">
               <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm"><Calendar size={24} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">সর্বশেষ রক্তদানের তারিখ</p>
                  <p className="text-lg font-black text-slate-900">
                    {member.lastDonationDate ? new Date(member.lastDonationDate).toLocaleDateString('bn-BD') : 'তথ্য নেই'}
                  </p>
               </div>
            </div>
          </div>

          {feedbacks.length > 0 && (
            <div className="mt-10 pt-10 border-t border-slate-100 text-left">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <MessageSquareQuote size={18} className="text-red-600" /> ডোনার অভিজ্ঞতা
               </h3>
               <div className="space-y-4">
                 {feedbacks.map(f => (
                   <div key={f.id} className="p-6 bg-slate-50/80 rounded-[2rem] border border-slate-200/50 relative group">
                     <Quote size={20} className="absolute top-4 right-4 text-slate-200 group-hover:text-red-100 transition-colors" />
                     <p className="text-slate-600 font-medium italic text-sm leading-relaxed relative z-10">"{f.message}"</p>
                     <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Shared on {new Date(f.timestamp).toLocaleDateString()}</p>
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-dashed border-slate-100 text-slate-400 font-medium text-[10px] uppercase tracking-widest">
            Verification Hash ID: {member.id} <br/> Generated: {new Date().toLocaleString()}
          </div>
        </Card>
      </div>
    </div>
  );
};
