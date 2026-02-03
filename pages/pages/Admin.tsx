
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getDonations, 
  getLogs, 
  updateDonationStatus, 
  getUsers, 
  deleteUserRecord, 
  updateUserProfile, 
  getDeletedUsers,
  getDeletedDonations,
  getDeletedLogs,
  getDeletedFeedbacks,
  getDeletedNotices,
  restoreDeletedLog,
  restoreDeletedFeedback,
  restoreDeletedNotice,
  deleteDonationRecord,
  handleDirectoryAccess,
  handleSupportAccess,
  handleFeedbackAccess,
  deleteLogEntry,
  restoreDeletedUser,
  restoreDeletedDonation,
  getAllFeedbacks,
  updateFeedbackStatus,
  getLandingConfig,
  updateLandingConfig,
  adminForceChangePassword,
  getAppPermissions,
  updateAppPermissions,
  permanentlyDeleteArchivedFeedback
} from '../services/api';
import { useAuth } from '../AuthContext';
import { Card, Badge, Button, Input, Select, Toast, useToast } from '../components/UI';
import { DonationRecord, AuditLog, DonationStatus, User, UserRole, BloodGroup, FeedbackStatus, DonationFeedback, LandingPageConfig, AppPermissions, RolePermissions } from '../types';
import { 
  Check, X, Trash2, Users, User as UserIcon, RotateCcw, Search, BellRing, ShieldAlert, Monitor, Save, Activity, MessageSquareQuote, Megaphone, MapPin, Phone, Mail, ShieldCheck, LifeBuoy, 
  Calendar, Key, Pencil, Layout, Shield, LogIn, UserPlus, Globe
} from 'lucide-react';
import clsx from 'clsx';

// --- Sub-components for Rules Management ---

const RulesConfigurator = ({ role, currentPerms, onSave, isLoading }: { role: 'user' | 'editor', currentPerms: RolePermissions, onSave: (p: RolePermissions) => void, isLoading: boolean }) => {
  const [localPerms, setLocalPerms] = useState<RolePermissions>(currentPerms);

  useEffect(() => {
    setLocalPerms(currentPerms);
  }, [currentPerms]);

  const toggleSidebar = (key: keyof RolePermissions['sidebar']) => {
    setLocalPerms({
      ...localPerms,
      sidebar: { ...localPerms.sidebar, [key]: !localPerms.sidebar[key] }
    });
  };

  const toggleRule = (key: keyof RolePermissions['rules']) => {
    setLocalPerms({
      ...localPerms,
      rules: { ...localPerms.rules, [key]: !localPerms.rules[key] }
    });
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
              <input 
                type="checkbox" 
                checked={value} 
                onChange={() => toggleSidebar(key as any)}
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
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
              <input 
                type="checkbox" 
                checked={value} 
                onChange={() => toggleRule(key as any)}
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
        
        <div className="mt-10">
          <Button 
            onClick={() => onSave(localPerms)} 
            isLoading={isLoading}
            className="w-full py-5 rounded-2xl bg-red-600 hover:bg-red-700 text-base shadow-xl shadow-red-100"
          >
            COMMIT GLOBAL RULES
          </Button>
        </div>
      </Card>
    </div>
  );
};

// --- Access Hub Sub-component ---

