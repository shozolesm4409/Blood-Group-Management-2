
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getDonations, 
  getLogs, 
  updateDonationStatus, 
  getUsers, 
  deleteUserRecord, 
  updateUserProfile, 
  adminForceChangePassword,
  getDeletedUsers,
  getDeletedDonations,
  getDeletedLogs,
  restoreDeletedLog,
  deleteDonationRecord,
  getAppPermissions,
  updateAppPermissions,
  handleDirectoryAccess,
  handleSupportAccess,
  handleFeedbackAccess,
  requestDirectoryAccess,
  deleteLogEntry,
  getRevokedPermissions,
  restoreRevokedPermission,
  restoreDeletedUser,
  restoreDeletedDonation,
  getLandingConfig,
  updateLandingConfig,
  ADMIN_EMAIL 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button, Input, Select, ConfirmModal } from '../components/UI';
import { DonationRecord, AuditLog, DonationStatus, User, UserRole, AppPermissions, BloodGroup, RevokedPermission, LandingPageConfig } from '../types';
import { 
  Check, X, Edit2, Trash2, Key, Users, Layout as LayoutIcon, ShieldCheck, Clock, Archive, Droplet, CheckCircle, RotateCcw, Filter, Search, BellRing, ShieldAlert, ShieldCheck as ShieldIcon, Settings2, Monitor, Save, RefreshCcw, Activity, Lock
} from 'lucide-react';
import clsx from 'clsx';

