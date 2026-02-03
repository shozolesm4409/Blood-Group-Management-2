
import React, { useEffect, useState, useRef } from 'react';
import { getUsers } from '../services/api';
import { Card, Button, Badge } from '../components/UI';
import { User, UserRole } from '../types';
import { Download, Droplet, User as UserIcon, ShieldCheck, Mail, Phone, MapPin, Printer, QrCode } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import clsx from 'clsx';

export const IDCardFrame = React.forwardRef<HTMLDivElement, { user: User }>(({ user }, ref) => {
  // Use the full window location to construct the verification URL
  const verificationUrl = `${window.location.origin}/#/verify/${user.idNumber || 'INVALID'}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <div 
      ref={ref}
      className="id-card-container relative w-[320px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col font-sans select-none"
    >
      {/* Top Brand Area (Deep Red Theme) */}
      <div className="h-[150px] bg-[#991b1b] relative overflow-hidden">
        {/* Decorative Professional Curves */}
        <div className="absolute top-0 right-0 w-full h-full">
           <div className="absolute top-[-20%] right-[-10%] w-[120%] h-[120%] bg-red-900 rounded-[5rem] rotate-[15deg] opacity-40"></div>
           <div className="absolute top-[10%] right-[-30%] w-[100%] h-[100%] bg-red-400/20 rounded-[5rem] rotate-[-10deg]"></div>
        </div>
        
        {/* Logo & Org Name - Positioned higher to ensure visibility with larger photo */}
        <div className="relative z-10 pt-4 px-5 flex flex-col items-center">
           <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-2xl mb-1 ring-4 ring-white/10">
              <Droplet size={22} className="text-red-600 fill-current" />
           </div>
           <h3 className="text-white font-black tracking-tighter text-xl leading-none">BLOODLINK</h3>
           <p className="text-[7px] text-red-100 font-black uppercase tracking-[0.3em] mt-1 opacity-90">Official Digital Identity</p>
        </div>
      </div>

      {/* Profile Photo Area - Increased size (w-24) and adjusted positioning */}
      <div className="relative z-20 -mt-12 flex justify-center">
         <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-2xl ring-1 ring-slate-100">
            <div className="w-full h-full bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border-2 border-white">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  className="w-full h-full object-cover" 
                  alt={user.name} 
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2JkNTVlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE5IDIxdjItMmExMCAxMCAwIDAgMC0yMCAwdi0yYTEwIDEwIDAgMCAxIDEwLTExWiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==';
                  }}
                />
              ) : (
                <UserIcon size={36} className="text-slate-300" />
              )}
            </div>
         </div>
      </div>

      {/* User Identity Details */}
      <div className="flex-1 px-8 pt-4 pb-4 flex flex-col items-center text-center">
         <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase mb-1">{user.name}</h4>
         <div className="mb-4">
           <Badge color={user.role === UserRole.USER ? 'red' : 'blue'} className="text-[8px] px-2.5 py-0.5 shadow-sm border border-white">
             {user.role === UserRole.USER ? 'VERIFIED DONOR' : `SYSTEM ${user.role}`}
           </Badge>
         </div>

         {/* Pushed these blocks down as requested using mt-4 */}
         <div className="w-full space-y-2 mt-4">
            <div className="flex items-center justify-between bg-red-50/60 px-4 py-2 rounded-xl border border-red-100/50 shadow-sm">
               <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">BL ID</span>
               <span className="text-[11px] font-black text-red-700 tracking-wider">{user.idNumber || 'BL-XXXXXX'}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-100/50">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</span>
               <span className="text-[11px] font-bold text-slate-700">{user.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-100/50">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Group</span>
               <span className="text-[11px] font-black text-red-600">{user.bloodGroup}</span>
            </div>
         </div>
      </div>

      {/* Footer Section with Verification QR */}
      <div className="h-[80px] bg-slate-50 border-t border-slate-100 px-6 flex items-center justify-between relative overflow-hidden">
         <div className="absolute bottom-0 right-0 w-24 h-24 bg-red-600/5 rounded-full -mb-12 -mr-12"></div>
         
         <div className="flex-1 text-left">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Identity Verified</p>
            <p className="text-[7px] font-bold text-slate-400 max-w-[150px] leading-tight">Scan to verify donor status on our official network.</p>
         </div>
         <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shadow-md p-1">
            <img src={qrUrl} alt="Verification QR" className="w-full h-full object-contain" crossOrigin="anonymous" />
         </div>
      </div>
      
      {/* Side Security Mark */}
      <div className="absolute left-0 top-[160px] w-1.5 h-20 bg-red-600 rounded-r-full shadow-md"></div>
    </div>
  );
});

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
    ? registry.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.EDITOR)
    : registry;

  const downloadAsJpg = async (userId: string, name: string) => {
    const el = cardRefs.current[userId];
    if (!el) return;
    
    try {
      // Small buffer to ensure images are ready
      await new Promise(r => setTimeout(r, 100));
      
      const dataUrl = await toJpeg(el, { 
        quality: 1, 
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `BloodLink-ID-${name.replace(/\s+/g, '-').toLowerCase()}-${userId}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert("Download failed. This is likely due to browser CORS security with the profile image. Please try again or use the print function.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Generating Registry...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-100 pb-8 no-print">
        <div>
           <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Identity Management</h1>
           <p className="text-slate-500 font-medium">Verify and download official secure identity cards for all users.</p>
        </div>
        <div className="flex items-center gap-4">
           <select 
             value={filter} 
             onChange={(e) => setFilter(e.target.value as any)}
             className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-red-500/10 shadow-sm transition-all"
           >
             <option value="ALL">All Registered Members</option>
             <option value="TEAM">Core Staff Team</option>
           </select>
           <Button onClick={() => window.print()} className="rounded-2xl px-10 shadow-2xl bg-slate-900 hover:bg-black py-4">
              <Printer size={20} className="mr-2" /> Print Bulk
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 place-items-center">
        {filteredRegistry.map(member => (
          <div key={member.id} className="relative group flex flex-col items-center transition-all duration-300">
             <div className="mb-4">
                <IDCardFrame user={member} ref={el => cardRefs.current[member.id] = el} />
             </div>
             
             <div className="flex items-center gap-4 no-print">
                <Badge color="gray" className="text-[10px] font-black px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm">
                   ID: {member.idNumber || 'N/A'}
                </Badge>
                <button 
                  onClick={() => downloadAsJpg(member.id, member.name)}
                  className="bg-white border border-slate-200 p-4 rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-red-600 transition-all flex items-center gap-3 group/btn active:scale-95"
                >
                   <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover/btn:bg-red-600 group-hover/btn:text-white transition-colors shadow-inner">
                      <Download size={20} />
                   </div>
                   <div className="text-left pr-4">
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-0.5">Download</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Identity JPG</p>
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
            margin: 40px auto !important; 
            page-break-inside: avoid !important; 
            box-shadow: none !important;
            border: 1px solid #eee !important;
            transform: scale(0.9);
          }
        }
      `}} />
    </div>
  );
};
