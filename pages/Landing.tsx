
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from '@firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from '@firebase/auth';
import { auth } from '../services/firebase';
import { db, subscribeToApprovedFeedbacks, getLandingConfig } from '../services/api';
import { DonationStatus, DonationFeedback, LandingPageConfig } from '../types';
import { Droplet, Users, HeartPulse, Activity, Quote, User as UserIcon, Calendar, ArrowRight } from 'lucide-react';

export const Landing = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalVolume: 0
  });
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
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
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeDonations: (() => void) | undefined;
    let unsubscribeFeedbacks: (() => void) | undefined;

    // Load initial config
    getLandingConfig().then(data => {
      if (data) setConfig(data);
    });

    // We use onAuthStateChanged to ensure we have a valid auth token (even anonymous)
    // before we start the Firestore listeners to avoid Permission Denied errors.
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLive(true);
        
        // 1. Start Users Listener (Total Community Members)
        unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
        }, (error) => {
          console.error("Firestore Users Error:", error);
        });

        // 2. Start Donations Listener (Donor Counts & Volume)
        unsubscribeDonations = onSnapshot(collection(db, 'donations'), (snapshot) => {
          const donationDocs = snapshot.docs.map(doc => doc.data());
          const completedDonations = donationDocs.filter(d => d.status === DonationStatus.COMPLETED);
          
          const totalVolume = completedDonations.reduce((acc, curr) => acc + (Number(curr.units) || 0), 0);
          const uniqueDonorIds = new Set(completedDonations.map(d => d.userId));
          
          setStats(prev => ({ 
            ...prev, 
            totalDonors: uniqueDonorIds.size, 
            totalVolume: totalVolume 
          }));
          setLoading(false);
        }, (error) => {
          console.error("Firestore Donations Error:", error);
          setLoading(false);
        });

        // 3. Start Approved Feedbacks Listener (Visible only)
        unsubscribeFeedbacks = subscribeToApprovedFeedbacks((data) => {
          setFeedbacks(data);
        });
      } else {
        // If no user is present, sign in anonymously to satisfy Firestore "auth != null" rules
        signInAnonymously(auth).catch(err => {
          console.error("Anonymous auth failed:", err);
          setLoading(false);
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeDonations) unsubscribeDonations();
      if (unsubscribeFeedbacks) unsubscribeFeedbacks();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-[5%] py-4 flex justify-between items-center h-16 lg:h-20 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
            <Droplet className="text-white fill-current" size={24} />
          </div>
          <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">BloodLink</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors">লগইন</Link>
          <Link to="/register" className="bg-red-600 text-white px-6 py-2 rounded-full font-bold text-sm lg:text-base hover:bg-red-700 hover:scale-105 transition-all shadow-md shadow-red-100">রেজিস্ট্রেশন</Link>
        </div>
      </header>

      <main className="pt-16 lg:pt-20">
        {/* Hero Section */}
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

        {/* Real-time Statistics Section */}
        <section className="py-20 lg:py-32 px-[5%] bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full mb-4">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest">{isLive ? 'Live Connection Active' : 'Connecting to Database...'}</span>
              </div>
              <h2 className="text-2xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                {config.statsSectionTitle}
              </h2>
              <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              <StatCard value={loading ? '...' : stats.totalUsers} label="মোট মেম্বার" icon={Users} />
              <StatCard value={loading ? '...' : stats.totalDonors} label="সফল ডোনার" icon={Activity} />
              <StatCard value={loading ? '...' : `${stats.totalVolume.toLocaleString()} ml`} label="সংগৃহীত রক্ত" icon={HeartPulse} />
            </div>
          </div>
        </section>

        {/* Experience Feedback Section (Only Visible approved feedbacks) */}
        {feedbacks.length > 0 && (
          <section className="py-20 lg:py-32 px-[5%] bg-slate-50">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbacks.map(f => (
                  <div key={f.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-xl transition-all group">
                    <div>
                      <Quote className="text-red-100 group-hover:text-red-200 transition-colors mb-4" size={48} />
                      <p className="text-slate-600 font-medium italic leading-relaxed mb-6">"{f.message}"</p>
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2.5 text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm">{f.userName}</p>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(f.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
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
