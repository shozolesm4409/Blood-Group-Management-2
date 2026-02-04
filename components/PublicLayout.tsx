
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLandingConfig } from '../services/api';
import { LandingPageConfig } from '../types';
import { Droplet, LogIn } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
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
    ctaButtonText: 'এখনই শুরু করুন',
    navbarLinks: [{ label: 'ফিডব্যাক', path: '/public-feedbacks' }],
    footerLinks: [{ label: 'Privacy Policy', path: '#' }],
    footerCopyright: '© ২০২৬ BLOODLINK MANAGER',
    footerTagline: 'প্রতিটি ফোঁটা একটি জীবনের আশা।'
  });

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(prev => ({
        ...prev,
        ...data,
        navbarLinks: data.navbarLinks || prev.navbarLinks,
        footerLinks: data.footerLinks || prev.footerLinks,
        footerCopyright: data.footerCopyright || prev.footerCopyright,
        footerTagline: data.footerTagline || prev.footerTagline
      }));
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-slate-100 px-[5%] py-4 flex justify-between items-center h-16 lg:h-20 transition-all">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200 group-hover:scale-105 transition-transform">
            <Droplet className="text-white fill-current" size={24} />
          </div>
          <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">BloodLink</span>
        </Link>
        <div className="flex items-center gap-4 lg:gap-8">
          {config.navbarLinks?.map((link, idx) => (
            <Link key={idx} to={link.path} className="text-slate-600 font-bold text-sm hover:text-red-600 transition-colors hidden sm:block">
              {link.label}
            </Link>
          ))}
          <div className="flex items-center">
            <Link to="/login" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-full font-black text-sm hover:bg-black hover:scale-105 transition-all shadow-md shadow-slate-200 active:scale-95 group">
              <LogIn size={16} className="group-hover:translate-x-1 transition-transform" /> সাইন ইন
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-16 lg:pt-20 min-h-[60vh]">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-6 px-[5%] flex flex-col items-center">
        <Link to="/" className="flex items-center gap-2 mb-3 animate-in fade-in duration-700">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md shadow-red-200">
            <Droplet className="text-white fill-current" size={18} />
          </div>
          <span className="text-lg font-black text-slate-900 tracking-tighter">BloodLink</span>
        </Link>
        
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
          {config.footerLinks?.map((link, idx) => (
            <Link key={idx} to={link.path} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="w-full max-w-4xl pt-4 border-t border-slate-50 text-center">
           <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-slate-400">
             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em]">
               {config.footerCopyright}
             </span>
             <span className="hidden md:inline-block opacity-30">—</span>
             <span className="text-[9px] md:text-[10px] font-bold text-slate-400 opacity-80">
               {config.footerTagline}
             </span>
           </div>
        </div>
      </footer>
    </div>
  );
};
