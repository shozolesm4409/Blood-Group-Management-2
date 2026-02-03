
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { 
  getUsers, 
  deleteUserRecord, 
  updateUserProfile, 
  adminForceChangePassword, 
  getAppPermissions, 
  updateAppPermissions,
  handleDirectoryAccess,
  handleSupportAccess,
  handleFeedbackAccess,
  handleIDCardAccess,
  toggleUserSuspension
} from '../services/api';
import { Card, Badge, Button, Input, Toast, useToast, ConfirmModal, Select } from '../components/UI';
import { User, UserRole, BloodGroup, AppPermissions, RolePermissions } from '../types';
import { Search, User as UserIcon, RotateCcw, Trash2, Pencil, Key, Layout, Shield, ShieldCheck, UserCheck, MessageSquare, LifeBuoy, X, Edit2, Ban, ShieldAlert, IdCard } from 'lucide-react';
import clsx from 'clsx';

const RulesConfigurator = ({ role, currentPerms, onSave, isLoading }: { role: 'user' | 'editor', currentPerms: RolePermissions, onSave: (p: RolePermissions) => void, isLoading: boolean }) => {
  const [localPerms, setLocalPerms] = useState<RolePermissions>(currentPerms);
  useEffect(() => { setLocalPerms(currentPerms); }, [currentPerms]);

  const toggleSidebar = (key: keyof RolePermissions['sidebar']) => {
    setLocalPerms({ ...localPerms, sidebar: { ...localPerms.sidebar, [key]: !localPerms.sidebar[key] } });
  };
  const toggleRule = (key: keyof RolePermissions['rules']) => {
    setLocalPerms({ ...localPerms, rules: { ...localPerms.rules, [key]: !localPerms.rules[key] } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 border-0 shadow-xl bg-white rounded-3xl">
        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
          <Layout size={20} className="text-slate-400" /> Sidebar Visibility
        </h3>
        <div className="space-y-3">
          {Object.entries(localPerms.sidebar).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <input type="checkbox" checked={value} onChange={() => toggleSidebar(key as any)} className="w-5 h-5 accent-red-600 rounded cursor-pointer" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-8 border-0 shadow-xl bg-white rounded-3xl flex flex-col">
        <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
          <Shield size={20} className="text-slate-400" /> Functional Privileges
        </h3>
        <div className="space-y-3 flex-1">
          {Object.entries(localPerms.rules).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-slate-50 transition-colors">
              <span className="text-sm font-bold text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <input type="checkbox" checked={value} onChange={() => toggleRule(key as any)} className="w-5 h-5 accent-red-600 rounded cursor-pointer" />
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button onClick={() => onSave(localPerms)} isLoading={isLoading} className="w-full py-5 rounded-2xl bg-red-600 hover:bg-red-700 text-base shadow-xl">COMMIT GLOBAL RULES</Button>
        </div>
      </Card>
    </div>
  );
};

const AccessHub = ({ users, onAction }: { users: User[], onAction: (uid: string, type: 'directory' | 'support' | 'feedback' | 'idcard', approve: boolean) => void }) => {
  const AccessItem = ({ title, requested, has, type, uid, icon: Icon, color }: any) => (
    <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-red-100 transition-all">
      <div className="flex items-center gap-3">
        <div className={clsx("w-8 h-8 rounded-xl flex items-center justify-center", has ? color : "bg-slate-100 text-slate-400")}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5">{title}</p>
          <div className="flex items-center gap-2">
            {has ? (
              <Badge color="green" className="text-[8px] py-0 px-1.5">Active</Badge>
            ) : requested ? (
              <Badge color="yellow" className="text-[8px] py-0 px-1.5">Requested</Badge>
            ) : (
              <Badge color="gray" className="text-[8px] py-0 px-1.5">No Access</Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {requested ? (
          <>
            <button onClick={() => onAction(uid, type, true)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><UserCheck size={14}/></button>
            <button onClick={() => onAction(uid, type, false)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><X size={14}/></button>
          </>
        ) : (
          <button 
            onClick={() => onAction(uid, type, !has)}
            className={clsx("text-[9px] font-black px-3 py-1.5 rounded-lg transition-all border uppercase tracking-widest", has ? "text-red-600 border-red-100 bg-red-50 hover:bg-red-600 hover:text-white" : "text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white")}
          >
            {has ? 'Revoke' : 'Grant'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {users.map(u => (
        <Card key={u.id} className="p-6 border-0 shadow-lg bg-white rounded-[2rem] overflow-hidden group">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border-2 border-white shadow-md overflow-hidden flex items-center justify-center font-black text-slate-400">
                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
              </div>
              <div className={clsx("absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm", u.role === UserRole.ADMIN ? "bg-red-500" : (u.role === UserRole.EDITOR ? "bg-blue-500" : "bg-green-500"))}></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 truncate tracking-tight mb-0.5">{u.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.email}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <AccessItem title="Directory Access" requested={u.directoryAccessRequested} has={u.hasDirectoryAccess} type="directory" uid={u.id} icon={Search} color="bg-red-50 text-red-600" />
            <AccessItem title="Support Access" requested={u.supportAccessRequested} has={u.hasSupportAccess} type="support" uid={u.id} icon={LifeBuoy} color="bg-blue-50 text-blue-600" />
            <AccessItem title="Feedback Access" requested={u.feedbackAccessRequested} has={u.hasFeedbackAccess} type="feedback" uid={u.id} icon={MessageSquare} color="bg-green-50 text-green-600" />
            <AccessItem title="ID Card Access" requested={u.idCardAccessRequested} has={u.hasIDCardAccess} type="idcard" uid={u.id} icon={IdCard} color="bg-orange-50 text-orange-600" />
          </div>
        </Card>
      ))}
    </div>
  );
};

export const AdminUserManagement = () => {
  const { user: admin } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'user-rules' | 'editor-rules' | 'access-hub'>('users');
  
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [suspendUserId, setSuspendUserId] = useState<{id: string, current: boolean} | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([getUsers(), getAppPermissions()]);
      setUsers(u);
      setPermissions(p);
    } catch (e) { showToast("Failed to fetch data", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (!admin || !deleteUserId) return;
    setActionLoading(true);
    try {
      await deleteUserRecord(deleteUserId, admin);
      showToast("User account archived.");
      setDeleteUserId(null);
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleSuspendToggle = async () => {
    if (!admin || !suspendUserId) return;
    setActionLoading(true);
    try {
      await toggleUserSuspension(suspendUserId.id, !suspendUserId.current, admin);
      showToast(`User ${!suspendUserId.current ? 'suspended' : 'reinstated'}.`);
      setSuspendUserId(null);
      fetchData();
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!admin) return;
    try {
      await updateUserProfile(userId, { role: newRole }, admin);
      showToast("Role updated.");
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
  };

  const handleSavePermissions = async (role: 'user' | 'editor', newRolePerms: RolePermissions) => {
    if (!admin || !permissions) return;
    setActionLoading(true);
    try {
      const updated = { ...permissions, [role]: newRolePerms };
      await updateAppPermissions(updated, admin);
      setPermissions(updated);
      showToast(`${role} rules updated.`);
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleAccessAction = async (uid: string, type: 'directory' | 'support' | 'feedback' | 'idcard', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(uid, approve, admin);
      else if (type === 'support') await handleSupportAccess(uid, approve, admin);
      else if (type === 'feedback') await handleFeedbackAccess(uid, approve, admin);
      else if (type === 'idcard') await handleIDCardAccess(uid, approve, admin);
      showToast("Access updated.");
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
  };

  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !editUser) return;
    setActionLoading(true);
    try {
      await updateUserProfile(editUser.id, {
        name: editUser.name,
        phone: editUser.phone,
        location: editUser.location,
        bloodGroup: editUser.bloodGroup
      }, admin);
      showToast("User details updated.");
      setEditUser(null);
      fetchData();
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const handleForcePassword = async () => {
    if (!admin || !pwdUser || !newPassword) return;
    setActionLoading(true);
    try {
      await adminForceChangePassword(pwdUser.id, newPassword, admin);
      showToast("Password reset triggered.");
      setPwdUser(null);
      setNewPassword('');
    } catch (e) { showToast("Action failed.", "error"); }
    finally { setActionLoading(false); }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Syncing...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      
      <ConfirmModal 
        isOpen={!!deleteUserId} 
        onClose={() => setDeleteUserId(null)} 
        onConfirm={handleDelete} 
        title="Archive User?" 
        message="This will move the user to system archives." 
        isLoading={actionLoading} 
      />

      <ConfirmModal 
        isOpen={!!suspendUserId} 
        onClose={() => setSuspendUserId(null)} 
        onConfirm={handleSuspendToggle} 
        title={suspendUserId?.current ? "Reinstate User?" : "Suspend User?"} 
        message={suspendUserId?.current ? "User will regain access to the platform." : "User will be blocked from logging into the platform immediately."} 
        isLoading={actionLoading} 
      />

      {/* Edit User Details Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white border-0 rounded-[2.5rem]">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Edit2 className="text-red-600" /> Edit Identity</h3>
               <button onClick={() => setEditUser(null)} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateUserDetails} className="space-y-6">
              <Input label="Full Name" value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone Number" value={editUser.phone} onChange={e => setEditUser({...editUser, phone: e.target.value})} required />
                <Select label="Blood Group" value={editUser.bloodGroup} onChange={e => setEditUser({...editUser, bloodGroup: e.target.value as BloodGroup})}>
                  {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </Select>
              </div>
              <Input label="Location" value={editUser.location} onChange={e => setEditUser({...editUser, location: e.target.value})} required />
              <div className="pt-4 flex gap-4">
                <Button type="submit" isLoading={actionLoading} className="flex-1 py-4 rounded-2xl">Update User</Button>
                <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1 py-4 rounded-2xl">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Force Password Change Modal */}
      {pwdUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white border-0 rounded-[2.5rem]">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner"><Key size={32} /></div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">System PIN Reset</h3>
              <p className="text-sm text-slate-500 font-medium">Resetting password for <span className="text-red-600 font-bold">{pwdUser.name}</span></p>
            </div>
            <div className="space-y-6">
              <Input 
                type="password" 
                label="New Password / PIN" 
                placeholder="Enter strong password..." 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
              <div className="flex gap-4">
                <Button onClick={handleForcePassword} isLoading={actionLoading} disabled={!newPassword} className="flex-1 py-4 rounded-2xl">Confirm Reset</Button>
                <Button variant="outline" onClick={() => { setPwdUser(null); setNewPassword(''); }} className="flex-1 py-4 rounded-2xl">Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">User Management</h1>
          <p className="text-sm text-slate-500 font-medium">Control global access and system privileges.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 overflow-x-auto no-scrollbar">
          {['users', 'user-rules', 'editor-rules', 'access-hub'].map((t: any) => (
            <button key={t} onClick={() => setActiveTab(t)} className={clsx("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === t ? "bg-white shadow-md text-red-600" : "text-slate-500")}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" placeholder="Search users by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold outline-none shadow-sm" /></div>
          <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-[2rem]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr><th className="px-6 py-5">Profile</th><th className="px-6 py-5">Email</th><th className="px-6 py-5">Role</th><th className="px-6 py-5 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className={clsx("transition-colors", u.isSuspended ? "bg-red-50/50" : "hover:bg-slate-50")}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100 shadow-sm relative">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-slate-300" />}
                          {u.isSuspended && <div className="absolute inset-0 bg-red-600/20 flex items-center justify-center text-red-600"><Ban size={14}/></div>}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{u.name}</p>
                          {u.isSuspended && <p className="text-[8px] font-black text-red-600 uppercase tracking-widest">Suspended</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-bold">{u.email}</td>
                    <td className="px-6 py-5">
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)} className="bg-transparent border border-slate-200 rounded-lg px-2 py-1 font-black text-[10px] uppercase tracking-widest outline-none cursor-pointer text-slate-700">
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                         <button onClick={() => setSuspendUserId({id: u.id, current: !!u.isSuspended})} title={u.isSuspended ? "Unsuspend User" : "Suspend User"} className={clsx("p-2 rounded-xl transition-all", u.isSuspended ? "text-green-600 hover:bg-green-50" : "text-red-400 hover:bg-red-50")}>
                           <Ban size={18} />
                         </button>
                         <button onClick={() => setEditUser(u)} title="Edit User" className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                         <button onClick={() => setPwdUser(u)} title="Change Password" className="p-2 text-slate-300 hover:text-orange-500 transition-colors"><Key size={18} /></button>
                         <button onClick={() => setDeleteUserId(u.id)} disabled={u.email === admin?.email} title="Delete User" className="p-2 text-slate-300 hover:text-red-600 disabled:opacity-0 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === 'user-rules' && permissions && <RulesConfigurator role="user" currentPerms={permissions.user} onSave={(p) => handleSavePermissions('user', p)} isLoading={actionLoading} />}
      {activeTab === 'editor-rules' && permissions && <RulesConfigurator role="editor" currentPerms={permissions.editor} onSave={(p) => handleSavePermissions('editor', p)} isLoading={actionLoading} />}
      {activeTab === 'access-hub' && <AccessHub users={users} onAction={handleAccessAction} />}
    </div>
  );
};