export const LandingPageManagement = () => {
  const { user: admin } = useAuth();
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!admin) return;
    setSaving(true);
    try {
      await updateLandingConfig(config, admin);
      alert("Landing page synchronized with production successfully.");
    } catch (e) {
      alert("Sync failed.");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm("Restore standard marketing copy?")) {
      setConfig({
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
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300">Loading Configuration...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Landing Page Customizer</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Manage public facing marketing content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
            <RefreshCcw size={16} /> Reset
          </Button>
          <Button onClick={handleSave} isLoading={saving} className="flex items-center gap-2">
            <Save size={16} /> Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Monitor size={18} className="text-red-600" /> Hero Section (Top)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Headline (Hero Title)</label>
                <textarea 
                  value={config.heroTitle}
                  onChange={e => setConfig({...config, heroTitle: e.target.value})}
                  className="w-full bg-slate-50 border-0 rounded-xl p-4 text-lg font-black focus:ring-2 focus:ring-red-500 transition-all outline-none min-h-[100px]"
                />
              </div>
              <Input 
                label="Subheadline (Subtitle)" 
                value={config.heroSubtitle}
                onChange={e => setConfig({...config, heroSubtitle: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Primary Button Text" 
                  value={config.heroButtonPrimary}
                  onChange={e => setConfig({...config, heroButtonPrimary: e.target.value})}
                />
                <Input 
                  label="Secondary Button Text" 
                  value={config.heroButtonSecondary}
                  onChange={e => setConfig({...config, heroButtonSecondary: e.target.value})}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-red-600" /> Sections Headers
            </h3>
            <div className="space-y-4">
              <Input 
                label="Statistics Section Header" 
                value={config.statsSectionTitle}
                onChange={e => setConfig({...config, statsSectionTitle: e.target.value})}
              />
              <Input 
                label="Feedback Section Header" 
                value={config.feedbackSectionTitle}
                onChange={e => setConfig({...config, feedbackSectionTitle: e.target.value})}
              />
              <Input 
                label="Feedback Section Subtitle" 
                value={config.feedbackSectionSubtitle}
                onChange={e => setConfig({...config, feedbackSectionSubtitle: e.target.value})}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
              <ShieldIcon size={18} className="text-red-600" /> Call to Action (Bottom)
            </h3>
            <div className="space-y-4">
              <Input 
                label="CTA Title" 
                value={config.ctaTitle}
                onChange={e => setConfig({...config, ctaTitle: e.target.value})}
              />
              <Input 
                label="CTA Subtitle" 
                value={config.ctaSubtitle}
                onChange={e => setConfig({...config, ctaSubtitle: e.target.value})}
              />
              <Input 
                label="CTA Button Label" 
                value={config.ctaButtonText}
                onChange={e => setConfig({...config, ctaButtonText: e.target.value})}
              />
            </div>
          </Card>

          <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
            <h4 className="font-black text-xs uppercase tracking-[0.3em] mb-4 text-red-500">Live Preview Hint</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Changes saved here will be reflected instantly for all visitors on the landing page. Use high-impact keywords to encourage registrations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showPwdModal, setShowPwdModal] = useState<string | null>(null);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'user-rules' | 'editor-rules' | 'directory-access'>('users');
  const [savingPerms, setSavingPerms] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [uData, pData] = await Promise.all([getUsers(), getAppPermissions()]);
    setUsers(uData);
    setPerms(pData);
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) return;
    try {
      await updateUserProfile(uid, { role: newRole }, currentUser);
      alert(`User role updated successfully.`);
      fetchData();
    } catch (e) {
      alert("Error changing user role.");
    }
  };

  const handleAdminPasswordChange = async (uid: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const formData = new FormData(e.currentTarget);
    const newPass = formData.get('newPassword') as string;
    await adminForceChangePassword(uid, newPass, currentUser);
    alert("User password has been force-reset.");
    setShowPwdModal(null);
  };

  const handleEditUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !editUser) return;
    setEditLoading(true);
    const formData = new FormData(e.currentTarget);
    const updates: Partial<User> = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      bloodGroup: formData.get('bloodGroup') as BloodGroup,
      location: formData.get('location') as string,
      phone: formData.get('phone') as string,
    };

    try {
      await updateUserProfile(editUser.id, updates, currentUser);
      alert("User profile updated successfully.");
      setEditUser(null);
      fetchData();
    } catch (err) {
      alert("Failed to update user profile.");
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!currentUser || !deleteUserId) return;
    setIsDeleting(true);
    try {
      await deleteUserRecord(deleteUserId, currentUser);
      alert("User account archived.");
      fetchData();
      setDeleteUserId(null);
    } catch (e) {
      alert("Error deleting user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const togglePermission = (role: 'user' | 'editor', section: 'sidebar' | 'rules', key: string) => {
    if (!perms || currentUser?.role !== UserRole.ADMIN) return;
    setPerms(prevPerms => {
      if (!prevPerms) return prevPerms;
      const newPerms = JSON.parse(JSON.stringify(prevPerms));
      const targetSection = newPerms[role][section];
      if (targetSection) {
        targetSection[key] = !targetSection[key];
      }
      return newPerms;
    });
  };

  const handleSavePerms = async () => {
    if (!perms || !currentUser || currentUser.role !== UserRole.ADMIN) return;
    setSavingPerms(true);
    try {
      await updateAppPermissions(perms, currentUser);
      alert("Permissions synchronized.");
    } catch (err: any) {
      alert(err.message || "Rule sync failed.");
    } finally {
      setSavingPerms(false);
    }
  };

  const handleAccessAction = async (userId: string, type: 'directory' | 'support' | 'feedback', approve: boolean) => {
    if (!currentUser) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(userId, approve, currentUser);
      else if (type === 'support') await handleSupportAccess(userId, approve, currentUser);
      else if (type === 'feedback') await handleFeedbackAccess(userId, approve, currentUser);
      fetchData();
    } catch (e) {
      alert("Action failed.");
    }
  };

  const canManagePerms = currentUser?.role === UserRole.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          <button onClick={() => setActiveTab('users')} className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap", activeTab === 'users' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Users</button>
          <button onClick={() => setActiveTab('user-rules')} className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap", activeTab === 'user-rules' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>User Rules</button>
          <button onClick={() => setActiveTab('editor-rules')} className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap", activeTab === 'editor-rules' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Editor Rules</button>
          <button onClick={() => setActiveTab('directory-access')} className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap", activeTab === 'directory-access' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Access Hub</button>
        </div>
      </div>

      {activeTab === 'users' && (
        <Card className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-2 py-1.5">Profile</th>
                <th className="px-2 py-1.5">Email</th>
                <th className="px-2 py-1.5">Role</th>
                <th className="px-2 py-1.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <Users className="p-2.5 text-slate-300" />}
                      </div>
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className="text-xs text-red-600 font-semibold">{u.bloodGroup}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-slate-500">{u.email}</td>
                  <td className="px-2 py-1.5">
                    <select 
                      className="bg-transparent text-xs font-semibold outline-none cursor-pointer" 
                      value={u.role} 
                      disabled={!canManagePerms || u.email.toLowerCase() === ADMIN_EMAIL} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    >
                      <option value={UserRole.USER}>User</option>
                      <option value={UserRole.EDITOR}>Editor</option>
                      <option value={UserRole.ADMIN}>Admin</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditUser(u)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => setShowPwdModal(u.id)} className="p-2 text-slate-400 hover:text-orange-600 transition-colors"><Key size={16}/></button>
                      {u.email.toLowerCase() !== ADMIN_EMAIL && (
                        <button onClick={() => setDeleteUserId(u.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {(activeTab === 'user-rules' || activeTab === 'editor-rules') && perms && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-slate-200 rounded-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2"><LayoutIcon size={16}/> Sidebar Visibility</h3>
            <div className="space-y-2">
              {Object.keys(perms[activeTab === 'user-rules' ? 'user' : 'editor'].sidebar).map((key) => (
                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" disabled={!canManagePerms} checked={!!(perms[activeTab === 'user-rules' ? 'user' : 'editor'].sidebar as any)?.[key]} onChange={() => togglePermission(activeTab === 'user-rules' ? 'user' : 'editor', 'sidebar', key)} className="w-4 h-4 rounded accent-red-600 cursor-pointer"/>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 border border-slate-200 rounded-xl">
            <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldCheck size={16}/> Functional Privileges</h3>
            <div className="space-y-2">
              {Object.keys(perms[activeTab === 'user-rules' ? 'user' : 'editor'].rules).map((key) => (
                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" disabled={!canManagePerms} checked={!!(perms[activeTab === 'user-rules' ? 'user' : 'editor'].rules as any)?.[key]} onChange={() => togglePermission(activeTab === 'user-rules' ? 'user' : 'editor', 'rules', key)} className="w-4 h-4 rounded accent-red-600 cursor-pointer"/>
                </div>
              ))}
            </div>
            {canManagePerms && (
              <Button onClick={handleSavePerms} isLoading={savingPerms} className="w-full mt-6 py-2 text-xs">Commit Global Rules</Button>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'directory-access' && (
        <Card className="overflow-hidden border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-2 py-1.5">User Identity</th>
                <th className="px-2 py-1.5">Current Status</th>
                <th className="px-2 py-1.5 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-400">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-lg" /> : u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 min-w-[50px]">Directory:</span>
                        {u.hasDirectoryAccess ? (
                          <Badge color="green">Active</Badge>
                        ) : (
                          u.directoryAccessRequested ? <Badge color="yellow">Requested</Badge> : <Badge color="gray">None</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 min-w-[50px]">Support:</span>
                        {u.hasSupportAccess ? (
                          <Badge color="green">Active</Badge>
                        ) : (
                          u.supportAccessRequested ? <Badge color="yellow">Requested</Badge> : <Badge color="gray">None</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase text-slate-400 min-w-[50px]">Feedback:</span>
                        {u.hasFeedbackAccess ? (
                          <Badge color="green">Active</Badge>
                        ) : (
                          u.feedbackAccessRequested ? <Badge color="yellow">Requested</Badge> : <Badge color="gray">None</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <div className="flex flex-col gap-2 items-end">
                      {/* Administrative Controls for Directory */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 italic">Directory:</span>
                        {u.directoryAccessRequested ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleAccessAction(u.id, 'directory', true)} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-black uppercase hover:bg-green-100 transition-colors">Approve</button>
                            <button onClick={() => handleAccessAction(u.id, 'directory', false)} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-black uppercase hover:bg-red-100 transition-colors">Deny</button>
                          </div>
                        ) : (
                          u.hasDirectoryAccess ? (
                            <button onClick={() => handleAccessAction(u.id, 'directory', false)} className="px-2 py-0.5 bg-slate-100 text-red-600 rounded text-[10px] font-black uppercase hover:bg-red-50 transition-colors">Remove</button>
                          ) : (
                            <button onClick={() => handleAccessAction(u.id, 'directory', true)} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">Grant</button>
                          )
                        )}
                      </div>
                      {/* Administrative Controls for Support */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 italic">Support:</span>
                        {u.supportAccessRequested ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleAccessAction(u.id, 'support', true)} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-black uppercase hover:bg-green-100 transition-colors">Approve</button>
                            <button onClick={() => handleAccessAction(u.id, 'support', false)} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-black uppercase hover:bg-red-100 transition-colors">Deny</button>
                          </div>
                        ) : (
                          u.hasSupportAccess ? (
                            <button onClick={() => handleAccessAction(u.id, 'support', false)} className="px-2 py-0.5 bg-slate-100 text-red-600 rounded text-[10px] font-black uppercase hover:bg-red-50 transition-colors">Remove</button>
                          ) : (
                            <button onClick={() => handleAccessAction(u.id, 'support', true)} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">Grant</button>
                          )
                        )}
                      </div>
                      {/* Administrative Controls for Feedback */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 italic">Feedback:</span>
                        {u.feedbackAccessRequested ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleAccessAction(u.id, 'feedback', true)} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-black uppercase hover:bg-green-100 transition-colors">Approve</button>
                            <button onClick={() => handleAccessAction(u.id, 'feedback', false)} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-black uppercase hover:bg-red-100 transition-colors">Deny</button>
                          </div>
                        ) : (
                          u.hasFeedbackAccess ? (
                            <button onClick={() => handleAccessAction(u.id, 'feedback', false)} className="px-2 py-0.5 bg-slate-100 text-red-600 rounded text-[10px] font-black uppercase hover:bg-red-50 transition-colors">Remove</button>
                          ) : (
                            <button onClick={() => handleAccessAction(u.id, 'feedback', true)} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase hover:bg-blue-100 transition-colors">Grant</button>
                          )
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-3 bg-white border border-slate-200 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6">Profile Overwrite</h2>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <Input label="Full Name" name="name" defaultValue={editUser.name} required />
              <Input label="Email" name="email" type="email" defaultValue={editUser.email} required />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Blood Group" name="bloodGroup" defaultValue={editUser.bloodGroup}>
                  {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </Select>
                <Input label="Phone" name="phone" defaultValue={editUser.phone} required />
              </div>
              <Input label="Location" name="location" defaultValue={editUser.location} required />
              <div className="flex gap-3 pt-4">
                <Button type="submit" isLoading={editLoading} className="flex-1">Update</Button>
                <Button type="button" variant="outline" onClick={() => setEditUser(null)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showPwdModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-3 bg-white border border-slate-200 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900"><Key className="text-orange-500" /> Administrative PIN Reset</h2>
            <form onSubmit={(e) => handleAdminPasswordChange(showPwdModal, e)} className="space-y-4">
              <Input label="New Administrative Password" name="newPassword" type="text" required placeholder="Enter new PIN" />
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Overwrite PIN</Button>
                <Button type="button" variant="outline" onClick={() => setShowPwdModal(null)} className="flex-1">Close</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteUserId} onClose={() => setDeleteUserId(null)} onConfirm={confirmDeleteUser} title="Archive User?" message="Move this profile to the historical archives." isLoading={isDeleting} />
    </div>
  );
};

export const ManageDonations = () => {
  const { user: admin } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchDonations = async () => {
    setLoading(true);
    const data = await getDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleStatusUpdate = async (id: string, status: DonationStatus) => {
    if (!admin) return;
    try {
      await updateDonationStatus(id, status, admin);
      fetchDonations();
    } catch (e) {
      alert("Status sync failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!admin) return;
    if (window.confirm("Archive this ledger record?")) {
      await deleteDonationRecord(id, admin);
      fetchDonations();
    }
  };

  const filtered = donations.filter(d => statusFilter === 'ALL' || d.status === statusFilter);

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 italic">Accessing Ledger...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Donation Ledger</h1>
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <Select className="text-xs h-9 py-1 px-3 min-w-[140px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Show All Entries</option>
            <option value={DonationStatus.PENDING}>Pending Confirmation</option>
            <option value={DonationStatus.COMPLETED}>Successfully Completed</option>
            <option value={DonationStatus.REJECTED}>Rejected (Regret)</option>
          </Select>
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
            <tr>
              <th className="px-2 py-1.5">Donor Name</th>
              <th className="px-2 py-1.5">Donation Date</th>
              <th className="px-2 py-1.5">Status Badge</th>
              <th className="px-2 py-1.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-300" />}
                    </div>
                    <span className="font-bold">{d.userName}</span>
                    <Badge color="red">{d.userBloodGroup}</Badge>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-slate-500 font-medium">{new Date(d.donationDate).toLocaleDateString()}</td>
                <td className="px-2 py-1.5">
                  <Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')}>
                    {d.status === 'REJECTED' ? 'Regret' : d.status}
                  </Badge>
                </td>
                <td className="px-2 py-1.5 text-right">
                  <div className="flex justify-end gap-2">
                    {d.status === DonationStatus.PENDING && (
                      <>
                        <button onClick={() => handleStatusUpdate(d.id, DonationStatus.COMPLETED)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check size={18}/></button>
                        <button onClick={() => handleStatusUpdate(d.id, DonationStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X size={18}/></button>
                      </>
                    )}
                    {/* Fix: Pass d.id to handleDelete to resolve undefined 'id' variable */}
                    <button onClick={() => handleDelete(d.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic font-semibold">No records found matching current filter.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export const DonorSearch = () => {
  const { user, updateUser } = useAuth();
  const [donors, setDonors] = useState<User[]>([]);
  const [filter, setFilter] = useState({ blood: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (user) {
      getUsers().then(u => {
        setDonors(u.filter(d => d.role !== UserRole.ADMIN));
        setLoading(false);
      });
    }
  }, [user]);

  const handleRequestAccess = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await requestDirectoryAccess(user);
      updateUser({ ...user, directoryAccessRequested: true });
      alert("Access request sent to administration.");
    } catch (e) {
      alert("Request failed.");
    } finally {
      setIsRequesting(false);
    }
  };

  const filtered = donors.filter(d => 
    (!filter.blood || d.bloodGroup === filter.blood) &&
    (!filter.location || d.location.toLowerCase().includes(filter.location.toLowerCase()))
  );

  const hasAccess = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR || user?.hasDirectoryAccess;

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="p-12 text-center space-y-8 border-0 shadow-2xl bg-white rounded-[3rem]">
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <Lock size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Directory Locked</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              ডোনার ডিরেক্টরি দেখার জন্য আপনার এক্সেস প্রয়োজন। রক্তদাতাদের তথ্য ও যোগাযোগের জন্য রিকোয়েস্ট পাঠান।
            </p>
          </div>
          
          {user?.directoryAccessRequested ? (
            <div className="p-6 bg-yellow-50 text-yellow-700 rounded-2xl border border-yellow-100 flex items-center justify-center gap-3">
              <ShieldAlert size={20} />
              <span className="font-black text-sm uppercase tracking-widest">Pending Verification</span>
            </div>
          ) : (
            <Button 
              onClick={handleRequestAccess} 
              isLoading={isRequesting}
              className="w-full py-5 rounded-2xl text-lg"
            >
              Request Directory Access
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Donor Directory</h1>
        <div className="flex gap-2">
          <Select className="text-xs h-9" value={filter.blood} onChange={(e) => setFilter({...filter, blood: e.target.value})}>
            <option value="">Filter All Blood Groups</option>
            {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search city/area..." 
              value={filter.location} 
              onChange={(e) => setFilter({...filter, location: e.target.value})}
              className="h-9 pl-9 pr-4 rounded border border-slate-200 text-xs focus:ring-1 focus:ring-red-500 outline-none transition-shadow"
            />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
            <tr>
              <th className="px-2 py-1.5">Donor Profile</th>
              <th className="px-2 py-1.5">Blood Group</th>
              <th className="px-2 py-1.5">Current Location</th>
              <th className="px-2 py-1.5">Contact Information</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                      {d.avatar ? <img src={d.avatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-300" />}
                    </div>
                    <span className="font-bold">{d.name}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5"><Badge color="red">{d.bloodGroup}</Badge></td>
                <td className="px-2 py-1.5 text-slate-500 font-medium">{d.location}</td>
                <td className="px-2 py-1.5 font-semibold text-slate-900">{d.phone || 'Private'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export const DirectoryPermissions = () => {
  const { user: admin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getUsers().then(u => setUsers(u.filter(usr => usr.directoryAccessRequested || usr.supportAccessRequested || usr.feedbackAccessRequested)));
  }, []);

  const handleAction = async (userId: string, type: 'directory' | 'support' | 'feedback', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(userId, approve, admin);
      else if (type === 'support') await handleSupportAccess(userId, approve, admin);
      else if (type === 'feedback') await handleFeedbackAccess(userId, approve, admin);
      getUsers().then(u => setUsers(u.filter(usr => usr.directoryAccessRequested || usr.supportAccessRequested || usr.feedbackAccessRequested)));
    } catch (e) { alert("Action failed."); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><BellRing size={24} className="text-red-600"/> Request Notifications</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u => (
          <Card key={u.id} className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-400">
                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover rounded-xl" /> : u.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold">{u.name}</p>
                <p className="text-xs text-slate-500 italic">{u.email}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {u.directoryAccessRequested && <Badge color="blue">Directory</Badge>}
                  {u.supportAccessRequested && <Badge color="green">Support</Badge>}
                  {u.feedbackAccessRequested && <Badge color="yellow">Feedback</Badge>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {u.directoryAccessRequested && (
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-slate-400">Directory</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(u.id, 'directory', true)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase">Grant</button>
                    <button onClick={() => handleAction(u.id, 'directory', false)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase">Deny</button>
                  </div>
                </div>
              )}
              {u.supportAccessRequested && (
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-slate-400">Support</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(u.id, 'support', true)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase">Grant</button>
                    <button onClick={() => handleAction(u.id, 'support', false)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase">Deny</button>
                  </div>
                </div>
              )}
              {u.feedbackAccessRequested && (
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] font-black uppercase text-slate-400">Feedback</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(u.id, 'feedback', true)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase">Grant</button>
                    <button onClick={() => handleAction(u.id, 'feedback', false)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase">Deny</button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
        {users.length === 0 && <div className="col-span-full py-12 text-center text-slate-400 italic">Queue is empty. No pending access requests found.</div>}
      </div>
    </div>
  );
};

// @fix: Implemented SystemLogs component for activity monitoring
export const SystemLogs = () => {
  const { user: admin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleDelete = async (id: string) => {
    if (!admin) return;
    if (window.confirm("Archive this log entry?")) {
      await deleteLogEntry(id, admin);
      fetchLogs();
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 italic">Accessing Logs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Activity Logs</h1>
        <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2">
           <RefreshCcw size={16} /> Refresh
        </Button>
      </div>

      <Card className="overflow-hidden border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                      {log.userAvatar ? <img src={log.userAvatar} className="w-full h-full object-cover" alt="User" /> : <Users className="p-1 text-slate-300" />}
                    </div>
                    <span className="font-bold">{log.userName}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><Badge color="blue">{log.action}</Badge></td>
                <td className="px-4 py-3 text-slate-600 italic max-w-xs truncate">{log.details}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(log.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// @fix: Implemented DeletedRecords component to manage system archives
export const DeletedRecords = () => {
  const { user: admin } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'donations' | 'logs'>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    let res = [];
    if (activeTab === 'users') res = await getDeletedUsers();
    else if (activeTab === 'donations') res = await getDeletedDonations();
    else if (activeTab === 'logs') res = await getDeletedLogs();
    setData(res);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleRestore = async (id: string) => {
    if (!admin) return;
    try {
      if (activeTab === 'users') await restoreDeletedUser(id, admin);
      else if (activeTab === 'donations') await restoreDeletedDonation(id, admin);
      else if (activeTab === 'logs') await restoreDeletedLog(id, admin);
      alert("Record restored successfully.");
      fetchData();
    } catch (e) { alert("Restore failed."); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Archives</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button onClick={() => setActiveTab('users')} className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-all", activeTab === 'users' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Users</button>
          <button onClick={() => setActiveTab('donations')} className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-all", activeTab === 'donations' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Donations</button>
          <button onClick={() => setActiveTab('logs')} className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-all", activeTab === 'logs' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Logs</button>
        </div>
      </div>
      <Card className="overflow-hidden border border-slate-200 rounded-xl min-h-[400px]">
        {loading ? <div className="flex items-center justify-center py-20"><Activity className="animate-spin text-red-600" /></div> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-4 py-3">Record Info</th>
                <th className="px-4 py-3">Deleted At</th>
                <th className="px-4 py-3">Deleted By</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold">{item.name || item.userName || item.action || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.email || item.details || item.id}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(item.deletedAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-500 font-medium">{item.deletedBy}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRestore(item.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 ml-auto">
                      <RotateCcw size={16} /> <span className="text-[10px] font-black uppercase">Restore</span>
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={4} className="px-4 py-20 text-center text-slate-400 italic">No archived records found.</td></tr>}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
