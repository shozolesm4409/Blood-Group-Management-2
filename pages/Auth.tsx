
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { login as apiLogin, register as apiRegister, resetPassword, getLandingConfig } from '../services/api';
import { Button } from '../components/UI';
import { Droplet, AlertCircle, ArrowLeft, User, Lock, Mail, Phone, MapPin } from 'lucide-react';
import { BLOOD_GROUPS } from '../constants';
import { LandingPageConfig } from '../types';

const AuthLayout = ({ children, title, subtitle, headline, description, isLogin, styles }: any) => {
  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center p-3 lg:p-6 font-sans selection:bg-red-100">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-lg text-slate-700 font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] border border-white hover:bg-slate-50 hover:text-red-600 hover:scale-105 transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          হোমপেজে ফিরুন
        </Link>
      </div>

      <div 
        className="w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row h-auto relative border border-slate-100"
        style={{ marginTop: styles?.margin ?? 56, marginBottom: styles?.margin ?? 16 }}
      >
        <div className="lg:w-[38%] bg-gradient-to-br from-[#c1121f] to-[#780116] relative overflow-hidden flex flex-col justify-center p-8 lg:p-10 text-white order-2 lg:order-1">
          <div className="absolute top-[-5%] left-[-5%] w-[250px] h-[250px] bg-red-400 rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-[5%] right-[-10%] w-[200px] h-[200px] bg-orange-400 rounded-full mix-blend-screen filter blur-[100px] opacity-15"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center mb-2 border border-white/20 shadow-inner">
              <Droplet className="text-white fill-current" size={28} />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none drop-shadow-xl">
                {headline || "WELCOME"}
              </h2>
              <h3 className="text-sm lg:text-base font-bold opacity-90 uppercase tracking-[0.15em] text-red-100">
                BloodLink Manager
              </h3>
            </div>
            
            <div className="w-12 h-1 bg-white/20 rounded-full"></div>
            
            <p className="text-red-50 text-xs lg:text-sm leading-relaxed max-w-sm font-medium opacity-80 whitespace-pre-wrap">
              {description || "রক্তের প্রতিটি ফোঁটা একটি জীবনের সম্ভাবনা। আজই আমাদের কমিউনিটিতে যোগ দিন এবং জীবন বাঁচানোর মহান উদ্যোগে অংশ নিন।"}
            </p>
          </div>
          <div className="absolute bottom-[-40px] left-[-20px] w-52 h-52 rounded-full bg-gradient-to-tr from-[#660000] to-transparent opacity-40"></div>
        </div>

        <div className="lg:w-[62%] flex flex-col justify-center bg-white order-1 lg:order-2 relative" style={{ padding: styles?.padding ?? 40 }}>
          <div className="max-w-md mx-auto w-full relative z-10">
            <div className="mb-4 lg:mb-6">
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-1 tracking-tight">{title}</h1>
              <p className="text-slate-400 font-bold text-[9px] lg:text-[10px] uppercase tracking-[0.2em] opacity-60">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomInput = ({ icon: Icon, type = "text", name, placeholder, value, onChange, showPasswordToggle, onToggleShow }: any) => (
  <div className="mb-3 lg:mb-4">
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors pointer-events-none">
        <Icon size={18} />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full pl-11 pr-16 py-3.5 lg:py-4 bg-[#f8fafc] border-2 border-transparent rounded-[1.25rem] text-slate-900 font-bold text-sm lg:text-base focus:bg-white focus:border-red-600/30 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium shadow-sm"
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-xs lg:text-sm font-black uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors"
        >
          {type === 'password' ? 'SHOW' : 'HIDE'}
        </button>
      )}
    </div>
  </div>
);

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  useEffect(() => {
    getLandingConfig().then(setConfig);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const pwd = formData.get('password') as string;
    try {
      const user = await apiLogin(email, pwd);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError("ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={config?.loginTitle || "Sign in"}
      subtitle={config?.loginSubtitle || "LOG IN TO ACCESS YOUR DONOR DASHBOARD"}
      headline={config?.loginHeadline || "WELCOME"}
      description={config?.loginDescription}
      isLogin={true}
      styles={config?.loginStyles}
    >
      <form onSubmit={handleSubmit}>
        <CustomInput icon={User} type="email" name="email" placeholder="User Name / Email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
        <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" showPasswordToggle onToggleShow={() => setShowPassword(!showPassword)} />
        <div className="flex items-center justify-between mb-6 lg:mb-8 px-2">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center">
              <input type="checkbox" className="peer w-4.5 h-4.5 opacity-0 absolute cursor-pointer" />
              <div className="w-4.5 h-4.5 border-2 border-slate-200 rounded-md peer-checked:bg-red-600 peer-checked:border-red-600 transition-all shadow-sm"></div>
              <CheckIcon className="absolute left-0.5 text-white scale-0 peer-checked:scale-100 transition-transform" />
            </div>
            <span className="text-xs lg:text-sm font-bold text-slate-500 group-hover:text-slate-700">Remember me</span>
          </label>
          <button type="button" onClick={() => navigate('/reset')} className="text-sm lg:text-base font-black text-red-600 hover:underline">Forgot Password?</button>
        </div>
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-4 lg:py-5 rounded-[1.25rem] font-black uppercase tracking-[0.25em] text-base lg:text-lg shadow-xl shadow-red-900/20 hover:bg-[#a0101a] transition-all disabled:opacity-50">
          {loading ? "Signing In..." : (config?.loginButtonLabel || "SIGN IN")}
        </button>
        <p className="text-center text-sm lg:text-base font-bold text-slate-400 mt-6 lg:mt-8">
          Don't have an account? <Link to="/register" className="text-red-600 font-black hover:underline ml-1 text-base lg:text-lg">Sign Up</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="10" height="8" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 5.5L4.5 9L11 1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);

  useEffect(() => {
    getLandingConfig().then(setConfig);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    if (data.password !== data.confirmPassword) {
      setError("পাসওয়ার্ড মেলেনি।");
      setLoading(false);
      return;
    }
    try {
      const user = await apiRegister(data);
      login(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={config?.registerTitle || "Join Now"}
      subtitle={config?.registerSubtitle || "রক্তদাতা হিসেবে নিবন্ধন করুন এবং জীবন বাঁচান"}
      headline={config?.registerHeadline || "JOIN US"}
      description={config?.registerDescription}
      isLogin={false}
      styles={config?.signupStyles}
    >
      <form onSubmit={handleSubmit} className="space-y-0.5">
        <CustomInput icon={User} name="name" placeholder="আপনার পূর্ণ নাম" />
        <CustomInput icon={Mail} type="email" name="email" placeholder="ইমেইল এড্রেস" />
        <div className="grid grid-cols-2 gap-3 mb-2 lg:mb-3">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
              <Droplet size={18} />
            </div>
            <select name="bloodGroup" required className="w-full pl-11 pr-3 py-3.5 lg:py-4 bg-[#f8fafc] border-2 border-transparent rounded-[1.25rem] text-slate-900 font-bold text-sm focus:bg-white focus:border-red-600/30 outline-none appearance-none cursor-pointer shadow-sm">
              <option value="">রক্তের গ্রুপ</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
              <Phone size={18} />
            </div>
            <input name="phone" placeholder="ফোন নম্বর" required className="w-full pl-11 pr-3 py-3.5 lg:py-4 bg-[#f8fafc] border-2 border-transparent rounded-[1.25rem] text-slate-900 font-bold text-sm focus:ring-2 focus:ring-red-500 shadow-sm" />
          </div>
        </div>
        <CustomInput icon={MapPin} name="location" placeholder="বর্তমান এলাকা/শহর" />
        <div className="grid grid-cols-2 gap-3">
          <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="password" placeholder="পাসওয়ার্ড" showPasswordToggle onToggleShow={() => setShowPassword(!showPassword)} />
          <CustomInput icon={Lock} type={showPassword ? 'text' : 'password'} name="confirmPassword" placeholder="নিশ্চিত করুন" />
        </div>
        {error && (
          <div className="p-3.5 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full bg-[#c1121f] text-white py-4 lg:py-5 rounded-[1.25rem] font-black uppercase tracking-[0.25em] text-sm lg:text-base shadow-xl shadow-red-900/20 hover:bg-[#a0101a] transition-all disabled:opacity-50 mt-4">
          {loading ? "Creating Account..." : (config?.registerButtonLabel || "CREATE ACCOUNT")}
        </button>
        <p className="text-center text-sm lg:text-base font-bold text-slate-400 pt-6 lg:pt-8">
          Already have an account? <Link to="/login" className="text-red-600 font-black hover:underline text-base lg:text-lg ml-1">Sign In</Link>
        </p>
      </form>
    </AuthLayout>
  );
};
