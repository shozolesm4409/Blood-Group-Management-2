
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getAppPermissions, updateAppPermissions, ADMIN_EMAIL, getUsers, updateUserProfile } from '../services/api';
import { Card, Button, Badge, Toast, useToast, Input } from '../components/UI';
import { RolePermissions, AppPermissions, UserRole, User } from '../types';
import { Shield, Layout, Eye, EyeOff, Lock, Unlock, Save, Search, User as UserIcon, X, UserCog, ShieldAlert, ArrowLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const SIDEBAR_KEYS: (keyof RolePermissions['sidebar'])[] = [
  'dashboard', 'profile', 'history', 'donors', 'users', 'manageDonations', 
  'logs', 'rolePermissions', 'supportCenter', 'feedback', 'approveFeedback', 
  'landingSettings', 'myNotice', 'summary', 'notifications', 'adminVerify', 
  'verificationHistory', 'teamIdCards', 'deletedUsers'
];

const RULE_KEYS: (keyof RolePermissions['rules'])[] = [
  'canEditProfile', 'canViewDonorDirectory', 'canRequestDonation', 
  'canPerformAction', 'canLogDonation', 'canLogDonationForOthers', 
  'canUseMessenger', 'canUseSystemSupport', 'canPostNotice'
];

export const AdminRolePermissions = () => {
  const { user: admin } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'individual'>('global');
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    Promise.all([getAppPermissions(), getUsers()]).then(([perms, users]) => {
      setPermissions(perms);
      setAllUsers(users);
      setLoading(false);
    });
  }, []);

  const getBasePermsForRole = (role: UserRole): RolePermissions | null => {
    if (!permissions) return null;
    if (role === UserRole.SUPERADMIN) return (permissions as any).admin;
    const roleKey = role.toLowerCase() as keyof AppPermissions;
    return (permissions as any)[roleKey] || permissions.user;
  };

  const handleToggleSidebar = (key: keyof RolePermissions['sidebar'], isOverride: boolean = false) => {
    if (isOverride && selectedUser) {
      const current = selectedUser.permissions || { sidebar: {}, rules: {} } as RolePermissions;
      const sidebar = { ...(current.sidebar || {}) };
      const base = getBasePermsForRole(selectedUser.role);
      const currentVal = sidebar[key] !== undefined ? sidebar[key] : (base?.sidebar?.[key] ?? false);
      sidebar[key] = !currentVal;
      setSelectedUser({ ...selectedUser, permissions: { ...current, sidebar: sidebar as any } });
      return;
    }

    if (!permissions) return;
    const roleKey = activeRole.toLowerCase() as keyof AppPermissions;
    const currentRole = (permissions as any)[roleKey] || { sidebar: {}, rules: {} };
    const sidebar = { ...(currentRole.sidebar || {}) };
    const currentVal = sidebar[key] ?? false;
    sidebar[key] = !currentVal;
    
    setPermissions({
      ...permissions,
      [roleKey]: { ...currentRole, sidebar: sidebar }
    });
  };

  const handleToggleRule = (key: keyof RolePermissions['rules'], isOverride: boolean = false) => {
    if (isOverride && selectedUser) {
      const current = selectedUser.permissions || { sidebar: {}, rules: {} } as RolePermissions;
      const rules = { ...(current.rules || {}) };
      const base = getBasePermsForRole(selectedUser.role);
      const currentVal = rules[key] !== undefined ? rules[key] : (base?.rules?.[key] ?? false);
      rules[key] = !currentVal;
      setSelectedUser({ ...selectedUser, permissions: { ...current, rules: rules as any } });
      return;
    }

    if (!permissions) return;
    const roleKey = activeRole.toLowerCase() as keyof AppPermissions;
    const currentRole = (permissions as any)[roleKey] || { sidebar: {}, rules: {} };
    const rules = { ...(currentRole.rules || {}) };
    const currentVal = rules[key] ?? false;
    rules[key] = !currentVal;

    setPermissions({
      ...permissions,
      [roleKey]: { ...currentRole, rules: rules }
    });
  };

  const handleSaveGlobal = async () => {
    if (!admin || !permissions) return;
    setSaving(true);
    try {
      await updateAppPermissions(permissions, admin);
      showToast("Global configurations updated successfully.");
    } catch (e: any) {
      showToast("Sync failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOverride = async () => {
    if (!admin || !selectedUser) return;
    setSaving(true);
    try {
      await updateUserProfile(selectedUser.id, { permissions: selectedUser.permissions }, admin);
      showToast(`Overrides for ${selectedUser.name} synchronized.`);
      setAllUsers(allUsers.map(u => u.id === selectedUser.id ? selectedUser : u));
    } catch (e: any) {
      showToast("Override failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== admin?.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Syncing...</div>;

  const currentRole = permissions ? (permissions as any)[activeRole.toLowerCase()] : null;

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20 px-4">
      <Toast {...toastState} onClose={hideToast} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 border-b border-slate-200 pb-6 lg:pb-10">
        <div>
           <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-1.5 rounded-full mb-3 lg:mb-4">
              <Shield size={14} />
              <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest">Master Security Hub</span>
           </div>
           <h1 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tight lg:tracking-[-0.04em]">Role Permissions</h1>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl lg:rounded-3xl shadow-inner border border-slate-200 w-full lg:w-auto">
          <button onClick={() => { setActiveTab('global'); setSelectedUser(null); }} className={clsx("flex-1 lg:px-10 py-3 rounded-xl lg:rounded-[1.5rem] text-[10px] lg:text-[11px] font-black uppercase transition-all", activeTab === 'global' ? "bg-white shadow-lg text-red-600" : "text-slate-500")}>Global Roles</button>
          <button onClick={() => setActiveTab('individual')} className={clsx("flex-1 lg:px-10 py-3 rounded-xl lg:rounded-[1.5rem] text-[10px] lg:text-[11px] font-black uppercase transition-all", activeTab === 'individual' ? "bg-white shadow-lg text-red-600" : "text-slate-500")}>User Overrides</button>
        </div>
      </div>

      {activeTab === 'global' ? (
        <div className="space-y-6 lg:space-y-10">
          <div className="flex bg-slate-100 p-1 lg:p-1.5 rounded-2xl lg:rounded-[2rem] shadow-inner border border-slate-200 w-full lg:w-fit overflow-x-auto no-scrollbar">
            {[UserRole.USER, UserRole.EDITOR, UserRole.ADMIN].map((role) => (
              <button key={role} onClick={() => setActiveRole(role)} className={clsx("flex-1 lg:flex-none px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-[1.75rem] text-[10px] lg:text-[11px] font-black uppercase transition-all whitespace-nowrap", activeRole === role ? "bg-white shadow-md lg:shadow-xl text-red-600" : "text-slate-500")}>{role}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
             <Card className="p-6 lg:p-8 border-0 shadow-xl bg-white rounded-[2rem] lg:rounded-[2.5rem]">
                <h3 className="text-lg lg:text-xl font-black text-slate-900 mb-6 lg:mb-8 flex items-center gap-3"><Layout className="text-blue-500" /> Sidebar Visibility</h3>
                <div className="space-y-2 lg:space-y-3 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                   {SIDEBAR_KEYS.map((key) => {
                     const value = currentRole?.sidebar?.[key] ?? false;
                     return (
                       <div key={key} className="flex items-center justify-between p-3.5 lg:p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all group" onClick={() => handleToggleSidebar(key)}>
                          <span className="text-[10px] lg:text-xs font-black text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className={clsx("w-10 lg:w-12 h-5 lg:h-6 rounded-full relative transition-all shadow-inner p-1", value ? "bg-blue-600" : "bg-slate-200")}>
                             <div className={clsx("w-3 lg:w-4 h-3 lg:h-4 bg-white rounded-full transition-all shadow-md", value ? "translate-x-5 lg:translate-x-6" : "translate-x-0")} />
                          </div>
                       </div>
                     );
                   })}
                </div>
             </Card>

             <Card className="p-6 lg:p-8 border-0 shadow-xl bg-white rounded-[2rem] lg:rounded-[2.5rem] flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 lg:mb-8">
                   <h3 className="text-lg lg:text-xl font-black text-slate-900 flex items-center gap-3"><Lock className="text-red-500" /> Functional Rules</h3>
                   <Button onClick={handleSaveGlobal} isLoading={saving} className="w-full sm:w-auto rounded-xl px-6 py-2 text-[10px] lg:text-xs">Save Global</Button>
                </div>
                <div className="space-y-2 lg:space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[400px] lg:max-h-[500px]">
                   {RULE_KEYS.map((key) => {
                     const value = currentRole?.rules?.[key] ?? false;
                     return (
                       <div key={key} className="flex items-center justify-between p-3.5 lg:p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all group" onClick={() => handleToggleRule(key)}>
                          <span className="text-[10px] lg:text-xs font-black text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className={clsx("w-10 lg:w-12 h-5 lg:h-6 rounded-full relative transition-all shadow-inner p-1", value ? "bg-red-600" : "bg-slate-200")}>
                             <div className={clsx("w-3 lg:w-4 h-3 lg:h-4 bg-white rounded-full transition-all shadow-md", value ? "translate-x-5 lg:translate-x-6" : "translate-x-0")} />
                          </div>
                       </div>
                     );
                   })}
                </div>
             </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
           {/* Left Column: User Search - On mobile, hidden if user is selected */}
           <div className={clsx("lg:col-span-1 space-y-6", selectedUser ? "hidden lg:block" : "block")}>
              <Card className="p-6 lg:p-8 border-0 shadow-xl bg-white rounded-[2rem] lg:rounded-[2.5rem]">
                 <h3 className="text-xl font-black text-slate-900 mb-6">Find User</h3>
                 <div className="relative group mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-0 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 transition-all outline-none" />
                 </div>
                 <div className="space-y-2 max-h-[600px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredUsers.map(u => (
                      <div key={u.id} onClick={() => setSelectedUser(u)} className={clsx("p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group", selectedUser?.id === u.id ? "bg-red-50 border-red-100 shadow-md" : "bg-white border-slate-50 hover:bg-slate-50")}>
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                               {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2.5 text-slate-300" />}
                            </div>
                            <div className="min-w-0">
                               <p className="text-sm font-black truncate text-slate-900">{u.name}</p>
                               <p className="text-[9px] font-black text-slate-400 uppercase">{u.role}</p>
                            </div>
                         </div>
                         <ChevronRight size={16} className="text-slate-200 group-hover:text-red-300 transition-colors lg:hidden" />
                      </div>
                    ))}
                 </div>
              </Card>
           </div>

           {/* Right Column: Detail View - On mobile, takes full screen if user is selected */}
           <div className={clsx("lg:col-span-2", selectedUser ? "block animate-in slide-in-from-right-4" : "hidden lg:block")}>
              {selectedUser ? (
                <div className="space-y-6 lg:space-y-8 duration-500">
                   {/* Mobile Back Button */}
                   <button onClick={() => setSelectedUser(null)} className="lg:hidden flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2 px-1">
                      <ArrowLeft size={16} /> Back to User List
                   </button>

                   <Card className="p-6 border-0 shadow-xl bg-white rounded-[2rem] lg:rounded-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                         <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                            {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : <UserCog size={28} className="text-red-600" />}
                         </div>
                         <div className="min-w-0 flex-1">
                            <h3 className="text-xl font-black text-slate-900 truncate">{selectedUser.name}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                               <Badge color="red" className="text-[9px] px-2 py-0.5">{selectedUser.role}</Badge>
                               <p className="text-[10px] font-black text-slate-400 truncate max-w-[150px]">{selectedUser.email}</p>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                         <Button onClick={() => setSelectedUser(null)} variant="outline" className="flex-1 sm:flex-none rounded-xl px-4 py-2.5 text-[10px] lg:text-xs">Cancel</Button>
                         <Button onClick={handleSaveOverride} isLoading={saving} className="flex-1 sm:flex-none rounded-xl px-6 py-2.5 text-[10px] lg:text-xs">Sync Overrides</Button>
                      </div>
                   </Card>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                      <Card className="p-6 lg:p-8 border-0 shadow-xl bg-white rounded-[2rem] lg:rounded-[2.5rem]">
                         <h4 className="font-black text-lg mb-6 lg:mb-8 flex items-center gap-3 text-slate-900"><Layout size={18} className="text-blue-500"/> Custom Sidebar</h4>
                         <div className="space-y-2 max-h-[350px] lg:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {SIDEBAR_KEYS.map((key) => {
                               const userVal = selectedUser.permissions?.sidebar?.[key];
                               const baseRolePerms = getBasePermsForRole(selectedUser.role);
                               const isActive = userVal !== undefined ? userVal : (baseRolePerms?.sidebar?.[key] ?? false);

                               return (
                                 <div key={key} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all group" onClick={() => handleToggleSidebar(key, true)}>
                                    <span className="text-[11px] font-black text-slate-600 group-hover:text-slate-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <div className="flex items-center gap-2">
                                       {userVal !== undefined && <Badge color="red" className="text-[7px] px-1 py-0">Custom</Badge>}
                                       <div className={clsx("w-9 lg:w-10 h-4.5 lg:h-5 rounded-full relative transition-all shadow-inner p-1", isActive ? "bg-blue-600" : "bg-slate-200")}>
                                          <div className={clsx("w-2.5 lg:w-3 h-2.5 lg:h-3 bg-white rounded-full transition-all shadow-md", isActive ? "translate-x-4.5 lg:translate-x-5" : "translate-x-0")} />
                                       </div>
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      </Card>

                      <Card className="p-6 lg:p-8 border-0 shadow-xl bg-white rounded-[2rem] lg:rounded-[2.5rem]">
                         <h4 className="font-black text-lg mb-6 lg:mb-8 flex items-center gap-3 text-slate-900"><Lock size={18} className="text-red-500"/> Custom Rules</h4>
                         <div className="space-y-2 max-h-[350px] lg:max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                            {RULE_KEYS.map((key) => {
                               const userVal = selectedUser.permissions?.rules?.[key];
                               const baseRolePerms = getBasePermsForRole(selectedUser.role);
                               const isActive = userVal !== undefined ? userVal : (baseRolePerms?.rules?.[key] ?? false);

                               return (
                                 <div key={key} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-white transition-all group" onClick={() => handleToggleRule(key, true)}>
                                    <span className="text-[11px] font-black text-slate-600 group-hover:text-slate-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <div className="flex items-center gap-2">
                                       {userVal !== undefined && <Badge color="red" className="text-[7px] px-1 py-0">Custom</Badge>}
                                       <div className={clsx("w-9 lg:w-10 h-4.5 lg:h-5 rounded-full relative transition-all shadow-inner p-1", isActive ? "bg-red-600" : "bg-slate-200")}>
                                          <div className={clsx("w-2.5 lg:w-3 h-2.5 lg:h-3 bg-white rounded-full transition-all shadow-md", isActive ? "translate-x-4.5 lg:translate-x-5" : "translate-x-0")} />
                                       </div>
                                    </div>
                                 </div>
                               );
                            })}
                         </div>
                      </Card>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-10 lg:p-20 border-2 border-dashed border-slate-200 rounded-[3rem] text-center opacity-40">
                   <UserCog size={64} className="mb-6" />
                   <p className="font-black uppercase tracking-widest text-sm">Select a user to configure custom overrides</p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