const AccessHub = ({ users, onAction }: { users: User[], onAction: (uid: string, type: 'directory' | 'support' | 'feedback', approve: boolean) => void }) => {
  const StatusBadge = ({ type, requested, has }: { type: string, requested?: boolean, has?: boolean }) => {
    if (requested) return <Badge color="yellow" className="text-[9px] py-0.5 px-2">REQUESTED</Badge>;
    if (has) return <Badge color="green" className="text-[9px] py-0.5 px-2">ACTIVE</Badge>;
    return <Badge color="gray" className="text-[9px] py-0.5 px-2 bg-slate-100 text-slate-400">NONE</Badge>;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-white rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
            <tr>
              <th className="px-6 py-4">User Identity</th>
              <th className="px-6 py-4">Current Status</th>
              <th className="px-6 py-4 text-right">Administrative Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 leading-none mb-1">{u.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-400 w-16 uppercase">Directory:</span> <StatusBadge type="dir" requested={u.directoryAccessRequested} has={u.hasDirectoryAccess} /></div>
                    <div className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-400 w-16 uppercase">Support:</span> <StatusBadge type="sup" requested={u.supportAccessRequested} has={u.hasSupportAccess} /></div>
                    <div className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-400 w-16 uppercase">Feedback:</span> <StatusBadge type="fed" requested={u.feedbackAccessRequested} has={u.hasFeedbackAccess} /></div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] italic font-bold text-slate-400 mr-2">Directory:</span>
                      {u.directoryAccessRequested ? (
                        <>
                          <button onClick={() => onAction(u.id, 'directory', true)} className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 hover:bg-green-600 hover:text-white transition-all uppercase">Approve</button>
                          <button onClick={() => onAction(u.id, 'directory', false)} className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase">Deny</button>
                        </>
                      ) : (
                        <button 
                          onClick={() => onAction(u.id, 'directory', !u.hasDirectoryAccess)}
                          className={clsx("text-[9px] font-black px-3 py-1 rounded-md transition-all uppercase border", u.hasDirectoryAccess ? "text-red-600 border-red-100 hover:bg-red-600 hover:text-white" : "text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white")}
                        >
                          {u.hasDirectoryAccess ? 'Remove' : 'Grant'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] italic font-bold text-slate-400 mr-2">Support:</span>
                      {u.supportAccessRequested ? (
                        <>
                          <button onClick={() => onAction(u.id, 'support', true)} className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 hover:bg-green-600 hover:text-white transition-all uppercase">Approve</button>
                          <button onClick={() => onAction(u.id, 'support', false)} className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase">Deny</button>
                        </>
                      ) : (
                        <button 
                          onClick={() => onAction(u.id, 'support', !u.hasSupportAccess)}
                          className={clsx("text-[9px] font-black px-3 py-1 rounded-md transition-all uppercase border", u.hasSupportAccess ? "text-red-600 border-red-100 hover:bg-red-600 hover:text-white" : "text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white")}
                        >
                          {u.hasSupportAccess ? 'Remove' : 'Grant'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] italic font-bold text-slate-400 mr-2">Feedback:</span>
                      {u.feedbackAccessRequested ? (
                        <>
                          <button onClick={() => onAction(u.id, 'feedback', true)} className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100 hover:bg-green-600 hover:text-white transition-all uppercase">Approve</button>
                          <button onClick={() => onAction(u.id, 'feedback', false)} className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase">Deny</button>
                        </>
                      ) : (
                        <button 
                          onClick={() => onAction(u.id, 'feedback', !u.hasFeedbackAccess)}
                          className={clsx("text-[9px] font-black px-3 py-1 rounded-md transition-all uppercase border", u.hasFeedbackAccess ? "text-red-600 border-red-100 hover:bg-red-600 hover:text-white" : "text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white")}
                        >
                          {u.hasFeedbackAccess ? 'Remove' : 'Grant'}
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// --- Modals ---

const EditUserModal = ({ user, isOpen, onClose, onSave, isLoading }: { user: User | null, isOpen: boolean, onClose: () => void, onSave: (data: Partial<User>) => void, isLoading: boolean }) => {
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) setFormData({ name: user.name, phone: user.phone, location: user.location, bloodGroup: user.bloodGroup });
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white border-0 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <Pencil size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Profile: {user.name}</h3>
        </div>
        <div className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            <Select label="Blood Group" value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}>
              {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </Select>
          </div>
          <Input label="Location" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
          
          <div className="flex gap-4 pt-4">
            <Button onClick={() => onSave(formData)} isLoading={isLoading} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700">Save Changes</Button>
            <Button variant="outline" onClick={onClose} className="flex-1 py-4 text-slate-400 border-slate-100">Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const ChangePasswordModal = ({ user, isOpen, onClose, onSave, isLoading }: { user: User | null, isOpen: boolean, onClose: () => void, onSave: (newPass: string) => void, isLoading: boolean }) => {
  const [newPass, setNewPass] = useState('');
  
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 bg-white border-0 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-50 rounded-2xl text-red-600">
            <Key size={24} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Reset Password</h3>
        </div>
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Changing password for: <span className="text-red-600">{user.email}</span></p>
          <Input label="New Password" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Enter new password" />
          
          <div className="flex gap-4 pt-4">
            <Button onClick={() => onSave(newPass)} isLoading={isLoading} className="flex-1 py-4 bg-red-600 hover:bg-red-700">Update PIN</Button>
            <Button variant="outline" onClick={onClose} className="flex-1 py-4 text-slate-400 border-slate-100">Cancel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Main UserManagement Component ---

export const UserManagement = () => {
  const { user: admin } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'user-rules' | 'editor-rules' | 'access-hub'>('users');
  
  const [editModalUser, setEditModalUser] = useState<User | null>(null);
  const [passModalUser, setPassModalUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, p] = await Promise.all([getUsers(), getAppPermissions()]);
      setUsers(u);
      setPermissions(p);
    } catch (e) {
      showToast("Failed to fetch administrative data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!admin) return;
    if (window.confirm("Archive this user? This will remove their profile from the active directory.")) {
      try {
        await deleteUserRecord(id, admin);
        showToast("User account moved to archives.");
        fetchData();
      } catch (e) {
        showToast("Action failed.", "error");
      }
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!admin) return;
    try {
      await updateUserProfile(userId, { role: newRole }, admin);
      showToast("User role updated successfully.");
      fetchData();
    } catch (e) {
      showToast("Update failed.", "error");
    }
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!admin || !editModalUser) return;
    setActionLoading(true);
    try {
      await updateUserProfile(editModalUser.id, data, admin);
      showToast("User profile updated successfully.");
      setEditModalUser(null);
      fetchData();
    } catch (e) {
      showToast("Update failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (newPass: string) => {
    if (!admin || !passModalUser) return;
    if (newPass.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }
    setActionLoading(true);
    try {
      await adminForceChangePassword(passModalUser.id, newPass, admin);
      showToast("Password updated for " + passModalUser.name);
      setPassModalUser(null);
    } catch (e) {
      showToast("Update failed.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePermissions = async (role: 'user' | 'editor', newRolePerms: RolePermissions) => {
    if (!admin || !permissions) return;
    setActionLoading(true);
    const updatedPerms = {
      ...permissions,
      [role]: newRolePerms
    };
    try {
      await updateAppPermissions(updatedPerms, admin);
      setPermissions(updatedPerms);
      showToast(`${role.charAt(0).toUpperCase() + role.slice(1)} rules updated globally.`);
    } catch (e: any) {
      showToast(e.message || "Failed to sync permissions.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccessAction = async (uid: string, type: 'directory' | 'support' | 'feedback', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(uid, approve, admin);
      else if (type === 'support') await handleSupportAccess(uid, approve, admin);
      else if (type === 'feedback') await handleFeedbackAccess(uid, approve, admin);
      showToast(`Access ${approve ? 'granted' : 'revoked'} successfully.`);
      fetchData();
    } catch (e) {
      showToast("Update failed.", "error");
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Synchronizing User Records...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      
      <EditUserModal 
        user={editModalUser} 
        isOpen={!!editModalUser} 
        onClose={() => setEditModalUser(null)} 
        onSave={handleUpdateProfile} 
        isLoading={actionLoading} 
      />
      <ChangePasswordModal 
        user={passModalUser} 
        isOpen={!!passModalUser} 
        onClose={() => setPassModalUser(null)} 
        onSave={handleResetPassword} 
        isLoading={actionLoading} 
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">User Management</h1>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('users')}
            className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'users' ? "bg-white shadow-md text-red-600" : "text-slate-500 hover:text-slate-700")}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('user-rules')}
            className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'user-rules' ? "bg-white shadow-md text-red-600" : "text-slate-500 hover:text-slate-700")}
          >
            User Rules
          </button>
          <button 
            onClick={() => setActiveTab('editor-rules')}
            className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'editor-rules' ? "bg-white shadow-md text-red-600" : "text-slate-500 hover:text-slate-700")}
          >
            Editor Rules
          </button>
          <button 
            onClick={() => setActiveTab('access-hub')}
            className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all", activeTab === 'access-hub' ? "bg-white shadow-md text-red-600" : "text-slate-500 hover:text-slate-700")}
          >
            Access Hub
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
               <input 
                 type="text" 
                 placeholder="Search by name, email or city..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
               />
             </div>
             <Button onClick={fetchData} variant="outline" className="px-6 h-[46px] border-slate-100 text-slate-400">
               <RotateCcw size={16} className="mr-2" /> Refresh
             </Button>
          </div>

          <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-6 py-4 w-1/3">Profile</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center">
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-3 text-slate-300" />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 tracking-tight leading-none mb-1.5">{u.name}</p>
                            <Badge color="red" className="text-[9px] py-0 px-2 bg-red-50 text-red-600 border border-red-100">{u.bloodGroup}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          <select 
                            value={u.role} 
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="bg-transparent border-0 rounded-xl px-0 py-1.5 font-black text-xs uppercase tracking-widest outline-none cursor-pointer text-slate-700 hover:text-red-600 transition-colors"
                          >
                            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => setEditModalUser(u)}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit User Info"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => setPassModalUser(u)}
                            className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                            title="Reset Password"
                          >
                            <Key size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)} 
                            disabled={u.email === admin?.email}
                            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0"
                            title="Archive User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'user-rules' && permissions && (
        <RulesConfigurator 
          role="user" 
          currentPerms={permissions.user} 
          onSave={(p) => handleSavePermissions('user', p)}
          isLoading={actionLoading}
        />
      )}

      {activeTab === 'editor-rules' && permissions && (
        <RulesConfigurator 
          role="editor" 
          currentPerms={permissions.editor} 
          onSave={(p) => handleSavePermissions('editor', p)}
          isLoading={actionLoading}
        />
      )}

      {activeTab === 'access-hub' && (
        <AccessHub 
          users={users} 
          onAction={handleAccessAction}
        />
      )}
    </div>
  );
};

export const ManageDonations = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const data = await getDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatus = async (id: string, status: DonationStatus) => {
    if (!user) return;
    try {
      await updateDonationStatus(id, status, user);
      showToast(`Donation ${status === 'COMPLETED' ? 'Verified' : 'Rejected'} successfully.`);
      fetchData();
    } catch (e) {
      showToast("Operation failed.", "error");
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-black uppercase tracking-widest">Loading Records...</div>;

  return (
    <div className="space-y-6">
      <Toast {...toastState} onClose={hideToast} />
      <h1 className="text-2xl font-bold">Donation Management</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase">
            <tr>
              <th className="px-4 py-3">Donor</th>
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {donations.map(d => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-bold">{d.userName}</td>
                <td className="px-4 py-3 text-red-600 font-black">{d.userBloodGroup}</td>
                <td className="px-4 py-3">{d.units}ml</td>
                <td className="px-4 py-3">{new Date(d.donationDate).toLocaleDateString()}</td>
                <td className="px-4 py-3"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'REJECTED' ? 'red' : 'yellow')}>{d.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  {d.status === DonationStatus.PENDING && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleStatus(d.id, DonationStatus.COMPLETED)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={18}/></button>
                      <button onClick={() => handleStatus(d.id, DonationStatus.REJECTED)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><X size={18}/></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export const DonorSearch = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');
  const [group, setGroup] = useState('');

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  const filtered = users.filter(u => 
    (u.name.toLowerCase().includes(filter.toLowerCase()) || u.location.toLowerCase().includes(filter.toLowerCase())) &&
    (group === '' || u.bloodGroup === group)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Donor Directory</h1>
        <div className="flex gap-4">
          <Input placeholder="Search name or location..." value={filter} onChange={e => setFilter(e.target.value)} className="w-64" />
          <Select value={group} onChange={e => setGroup(e.target.value)} className="w-32">
            <option value="">All Groups</option>
            {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(u => (
          <Card key={u.id} className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden border">
                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{u.name}</h3>
                <Badge color="red">{u.bloodGroup}</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2"><MapPin size={14}/> {u.location}</div>
              <div className="flex items-center gap-2"><Phone size={14}/> {u.phone}</div>
              {u.lastDonationDate && <div className="flex items-center gap-2"><Calendar size={14}/> Last: {new Date(u.lastDonationDate).toLocaleDateString()}</div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const SystemLogs = () => {
  const { user: admin } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
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
      try {
        await deleteLogEntry(id, admin);
        showToast("Log entry moved to archives.");
        fetchLogs();
      } catch (e) {
        showToast("Action failed.", "error");
      }
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300">Fetching Logs...</div>;

  return (
    <div className="space-y-6">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Activity Logs</h1>
        <Button onClick={fetchLogs} variant="outline" className="flex items-center gap-2">
           <RotateCcw size={16} /> Refresh
        </Button>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold">{log.userName}</td>
                <td className="px-4 py-3"><Badge color="blue">{log.action}</Badge></td>
                <td className="px-4 py-3 text-slate-600">{log.details}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(log.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export const DeletedRecords = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [data, setData] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'donations' | 'logs' | 'feedbacks' | 'notices'>('users');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    let res = [];
    if (tab === 'users') res = await getDeletedUsers();
    else if (tab === 'donations') res = await getDeletedDonations();
    else if (tab === 'logs') res = await getDeletedLogs();
    else if (tab === 'feedbacks') res = await getDeletedFeedbacks();
    else if (tab === 'notices') res = await getDeletedNotices();
    setData(res);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab]);

  const handleRestore = async (id: string) => {
    if (!user) return;
    try {
      if (tab === 'users') await restoreDeletedUser(id, user);
      else if (tab === 'donations') await restoreDeletedDonation(id, user);
      else if (tab === 'logs') await restoreDeletedLog(id, user);
      else if (tab === 'feedbacks') await restoreDeletedFeedback(id, user);
      else if (tab === 'notices') await restoreDeletedNotice(id, user);
      showToast("Record successfully restored.");
      fetchData();
    } catch (e) {
      showToast("Restore failed.", "error");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!user || user.role !== UserRole.ADMIN) return;
    if (!window.confirm("WARNING: This will permanently delete the record from the database. This cannot be undone. Proceed?")) return;
    try {
      if (tab === 'feedbacks') {
        await permanentlyDeleteArchivedFeedback(id, user);
        showToast("Record permanently erased.");
        fetchData();
      } else {
        showToast("Permanent deletion for this type is not yet enabled.", "warning");
      }
    } catch (e) {
      showToast("Deletion failed.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Archives</h1>
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          <button onClick={() => setTab('users')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap", tab === 'users' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Users</button>
          <button onClick={() => setTab('donations')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap", tab === 'donations' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Donations</button>
          <button onClick={() => setTab('logs')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap", tab === 'logs' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Logs</button>
          <button onClick={() => setTab('feedbacks')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap", tab === 'feedbacks' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Feedback</button>
          <button onClick={() => setTab('notices')} className={clsx("px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap", tab === 'notices' ? "bg-white shadow-sm text-red-600" : "text-slate-500")}>Notices</button>
        </div>
      </div>

      <Card className="overflow-hidden min-h-[400px] border-0 shadow-lg bg-white rounded-[2rem]">
        {loading ? (
          <div className="flex items-center justify-center py-32"><Activity className="animate-spin text-red-600" size={32} /></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Identity / Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Deleted At</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Archived By</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="p-2.5 bg-white rounded-xl text-slate-400 border border-slate-100 shadow-sm">
                          {tab === 'notices' ? <Megaphone size={18} /> : (tab === 'feedbacks' ? <MessageSquareQuote size={18} /> : <RotateCcw size={18} />)}
                       </div>
                       <div>
                         <p className="font-black text-slate-900 tracking-tight">{item.name || item.userName || item.subject || item.action || 'Archived Entry'}</p>
                         <p className="text-[11px] text-slate-400 font-medium truncate max-w-[250px]">{item.email || item.message || item.details || item.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-400 text-xs font-bold">{new Date(item.deletedAt).toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <Badge color="gray" className="py-1 px-3 bg-slate-100">{item.deletedBy}</Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleRestore(item.id)} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm bg-white border border-blue-100 transition-all active:scale-95">
                        <RotateCcw size={16}/> Restore
                      </button>
                      {user?.role === UserRole.ADMIN && (
                        <button onClick={() => handlePermanentDelete(item.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-xl border border-red-100 transition-all active:scale-95" title="Permanently Erase">
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-32 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <RotateCcw size={64} />
                      <p className="text-sm font-black uppercase tracking-[0.2em] mt-4">Archive Empty</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export const DirectoryPermissions = () => {
  const { user: admin } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [requests, setRequests] = useState<User[]>([]);
  const [pendingFeedbacks, setPendingFeedbacks] = useState<DonationFeedback[]>([]);

  const fetchRequests = async () => {
    const [allUsers, allFeedbacks] = await Promise.all([getUsers(), getAllFeedbacks()]);
    setRequests(allUsers.filter(u => u.directoryAccessRequested || u.supportAccessRequested || u.feedbackAccessRequested));
    setPendingFeedbacks(allFeedbacks.filter(f => f.status === FeedbackStatus.PENDING));
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (uid: string, type: 'directory' | 'support' | 'feedback', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(uid, approve, admin);
      else if (type === 'support') await handleSupportAccess(uid, approve, admin);
      else if (type === 'feedback') await handleFeedbackAccess(uid, approve, admin);
      showToast(`Privileges ${approve ? 'Granted' : 'Denied'} successfully.`);
      fetchRequests();
    } catch (e) {
      showToast("Action failed.", "error");
    }
  };

  const handleFeedbackApproval = async (id: string, approve: boolean) => {
    if (!admin) return;
    try {
      await updateFeedbackStatus(id, approve ? FeedbackStatus.APPROVED : FeedbackStatus.REJECTED, true);
      showToast(`Feedback ${approve ? 'Approved' : 'Rejected'}.`);
      fetchRequests();
    } catch (e) {
      showToast("Action failed.", "error");
    }
  };

  return (
    <div className="space-y-10">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="text-red-600" /> Access Requests</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map(u => (
            <Card key={u.id} className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 overflow-hidden border">
                  {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-1 text-slate-300" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{u.name}</h3>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                {u.directoryAccessRequested && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                    <span className="text-xs font-black text-red-600 uppercase">Directory</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(u.id, 'directory', true)} className="p-1 bg-white text-green-600 rounded shadow-sm hover:bg-green-600 hover:text-white transition-all"><Check size={16}/></button>
                      <button onClick={() => handleAction(u.id, 'directory', false)} className="p-1 bg-white text-red-600 rounded shadow-sm hover:bg-red-600 hover:text-white transition-all"><X size={16}/></button>
                    </div>
                  </div>
                )}
                {u.supportAccessRequested && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                    <span className="text-xs font-black text-blue-600 uppercase">Support</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(u.id, 'support', true)} className="p-1 bg-white text-green-600 rounded shadow-sm hover:bg-green-600 hover:text-white transition-all"><Check size={16}/></button>
                      <button onClick={() => handleAction(u.id, 'support', false)} className="p-1 bg-white text-red-600 rounded shadow-sm hover:bg-red-600 hover:text-white transition-all"><X size={16}/></button>
                    </div>
                  </div>
                )}
                {u.feedbackAccessRequested && (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                    <span className="text-xs font-black text-green-600 uppercase">Feedback</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(u.id, 'feedback', true)} className="p-1 bg-white text-green-600 rounded shadow-sm hover:bg-green-600 hover:text-white transition-all"><Check size={16}/></button>
                      <button onClick={() => handleAction(u.id, 'feedback', false)} className="p-1 bg-white text-red-600 rounded shadow-sm hover:bg-red-600 hover:text-white transition-all"><X size={16}/></button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {requests.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-400 font-bold italic bg-white rounded-3xl border border-dashed border-slate-200">No pending access requests.</div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquareQuote className="text-red-600" /> Pending Feedbacks</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingFeedbacks.map(f => (
            <Card key={f.id} className="p-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border">
                    {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <Users className="p-2 text-slate-300" />}
                 </div>
                 <div>
                    <p className="font-bold text-slate-900">{f.userName}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase">{new Date(f.timestamp).toLocaleDateString()}</p>
                 </div>
              </div>
              <p className="text-sm text-slate-600 italic mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">"{f.message}"</p>
              <div className="flex gap-3">
                 <Button onClick={() => handleFeedbackApproval(f.id, true)} className="flex-1 py-2 text-xs bg-green-600 hover:bg-green-700">Approve</Button>
                 <Button onClick={() => handleFeedbackApproval(f.id, false)} variant="outline" className="flex-1 py-2 text-xs text-red-600 border-red-100 hover:bg-red-50">Reject</Button>
              </div>
            </Card>
          ))}
          {pendingFeedbacks.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-400 font-bold italic bg-white rounded-3xl border border-dashed border-slate-200">No feedback awaiting approval.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export const LandingPageManagement = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getLandingConfig().then(data => {
      if (data) setConfig(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !config) return;
    setSaving(true);
    try {
      await updateLandingConfig(config, user);
      showToast("System configuration updated and synced.");
    } catch (e) {
      showToast("Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Loading Customizer...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Page Customizer</h1>
          <p className="text-sm text-slate-500 font-medium">Customize the experience across all public-facing pages.</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="px-8 rounded-2xl shadow-xl shadow-red-100">
          <Save className="mr-2" size={18} /> Save & Publish
        </Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Landing Page Content */}
        <div className="space-y-8">
          <Card className="p-8 space-y-6 rounded-3xl border-0 shadow-xl bg-white">
            <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Monitor className="text-red-600" /> Hero Section</h3>
            <div className="space-y-4">
              <Input label="Main Title" value={config?.heroTitle} onChange={e => setConfig(prev => prev ? {...prev, heroTitle: e.target.value} : null)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Subtitle / Description</label>
                <textarea 
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-none"
                  value={config?.heroSubtitle}
                  onChange={e => setConfig(prev => prev ? {...prev, heroSubtitle: e.target.value} : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Primary Action Button" value={config?.heroButtonPrimary} onChange={e => setConfig(prev => prev ? {...prev, heroButtonPrimary: e.target.value} : null)} />
                <Input label="Secondary Action Button" value={config?.heroButtonSecondary} onChange={e => setConfig(prev => prev ? {...prev, heroButtonSecondary: e.target.value} : null)} />
              </div>
            </div>
          </Card>

          <Card className="p-8 space-y-6 rounded-3xl border-0 shadow-xl bg-white">
            <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Activity className="text-red-600" /> Stats & Feedback Headers</h3>
            <div className="space-y-4">
              <Input label="Stats Section Title" value={config?.statsSectionTitle} onChange={e => setConfig(prev => prev ? {...prev, statsSectionTitle: e.target.value} : null)} />
              <div className="grid grid-cols-1 gap-4">
                <Input label="Feedback Section Title" value={config?.feedbackSectionTitle} onChange={e => setConfig(prev => prev ? {...prev, feedbackSectionTitle: e.target.value} : null)} />
                <Input label="Feedback Section Subtitle" value={config?.feedbackSectionSubtitle} onChange={e => setConfig(prev => prev ? {...prev, feedbackSectionSubtitle: e.target.value} : null)} />
              </div>
            </div>
          </Card>

          <Card className="p-8 space-y-6 rounded-3xl border-0 shadow-xl bg-white">
            <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><BellRing className="text-red-600" /> Bottom CTA Banner</h3>
            <div className="space-y-4">
              <Input label="CTA Banner Title" value={config?.ctaTitle} onChange={e => setConfig(prev => prev ? {...prev, ctaTitle: e.target.value} : null)} />
              <Input label="CTA Banner Subtitle" value={config?.ctaSubtitle} onChange={e => setConfig(prev => prev ? {...prev, ctaSubtitle: e.target.value} : null)} />
              <Input label="CTA Banner Button" value={config?.ctaButtonText} onChange={e => setConfig(prev => prev ? {...prev, ctaButtonText: e.target.value} : null)} />
            </div>
          </Card>

          <Card className="p-8 space-y-6 rounded-3xl border-0 shadow-xl bg-white">
            <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Globe className="text-slate-400" /> Footer Details</h3>
            <div className="space-y-4">
              <Input label="Copyright Text" value={config?.footerCopyright} onChange={e => setConfig(prev => prev ? {...prev, footerCopyright: e.target.value} : null)} />
              <Input label="Footer Tagline" value={config?.footerTagline} onChange={e => setConfig(prev => prev ? {...prev, footerTagline: e.target.value} : null)} />
            </div>
          </Card>
        </div>

        {/* Auth Pages Customization */}
        <div className="space-y-8">
          <Card className="p-8 space-y-6 rounded-3xl border-0 shadow-xl bg-white ring-4 ring-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><LogIn className="text-red-600" /> Login Page</h3>
              <Badge color="red">Public View</Badge>
            </div>
            <div className="space-y-4">
              <Input label="Form Main Title" value={config?.loginTitle} onChange={e => setConfig(prev => prev ? {...prev, loginTitle: e.target.value} : null)} />
              <Input label="Form Small Subtitle" value={config?.loginSubtitle} onChange={e => setConfig(prev => prev ? {...prev, loginSubtitle: e.target.value} : null)} />
              <Input label="Sidebar Headline" value={config?.loginHeadline} onChange={e => setConfig(prev => prev ? {...prev, loginHeadline: e.target.value} : null)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sidebar Description</label>
                <textarea 
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-none"
                  value={config?.loginDescription}
                  onChange={e => setConfig(prev => prev ? {...prev, loginDescription: e.target.value} : null)}
                />
              </div>
              <Input label="Login Button Label" value={config?.loginButtonLabel} onChange={e => setConfig(prev => prev ? {...prev, loginButtonLabel: e.target.value} : null)} />
            </div>
          </Card>

          <Card className="p-8 space-y-6 rounded-3xl border-0 shadow-xl bg-white ring-4 ring-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><UserPlus className="text-red-600" /> Registration Page</h3>
              <Badge color="red">Public View</Badge>
            </div>
            <div className="space-y-4">
              <Input label="Form Main Title" value={config?.registerTitle} onChange={e => setConfig(prev => prev ? {...prev, registerTitle: e.target.value} : null)} />
              <Input label="Form Small Subtitle" value={config?.registerSubtitle} onChange={e => setConfig(prev => prev ? {...prev, registerSubtitle: e.target.value} : null)} />
              <Input label="Sidebar Headline" value={config?.registerHeadline} onChange={e => setConfig(prev => prev ? {...prev, registerHeadline: e.target.value} : null)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sidebar Description</label>
                <textarea 
                  className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] resize-none"
                  value={config?.registerDescription}
                  onChange={e => setConfig(prev => prev ? {...prev, registerDescription: e.target.value} : null)}
                />
              </div>
              <Input label="Submit Button Label" value={config?.registerButtonLabel} onChange={e => setConfig(prev => prev ? {...prev, registerButtonLabel: e.target.value} : null)} />
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};
