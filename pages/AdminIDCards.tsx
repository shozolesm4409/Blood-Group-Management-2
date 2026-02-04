
import React, { useEffect, useState, useRef } from 'react';
import { getUsers } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { User, UserRole } from '../types';
import { Download, Droplet, User as UserIcon, ShieldCheck, Printer, QrCode } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import clsx from 'clsx';

export const IDCardFrame = React.forwardRef<HTMLDivElement, { user: User }>(({ user }, ref) => {
  // Use the full window location to construct the verification URL
  const verificationUrl = `${window.location.origin}/#/verify/${user.idNumber || 'INVALID'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <div 
      ref={ref}
      className="id-card-container relative w-[340px] h-[550px] bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col font-sans select-none border border-slate-100"
    >
      {/* Top Section - Deep Navy */}
      <div className="h-[210px] bg-[#001f3f] relative flex flex-col items-center pt-8 overflow-hidden">
        {/* Branding with Integrated Logo */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Droplet className="text-[#880e0e] fill-current" size={20} />
            </div>
            <h3 className="text-white font-black tracking-[0.02em] text-[26px] leading-none">BLOODLINK</h3>
          </div>
          <p className="text-[9px] text-[#e11d48] font-black uppercase tracking-[0.2em]">OFFICIAL DIGITAL IDENTITY</p>
        </div>

        {/* Profile Image - Circle with Thick Red Border */}
        <div className="relative mt-5 z-20">
          <div className="w-32 h-32 rounded-full border-[5px] border-[#e11d48] bg-white overflow-hidden shadow-2xl flex items-center justify-center ring-4 ring-black/10">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                className="w-full h-full object-cover" 
                alt={user.name} 
                crossOrigin="anonymous"
              />
            ) : (
              <UserIcon size={56} className="text-slate-200" />
            )}
          </div>
        </div>

        {/* Navy/Red Decorative Wave Layers at bottom of header */}
        <div className="absolute bottom-0 left-0 w-full h-12 z-10">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0.00,49.98 C150.00,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#e11d48' }}></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-10 z-10">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0.00,49.98 C150.00,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#880e0e' }}></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-8 z-10">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0.00,49.98 C150.00,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#ffffff' }}></path>
          </svg>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 bg-white px-8 pt-2 flex flex-col items-center relative">
        {/* Subtle Blood Logo Watermark (জলসাফ) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
          <Droplet size={200} className="text-[#e11d48] fill-current" />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h4 className="text-[24px] font-black text-[#001f3f] tracking-tight leading-tight uppercase text-center mt-2">
            {user.name}
          </h4>
          
          {/* Designation Badge */}
          <div className="mt-1.5 mb-3.5">
            <div className={clsx(
              "px-6 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.1em] shadow-md border ring-4 ring-white",
              user.role === UserRole.SUPERADMIN ? "bg-purple-600 text-white border-purple-700" :
              user.role === UserRole.ADMIN ? "bg-[#e11d48] text-white border-red-700" :
              user.role === UserRole.EDITOR ? "bg-[#001f3f] text-white border-slate-800" :
              "bg-green-600 text-white border-green-700"
            )}>
              {user.role === UserRole.SUPERADMIN ? 'Administrator' : 
               user.role === UserRole.ADMIN ? 'System Admin' : 
               user.role === UserRole.EDITOR ? 'System Editor' : 'Verified Donor'}
            </div>
          </div>

          {/* Data List - Font size increased to 13px as requested */}
          <div className="w-full space-y-1.5 px-4 mt-1 mb-8">
            <DataRow label="ID No" value={user.idNumber || 'BL-000000'} />
            <DataRow label="Group" value={user.bloodGroup} />
            <DataRow label="Phone" value={user.phone || 'N/A'} />
            <DataRow label="Email" value={user.email} />
            <DataRow label="Join" value={new Date().toLocaleDateString('en-GB')} />
            <DataRow label="Expire" value={new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toLocaleDateString('en-GB')} />
          </div>
        </div>
      </div>

      {/* Footer Section with Reverse Wave */}
      <div className="h-[90px] relative overflow-hidden bg-white flex items-end">
        {/* Wave background */}
        <div className="absolute top-0 left-0 w-full h-8 transform rotate-180">
          <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0.00,49.98 C150.00,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#e11d48' }}></path>
          </svg>
        </div>
        <div className="absolute top-0 left-0 w-full h-6 transform rotate-180">
           <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0.00,49.98 C150.00,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: 'none', fill: '#001f3f' }}></path>
          </svg>
        </div>

        <div className="w-full px-10 pb-4 flex items-center justify-between z-10">
           <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">VERIFIED IDENTITY</span>
              <span className="text-[7px] font-bold text-slate-300 mt-1">Official BloodLink Network Secure Access</span>
           </div>
           <div className="w-14 h-14 bg-white rounded-lg border border-slate-100 p-0.5 shadow-md">
              <img src={qrUrl} alt="QR" className="w-full h-full object-contain" crossOrigin="anonymous" />
           </div>
        </div>
      </div>
    </div>
  );
});

const DataRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex text-[13px] font-bold items-start leading-tight py-0">
    <span className="w-20 text-slate-500 uppercase tracking-tight whitespace-nowrap flex-shrink-0">{label}</span>
    <span className="text-slate-400 mr-4 font-black flex-shrink-0">:</span>
    <span className="flex-1 text-[#001f3f] font-black break-words leading-tight">{value}</span>
  </div>
);

export const AdminIDCards = () => {
  const [registry, setRegistry] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'TEAM'>('ALL');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    getUsers().then(users => {
      setRegistry(users);
      setLoading(false);
    });
  }, []);

  const filteredRegistry = filter === 'TEAM' 
    ? registry.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.EDITOR || u.role === UserRole.SUPERADMIN)
    : registry;

  const downloadAsJpg = async (userId: string, name: string) => {
    const el = cardRefs.current[userId];
    if (!el) return;
    
    try {
      await new Promise(r => setTimeout(r, 250));
      
      const dataUrl = await toJpeg(el, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        pixelRatio: 4,
        cacheBust: true,
      });
      
      const link = document.createElement('a');
      link.download = `BloodLink-ID-${name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert("Capture failed. This usually happens due to browser safety restrictions on external images.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-14 h-14 border-[5px] border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">Processing Database...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto px-4 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-100 pb-12 no-print">
        <div className="text-center md:text-left">
           <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full mb-4">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Digital Registry Hub</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-[-0.04em]">Staff Identity System</h1>
           <p className="text-slate-500 font-medium mt-2 max-w-lg">Manage and download high-resolution identification tokens for verified community members.</p>
        </div>
        <div className="flex items-center gap-4">
           <select 
             value={filter} 
             onChange={(e) => setFilter(e.target.value as any)}
             className="bg-white border border-slate-200 px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-red-500/10 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
           >
             <option value="ALL">All Registered</option>
             <option value="TEAM">Core Staff</option>
           </select>
           <Button onClick={() => window.print()} className="rounded-[1.5rem] px-10 shadow-2xl bg-[#001f3f] hover:bg-black py-5 group border-0">
              <Printer size={20} className="mr-3 group-hover:scale-110 transition-transform" /> Print Batch
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24 place-items-center">
        {filteredRegistry.map(member => (
          <div key={member.id} className="relative group flex flex-col items-center animate-in fade-in slide-in-from-bottom-10 duration-700">
             <div className="mb-10 transition-transform duration-500 group-hover:-translate-y-2">
                <IDCardFrame user={member} ref={el => { cardRefs.current[member.id] = el; }} />
             </div>
             
             <div className="flex flex-col items-center gap-4 no-print w-full max-w-[280px]">
                <button 
                  onClick={() => downloadAsJpg(member.id, member.name)}
                  className="w-full bg-white border border-slate-100 p-5 rounded-[2.5rem] shadow-lg hover:shadow-xl hover:border-[#001f3f] transition-all flex items-center justify-center gap-4 group/btn active:scale-95"
                >
                   <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover/btn:bg-[#001f3f] group-hover/btn:text-white transition-colors">
                      <Download size={20} />
                   </div>
                   <div className="text-left">
                      <p className="text-[11px] font-black text-[#001f3f] uppercase tracking-widest leading-none mb-1">Download Token</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">High Res JPG</p>
                   </div>
                </button>
             </div>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, button, .no-print, select { display: none !important; }
          body, main { background: white !important; padding: 0 !important; margin: 0 !important; }
          .grid { display: block !important; }
          .id-card-container { 
            margin: 60px auto !important; 
            page-break-inside: avoid !important; 
            box-shadow: none !important;
            border: 1px solid #eee !important;
            transform: scale(1);
          }
        }
      `}} />
    </div>
  );
};
