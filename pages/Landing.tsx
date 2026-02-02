
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from '@firebase/firestore';
import { db, subscribeToApprovedFeedbacks, getLandingConfig, getCachedFeedbacks } from '../services/api';
import { DonationStatus, DonationFeedback, LandingPageConfig } from '../types';
import { Droplet, Users, HeartPulse, Activity, Quote, User as UserIcon, Calendar, ArrowRight, MessageSquareQuote } from 'lucide-react';

export const Landing = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolume: 0
  });
  
  // Instant load from JSON cache stored in localStorage
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
    // 1. Load Landing Page Configuration (Public)
    getLandingConfig().then(data => {
      if (data) setConfig(data);
    });

    // 2. Statistics Listeners (Public Read - Works without Auth now)
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

    // 3. Feedback Subscription (Instant UI update & Cache Sync)
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
    <div className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-[5%] py-4 flex justify-between items-center h-16 lg:h-20 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <Droplet className="text-white fill-current" size={24} />
          </div>
          <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">BloodLink</span>
        </div>
        <div className="flex items-center gap-6 lg:gap-10">
          <Link to="/public-feedbacks" className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors flex items-center gap-2">
            <MessageSquareQuote size={18} /> ফিডব্যাক
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors">লগইন</Link>
            <Link to="/register" className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm lg:text-base hover:bg-red-700 hover:scale-105 transition-all shadow-md shadow-red-100">রেজিস্ট্রেশন</Link>
          </div>
        </div>
      </header>

      <main className="pt-16 lg:pt-20">
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
              <Link to="/register" className="bg-white text-[#c1121f] px-10 py-4 rounded-full font-black text-lg shadow-2xl hover:bg-slate-50 transition-all text-center">
                {config.heroButtonPrimary}
              </Link>
              <Link to="/login" className="bg-transparent border-2 border-white/40 backdrop-blur-sm text-white px-10 py-4 rounded-full font-black text-lg hover:bg-white/10 transition-all text-center">
                {config.heroButtonSecondary}
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

        <section className="py-20 lg:py-32 px-[5%] bg-slate-50 min-h-[400px]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                {config.feedbackSectionTitle}
              </h2>
              <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full"></div>
              <p className="mt-4 text-slate-500 font-medium italic">
                {config.feedbackSectionSubtitle}
              </p>
            </div>

            {feedbacks.length > 0 ? (
              <div className="animate-in fade-in duration-500">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-400 font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-8 py-5">নাম</th>
                          <th className="px-8 py-5">মতামত / মেসেজ</th>
                          <th className="px-8 py-5 text-right">তারিখ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {feedbacks.slice(0, 5).map(f => (
                          <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                                  {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" alt={f.userName} /> : <UserIcon className="p-3 text-slate-300 w-full h-full" />}
                                </div>
                                <span className="font-black text-slate-900 text-base">{f.userName}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <p className="text-slate-600 font-medium italic leading-relaxed">"{f.message}"</p>
                            </td>
                            <td className="px-8 py-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 text-slate-400 font-bold">
                                <Calendar size={14} />
                                <span>{new Date(f.timestamp).toLocaleDateString()}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <Link to="/public-feedbacks" className="inline-flex items-center gap-2 text-red-600 font-black uppercase tracking-widest text-sm hover:gap-4 transition-all">
                    সবগুলো অভিজ্ঞতা দেখুন <ArrowRight size={20} />
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
            <Link to="/login" className="bg-red-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2">
              {config.ctaButtonText} <ArrowRight size={24} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 text-slate-400 py-16 text-center text-sm font-bold">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Droplet className="text-red-600" size={20} />
          <span className="text-slate-900 font-black tracking-tighter text-xl">BloodLink</span>
        </div>
        <p>© ২০২৬ BloodLink Manager — প্রতিটি ফোঁটা একটি জীবনের আশা। সকল অধিকার সংরক্ষিত।</p>
      </footer>
    </div>
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
