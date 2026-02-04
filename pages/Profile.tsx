
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { updateUserProfile, changePassword, getAppPermissions, requestIDCardAccess } from '../services/api';
import { Card, Input, Button, Select, Badge, Toast, useToast } from '../components/UI';
import { User, BloodGroup, AppPermissions, UserRole } from '../types';
import { UserCircle, Lock, Camera, Upload, IdCard, Download, X, Clock, ShieldAlert } from 'lucide-react';
import { IDCardFrame } from './AdminIDCards';
import { toJpeg } from 'html-to-image';
import clsx from 'clsx';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');
  const [showCardModal, setShowCardModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getAppPermissions().then(setPerms); }, []);

  if (!user) return null;

  const isRestricted = user.role === UserRole.USER 
    ? perms?.user.rules.canEditProfile === false 
    : (user.role === UserRole.EDITOR ? perms?.editor.rules.canEditProfile === false : false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showToast("Image size must be under 1MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIDCardClick = async () => {
    if (user.hasIDCardAccess) {
      setShowCardModal(true);
    } else if (!user.idCardAccessRequested) {
      setIsRequesting(true);
      try {
        await requestIDCardAccess(user);
        updateUser({ ...user, idCardAccessRequested: true });
        showToast("ID Card access request sent to Admin.");
      } catch (err) {
        showToast("Request failed.", "error");
      } finally {
        setIsRequesting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRestricted) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const updates: Partial<User> = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      location: formData.get('location') as string,
      bloodGroup: formData.get('bloodGroup') as BloodGroup,
      avatar: avatarPreview,
    };

    try {
      const updatedUser = await updateUserProfile(user.id, updates, user);
      updateUser(updatedUser);
      showToast("Profile synchronized successfully.");
    } catch (err) { showToast("Failed to update profile.", "error"); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwdLoading(true);
    const formData = new FormData(e.currentTarget);
    const current = formData.get('currentPassword') as string;
    const newPwd = formData.get('newPassword') as string;
    const confirm = formData.get('confirmPassword') as string;

    if (newPwd !== confirm) {
      showToast("PIN matching error.", "error");
      setPwdLoading(false);
      return;
    }

    try {
      await changePassword(user.id, user.name, current, newPwd);
      showToast("PIN updated successfully.");
      (e.target as HTMLFormElement).reset();
    } catch (err: any) { showToast(err.message || 'Update failed.', "error"); }
    finally { setPwdLoading(false); }
  };

  const downloadIDCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toJpeg(cardRef.current, {
        quality: 1,
        backgroundColor: '#ffffff',
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `BloodLink-ID-${user.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast("ID Card downloaded successfully.");
    } catch (err) {
      console.error('Download error:', err);
      showToast("Download failed. Please try printing to PDF instead.", "error");
    }
  };

  const renderIDCardButton = (isMobile = false) => {
    if (user.hasIDCardAccess) {
      return (
        <Button onClick={handleIDCardClick} variant="outline" className={clsx("rounded-2xl border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 shadow-sm", isMobile ? "w-full mt-6" : "hidden md:flex")}>
          <IdCard className="mr-2" size={18} /> My ID Card
        </Button>
      );
    }
    
    if (user.idCardAccessRequested) {
      return (
        <div className={clsx("inline-flex items-center gap-2 px-6 py-3 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded-2xl font-black text-[10px] uppercase tracking-widest", isMobile ? "w-full mt-6 justify-center" : "hidden md:flex")}>
          <Clock size={16} /> Pending Admin Approval
        </div>
      );
    }

    return (
      <Button onClick={handleIDCardClick} isLoading={isRequesting} className={clsx("rounded-2xl shadow-xl shadow-red-100", isMobile ? "w-full mt-6" : "hidden md:flex")}>
        <ShieldAlert className="mr-2" size={18} /> Request ID Card
      </Button>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex items-center justify-between border-b border-slate-200 pb-8">
         <div className="flex items-center gap-4">
           <div className="p-4 bg-red-600 text-white rounded-[1.5rem] shadow-xl shadow-red-100"><UserCircle size={32} /></div>
           <div><h1 className="text-3xl font-black text-slate-900 tracking-tighter">Profile Management</h1><p className="text-slate-500 font-medium">Update your digital identity and security settings.</p></div>
         </div>
         {renderIDCardButton()}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <Card className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/5 to-transparent pointer-events-none"></div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="relative mb-6">
                <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center border-4 border-white shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                   {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <UserCircle size={64} className="text-slate-200" />}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-red-600 text-white rounded-xl border-4 border-white flex items-center justify-center cursor-pointer hover:bg-red-700 hover:rotate-12 transition-all shadow-xl">
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={isRestricted} />
                </label>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h2>
              <div className="flex items-center gap-2 mt-3">
                <Badge color="red" className="px-4 py-1.5">{user.bloodGroup} Donor</Badge>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.idNumber}</span>
              </div>
              <div className="md:hidden w-full">
                {renderIDCardButton(true)}
              </div>
            </div>
          </Card>
          <Card className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3"><Lock size={16} /> Security Center</h3>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <Input label="Current PIN" name="currentPassword" type="password" required />
              <Input label="New PIN" name="newPassword" type="password" required />
              <Input label="Confirm PIN" name="confirmPassword" type="password" required />
              <Button type="submit" variant="secondary" className="w-full py-4 rounded-2xl" isLoading={pwdLoading}>Change PIN</Button>
            </form>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="p-8 border-0 shadow-xl bg-white rounded-[2.5rem]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3"><Upload size={16} /> Identity Details</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><Input label="BL ID Number (Protected)" value={user.idNumber} disabled className="opacity-50 font-mono" /></div>
              <div className="md:col-span-2"><Input label="Email Address (Locked)" value={user.email} disabled className="opacity-50" /></div>
              <div className="md:col-span-2"><Input label="Full Identity Name" name="name" defaultValue={user.name} disabled={isRestricted} /></div>
              <Input label="Primary Phone" name="phone" defaultValue={user.phone} disabled={isRestricted} />
              <Select label="Blood Group" name="bloodGroup" defaultValue={user.bloodGroup} disabled={isRestricted}>
                   {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </Select>
              <div className="md:col-span-2"><Input label="Current City / Area" name="location" defaultValue={user.location} disabled={isRestricted} /></div>
              <div className="md:col-span-2 pt-6 flex justify-end">
                <Button type="submit" isLoading={loading} disabled={isRestricted} className="px-12 py-5 rounded-2xl shadow-xl shadow-red-100">Synchronize Identity</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {showCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 no-print">
           <div className="max-w-sm w-full animate-in zoom-in-95 duration-200 flex flex-col items-center gap-6">
             <IDCardFrame user={user} ref={cardRef} />
             <div className="flex gap-4 w-full">
               <Button onClick={downloadIDCard} className="flex-1 rounded-2xl py-4 shadow-2xl">
                 <Download size={18} className="mr-2" /> Download JPG
               </Button>
               <Button onClick={() => setShowCardModal(false)} variant="outline" className="flex-1 bg-white rounded-2xl py-4 text-slate-400 border-slate-200">
                 Close
               </Button>
             </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, button, .no-print, .space-y-10 > *:not(.id-card-container) { display: none !important; }
          body, main { background: white !important; padding: 0 !important; margin: 0 !important; }
          .id-card-container { margin: 0 auto !important; box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}} />
    </div>
  );
};
