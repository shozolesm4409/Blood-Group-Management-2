
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from '@firebase/firestore';
import { db, subscribeToApprovedFeedbacks, getLandingConfig, getCachedFeedbacks } from '../services/api';
import { DonationStatus, DonationFeedback, LandingPageConfig } from '../types';
import { Droplet, Users, HeartPulse, Activity, User as UserIcon, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';

export const Landing = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolume: 0
  });
  
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>(getCachedFeedbacks());
  
  const [config, setConfig] = useState<LandingPageConfig>({
    heroTitle: 'এক ফোঁটা রক্ত\nহাজারো জীবনের আশা',
    heroSubtitle: 'রক্তদাতা ও প্রয়োজনের মাঝে সবচেয়ে দ্রুত ও নিরাপদ সেতু। আজই আমাদের কমিউনিটিতে যোগ দিন — একটি জীবন বাঁচানোর মহান সুযোগ নিন।',
    heroButtonPrimary: 'রক্তদাতা হিসেবে নিবন্ধন',
    heroButtonSecondary: 'রক্তের অনুরোধ করুন',
    statsSectionTitle: 'আমাদের লাইভ পরিসংখ্যান',
    feedbackSectionTitle: 'ডোনারদের বাস্তব অভিজ্ঞতা',
    feedbackSectionSubtitle: 'সফল রক্তদাতাদের শেয়ার করা অনুপ্রেরণামূলক গল্পসমূহ',
    ctaTitle: 'রক্তের জরুরি প্রয়োজন?',
    ctaSubtitle: 'আমাদের শক্তিশালী ডিরেক্টরি ব্যবহার করে মুহূর্তের মধ্যে নিকটস্থ রক্তদাতাদের সাথে যোগাযোগ করুন।',
    ctaButtonText: 'এখনই শুরু করুন'
  });
  
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(prev => ({ ...prev, ...data }));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
      setLoadingStats(false);
    }, (error) => {
      console.debug("Users stats restricted:", error);
    });

    const unsubDons = onSnapshot(collection(db, 'donations'), (snapshot) => {
      const donationDocs = snapshot.docs.map(doc => doc.data());
      const completedDonations = donationDocs.filter(d => d.status === DonationStatus.COMPLETED);
      const totalVolume = completedDonations.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
      const uniqueDonorIds = new Set(completedDonations.map(d => d.userId));
      
      setStats(prev => ({ 
        ...prev, 
        totalDonors: uniqueDonorIds.size, 
        totalVolume: totalVolume 
      }));
    }, (error) => {
      console.debug("Donations stats restricted:", error);
    });

    const unsubscribeFeedbacks = subscribeToApprovedFeedbacks((data) => {
      setFeedbacks(data);
    });

    return () => {
      unsubUsers();
      unsubDons();
      unsubscribeFeedbacks();
    };
  }, []);

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-[#c1121f] to-[#e63946] text-white text-center py-24 lg:py-40 px-[5%] flex flex-col items-center relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none overflow-hidden">
          <Droplet className="absolute top-10 left-[10%] rotate-12" size={120} />
          <Droplet className="absolute bottom-20 right-[15%] -rotate-12" size={160} />
        </div>
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-4xl lg:text-7xl font-black leading-[1.1] mb-6 animate-fade-in-up whitespace-pre-line">
            {config.heroTitle}
          </h1>
          <p className="text-lg lg:text-2xl opacity-90 max-w-2xl mx-auto mb-12 font-medium leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {config.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link to="/register" className="bg-white text-[#c1121f] px-8 py-4 rounded-full font-black text-base lg:text-lg shadow-2xl hover:bg-slate-50 transition-all text-center flex items-center justify-center gap-2 group">
              {config.heroButtonPrimary} <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link to="/login" className="bg-transparent border-2 border-white/40 backdrop-blur-sm text-white px-8 py-4 rounded-full font-black text-base lg:text-lg hover:bg-white/10 transition-all text-center flex items-center justify-center">
              {config.heroButtonSecondary}
            </Link>
            <Link to="/verify" className="bg-slate-900/40 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-black text-base lg:text-lg hover:bg-slate-900/60 transition-all text-center flex items-center justify-center gap-2">
              <ShieldCheck size={20} /> Verify Users
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 px-[5%] bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full mb-4">
              <div className={`w-2 h-2 rounded-full ${!loadingStats ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{!loadingStats ? 'Live Data Sync Active' : 'Connecting to Database...'}</span>
            </div>
            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">
              {config.statsSectionTitle}
            </h2>
            <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <StatCard value={loadingStats ? 0 : stats.totalUsers} label="মোট মেম্বার" icon={Users} />
            <StatCard value={loadingStats ? 0 : stats.totalDonors} label="সফল ডোনার" icon={Activity} />
            <StatCard value={loadingStats ? '0' : `${stats.totalVolume.toLocaleString()} ml`} label="সংগৃহীত রক্ত" icon={HeartPulse} />
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32 px-[5%] bg-[#fcfdfe] min-h-[400px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
              {config.feedbackSectionTitle}
            </h2>
            <div className="w-20 h-2 bg-red-600 mx-auto rounded-full mb-6"></div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm opacity-60">
              {config.feedbackSectionSubtitle}
            </p>
          </div>

          {feedbacks.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {feedbacks.slice(0, 6).map(f => (
                  <div key={f.id} className="bg-white p-8 lg:p-10 rounded-[2.5rem] shadow-[0_15px_50px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all group">
                    <div>
                      <div className="mb-6">
                         <div className="text-[60px] leading-none font-serif text-red-100 select-none">“</div>
                      </div>
                      <p className="text-slate-600 font-medium italic leading-relaxed text-lg mb-8">
                        "{f.message}"
                      </p>
                    </div>
                    
                    <div className="pt-8 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                          {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" alt={f.userName} /> : <UserIcon className="p-3 text-slate-300 w-full h-full" />}
                        </div>
                        <div>
                          <span className="block font-black text-slate-900 text-base leading-tight">{f.userName}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-slate-400" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{new Date(f.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-16 text-center">
                <Link to="/public-feedbacks" className="inline-flex items-center gap-3 text-red-600 font-black uppercase tracking-[0.3em] text-xs hover:gap-5 transition-all px-10 py-5 rounded-full bg-red-50 hover:bg-red-100">
                  সবগুলো অভিজ্ঞতা দেখুন <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <Activity className="animate-spin text-red-600 mb-4" size={32} />
              <p className="font-bold text-slate-400 italic">অভিজ্ঞতাগুলো লোড হচ্ছে...</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-24 bg-slate-900 text-white px-[5%] relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl lg:text-5xl font-black mb-6 tracking-tight">
              {config.ctaTitle}
            </h2>
            <p className="text-slate-400 text-lg lg:text-xl font-medium max-w-xl">
              {config.ctaSubtitle}
            </p>
          </div>
          <Link to="/register" className="bg-red-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2 group">
            {config.ctaButtonText} <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
};

const StatCard = ({ value, label, icon: Icon }: any) => (
  <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] text-center hover:-translate-y-2 transition-transform group flex flex-col items-center">
    <div className="w-16 h-16 bg-red-50 text-[#c1121f] rounded-2xl mb-8 flex items-center justify-center group-hover:scale-110 transition-transform">
      <Icon size={32} />
    </div>
    <div className="text-5xl lg:text-6xl font-black text-[#c1121f] mb-4 tracking-tighter">
      {typeof value === 'number' ? `${value}+` : value}
    </div>
    <div className="text-lg font-bold text-slate-500 uppercase tracking-widest">{label}</div>
  </div>
);
