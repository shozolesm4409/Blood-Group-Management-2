
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  getDonations, 
  getLogs, 
  updateDonationStatus, 
  getUsers, 
  addDonation, 
  deleteUserRecord, 
  updateUserProfile, 
  adminForceChangePassword,
  getDeletedUsers,
  getDeletedDonations,
  deleteDonationRecord,
  getAppPermissions,
  updateAppPermissions,
  handleDirectoryAccess,
  handleSupportAccess,
  requestDirectoryAccess,
  deleteLogEntry,
  getRevokedPermissions,
  restoreRevokedPermission,
  restoreDeletedUser,
  restoreDeletedDonation,
  ADMIN_EMAIL 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, Badge, Button, Input, Select, ConfirmModal } from '../components/UI';
import { DonationRecord, AuditLog, DonationStatus, User, UserRole, AppPermissions, BloodGroup, RevokedPermission } from '../types';
import { 
  Check, X, Plus, Edit2, 
  Trash2, Key, Users, Activity, ChevronRight, Layout as LayoutIcon, ShieldCheck, ChevronDown, ChevronUp, Lock, BellRing, Info, Mail, Phone, MapPin, Calendar, Search, Filter, LifeBuoy, MoreVertical, ExternalLink, Archive, Clock, Droplet, AlertTriangle, ShieldAlert,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';

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
      alert(`User role updated to ${newRole} successfully.`);
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
      alert("User account archived and removed.");
      fetchData();
      setDeleteUserId(null);
    } catch (e) {
      alert("Error deleting user.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePerms = async () => {
    if (!perms || !currentUser || currentUser.role !== UserRole.ADMIN) return;
    setSavingPerms(true);
    try {
      const result = await updateAppPermissions(perms, currentUser);
      if (result.synced) {
        alert("System permissions synced to cloud successfully.");
      } else {
        alert("Permissions saved locally (Cloud sync blocked).");
      }
    } catch (err: any) {
      alert(err.message || "Rule sync failed.");
    } finally {
      setSavingPerms(false);
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

  const handleAccessAction = async (userId: string, type: 'directory' | 'support', approve: boolean) => {
    if (!currentUser) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(userId, approve, currentUser);
      else await handleSupportAccess(userId, approve, currentUser);
      alert(`${type === 'directory' ? 'Directory' : 'Support'} access ${approve ? 'granted' : 'rejected'}.`);
      fetchData();
    } catch (e) {
      alert("Action failed.");
    }
  };

  const canManagePerms = currentUser?.role === UserRole.ADMIN;
  const pendingRequests = users.filter(u => u.directoryAccessRequested || u.supportAccessRequested);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-3xl font-bold text-[#0F172A]">Registry Management</h1>
        <div className="flex bg-[#F1F5F9] p-1 rounded-xl shadow-inner border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          <button onClick={() => setActiveTab('users')} className={clsx("px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap", activeTab === 'users' ? "bg-white shadow-sm text-red-600" : "text-slate-500 hover:text-slate-900")}>User Data</button>
          <button onClick={() => setActiveTab('user-rules')} className={clsx("px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap", activeTab === 'user-rules' ? "bg-white shadow-sm text-red-600" : "text-slate-500 hover:text-slate-900")}>User Rules</button>
          <button onClick={() => setActiveTab('editor-rules')} className={clsx("px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap", activeTab === 'editor-rules' ? "bg-white shadow-sm text-red-600" : "text-slate-500 hover:text-slate-900")}>Editor Rules</button>
          <button onClick={() => setActiveTab('directory-access')} className={clsx("relative px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap", activeTab === 'directory-access' ? "bg-white shadow-sm text-red-600" : "text-slate-500 hover:text-slate-900")}>Privileges {pendingRequests.length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] text-white animate-pulse">{pendingRequests.length}</span>}</button>
        </div>
      </div>

      {activeTab === 'directory-access' && (
        <Card className="p-8 shadow-lg border-0 space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ShieldCheck size={24} /></div>
            <div>
              <h3 className="font-bold text-xl text-slate-900">Privileged Account Directory</h3>
              <p className="text-xs text-slate-500">Authorized users with extended system permissions.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b text-[10px] text-slate-500 font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Directory</th>
                  <th className="px-6 py-4">Support</th>
                  <th className="px-6 py-4 text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.filter(u => u.hasDirectoryAccess || u.hasSupportAccess).map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                           {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <Users className="p-2 text-slate-300" size={14} />}
                         </div>
                         <p className="font-bold text-slate-900">{u.name}</p>
                       </div>
                    </td>
                    <td className="px-6 py-4"><Badge color="gray">{u.role}</Badge></td>
                    <td className="px-6 py-4">{u.hasDirectoryAccess ? <Badge color="green">Granted</Badge> : '-'}</td>
                    <td className="px-6 py-4">{u.hasSupportAccess ? <Badge color="blue">Active</Badge> : '-'}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         {u.hasDirectoryAccess && u.role !== UserRole.ADMIN && (
                           <button onClick={() => handleAccessAction(u.id, 'directory', false)} className="text-red-600 text-[10px] font-black uppercase hover:underline">Revoke Dir</button>
                         )}
                         {u.hasSupportAccess && u.role !== UserRole.ADMIN && (
                           <button onClick={() => handleAccessAction(u.id, 'support', false)} className="text-red-600 text-[10px] font-black uppercase hover:underline">Revoke Sup</button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'users' && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Profile</th>
                  <th className="px-6 py-5">Email</th>
                  <th className="px-6 py-5">Role</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                          {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt={u.name} /> : <Users className="p-2.5 text-slate-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-[#1E293B]">{u.name}</p>
                          <p className="text-[10px] text-red-600 uppercase font-bold">{u.bloodGroup}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#64748B] font-medium">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.email.toLowerCase() === ADMIN_EMAIL ? (
                         <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter bg-red-50 px-2 py-1 rounded">Super Admin</span>
                      ) : (
                        <select className="bg-transparent border-0 text-xs font-bold text-slate-700 appearance-none focus:ring-0 cursor-pointer" value={u.role} disabled={!canManagePerms} onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}>
                          <option value={UserRole.USER}>User</option>
                          <option value={UserRole.EDITOR}>Editor</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditUser(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16}/></button>
                        <button onClick={() => setShowPwdModal(u.id)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"><Key size={16}/></button>
                        {u.email.toLowerCase() !== ADMIN_EMAIL && (
                          <button onClick={() => setDeleteUserId(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(activeTab === 'user-rules' || activeTab === 'editor-rules') && perms && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
            <h3 className="font-black text-xs text-red-600 uppercase tracking-widest mb-8 flex items-center gap-2"><LayoutIcon size={16} /> Sidebar Access Controls</h3>
            <div className="space-y-3">
              {Object.keys(perms[activeTab === 'user-rules' ? 'user' : 'editor'].sidebar).map((key) => (
                <div key={key} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-white shadow-sm">
                  <span className="font-bold text-[#334155] text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" disabled={!canManagePerms} checked={!!(perms[activeTab === 'user-rules' ? 'user' : 'editor'].sidebar as any)?.[key]} onChange={() => togglePermission(activeTab === 'user-rules' ? 'user' : 'editor', 'sidebar', key)} className="w-5 h-5 rounded accent-red-600 cursor-pointer border-slate-300"/>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
            <h3 className="font-black text-xs text-red-600 uppercase tracking-widest mb-8 flex items-center gap-2"><ShieldCheck size={16} /> Functional Logic</h3>
            <div className="space-y-3">
              {Object.keys(perms[activeTab === 'user-rules' ? 'user' : 'editor'].rules).map((key) => (
                <div key={key} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-white shadow-sm">
                  <span className="font-bold text-[#334155] text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" disabled={!canManagePerms} checked={!!(perms[activeTab === 'user-rules' ? 'user' : 'editor'].rules as any)?.[key]} onChange={() => togglePermission(activeTab === 'user-rules' ? 'user' : 'editor', 'rules', key)} className="w-5 h-5 rounded accent-red-600 cursor-pointer border-slate-300"/>
                </div>
              ))}
            </div>
            {canManagePerms && (
              <div className="mt-10">
                <button onClick={handleSavePerms} disabled={savingPerms} className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50">
                  {savingPerms ? 'Processing...' : 'Synchronize Global Rules'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="p-8 bg-white border-0 shadow-2xl w-full max-w-lg rounded-3xl animate-in zoom-in-95">
            <h3 className="font-bold text-xl mb-6">Profile Overwrite</h3>
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
               <Input label="Name" name="name" defaultValue={editUser.name} required />
               <Input label="Email" name="email" type="email" defaultValue={editUser.email} required />
               <div className="grid grid-cols-2 gap-4">
                 <Select label="Group" name="bloodGroup" defaultValue={editUser.bloodGroup}>
                   {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
                 </Select>
                 <Input label="Phone" name="phone" defaultValue={editUser.phone} required />
               </div>
               <Input label="Location" name="location" defaultValue={editUser.location} required />
               <div className="flex gap-3 pt-4">
                 <Button type="submit" className="flex-1 py-4" isLoading={editLoading}>Apply Updates</Button>
                 <Button type="button" variant="outline" className="flex-1 py-4" onClick={() => setEditUser(null)}>Cancel</Button>
               </div>
            </form>
          </Card>
        </div>
      )}

      {showPwdModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="p-8 bg-white border-0 shadow-2xl w-full max-w-md rounded-3xl animate-in zoom-in-95">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><Key className="text-orange-600" /> PIN Reset</h3>
            <form onSubmit={(e) => handleAdminPasswordChange(showPwdModal, e)} className="space-y-5">
               <Input label="New Key Code" name="newPassword" type="text" required placeholder="e.g. 123456" />
               <div className="flex gap-3 pt-2">
                 <Button type="submit" className="flex-1 py-4">Force Override</Button>
                 <Button type="button" variant="outline" className="flex-1 py-4" onClick={() => setShowPwdModal(null)}>Close</Button>
               </div>
            </form>
          </Card>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteUserId} onClose={() => setDeleteUserId(null)} onConfirm={confirmDeleteUser} title="Account Purge?" message="Delete this account? Recorded in audit logs." isLoading={isDeleting} />
    </div>
  );
};

export const DeletedRecords = () => {
  const { user: admin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [revokedPerms, setRevokedPerms] = useState<RevokedPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'donations' | 'permissions'>('users');

  const fetchData = async () => {
    setLoading(true);
    const [u, d, r] = await Promise.all([getDeletedUsers(), getDeletedDonations(), getRevokedPermissions()]);
    setUsers(u);
    setDonations(d);
    setRevokedPerms(r);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRestorePermission = async (id: string) => {
    if (!admin) return;
    try {
      await restoreRevokedPermission(id, admin);
      alert("Permission restored successfully.");
      fetchData();
    } catch (e) {
      alert("Restore failed.");
    }
  };

  const handleRestoreUser = async (id: string) => {
    if (!admin) return;
    try {
      await restoreDeletedUser(id, admin);
      alert("User account restored.");
      fetchData();
    } catch (e) {
      alert("Restore failed.");
    }
  };

  const handleRestoreDonation = async (id: string) => {
    if (!admin) return;
    try {
      await restoreDeletedDonation(id, admin);
      alert("Donation record restored.");
      fetchData();
    } catch (e) {
      alert("Restore failed.");
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-400 font-black uppercase animate-pulse">Loading Historical Vault...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 rounded-2xl shadow-inner"><Archive className="text-red-600" size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Archives</h1>
            <p className="text-sm text-slate-500 font-medium">Historical records and revoked authorizations.</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-fit shadow-sm border border-slate-200">
          <button onClick={() => setActiveTab('users')} className={clsx("flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'users' ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Purged Identities</button>
          <button onClick={() => setActiveTab('donations')} className={clsx("flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'donations' ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Voided Ledger</button>
          <button onClick={() => setActiveTab('permissions')} className={clsx("flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'permissions' ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Revoked Privileges</button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg bg-white animate-in fade-in duration-300">
        <div className="overflow-x-auto">
          {activeTab === 'users' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Identity</th>
                  <th className="px-6 py-5">Purged On</th>
                  <th className="px-6 py-5">Actor</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                           {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-400" size={12} />}
                        </div>
                        <p className="font-bold text-slate-900">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium uppercase text-[10px]">{new Date(u.deletedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-red-600">{u.deletedBy}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleRestoreUser(u.id)} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-xl transition-all text-[9px] font-black uppercase">
                         <RotateCcw size={12} /> Restore User
                       </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={4} className="px-6 py-20 text-center italic text-slate-400">Identity matrix is clear.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'donations' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Entry</th>
                  <th className="px-6 py-5">Voided On</th>
                  <th className="px-6 py-5">Actor</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                           {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover" /> : <Droplet className="p-1.5 text-red-400" size={12} />}
                        </div>
                        <p className="font-bold text-slate-900">{d.userName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium uppercase text-[10px]">{new Date(d.deletedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-orange-600">{d.deletedBy}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleRestoreDonation(d.id)} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-xl transition-all text-[9px] font-black uppercase">
                         <RotateCcw size={12} /> Restore Entry
                       </button>
                    </td>
                  </tr>
                ))}
                {donations.length === 0 && <tr><td colSpan={4} className="px-6 py-20 text-center italic text-slate-400">No voided records found.</td></tr>}
              </tbody>
            </table>
          )}

          {activeTab === 'permissions' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-white font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Subject</th>
                  <th className="px-6 py-5">Type</th>
                  <th className="px-6 py-5">Revoked On</th>
                  <th className="px-6 py-5">Actor</th>
                  <th className="px-6 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revokedPerms.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                           {r.userAvatar ? <img src={r.userAvatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-400" size={12} />}
                        </div>
                        <p className="font-bold text-slate-900">{r.userName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge color={r.type === 'DIRECTORY' ? 'blue' : 'gray'}>{r.type}</Badge></td>
                    <td className="px-6 py-4 text-slate-400 font-medium uppercase text-[10px]">{new Date(r.revokedAt).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{r.revokedBy}</td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => handleRestorePermission(r.id)} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-xl transition-all text-[9px] font-black uppercase">
                         <RotateCcw size={12} /> Restore Access
                       </button>
                    </td>
                  </tr>
                ))}
                {revokedPerms.length === 0 && <tr><td colSpan={5} className="px-6 py-20 text-center italic text-slate-400">No revoked permissions in archive.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export const SystemLogs = () => {
  const { user: admin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  useEffect(() => { getLogs().then(setLogs); }, []);
  const handleDeleteLog = async (id: string) => {
    if (!admin) return;
    try {
      await deleteLogEntry(id, admin);
      getLogs().then(setLogs);
    } catch (e) {}
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Registry</h1>
      <Card className="overflow-hidden border-0 shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900 text-[10px] text-white uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-6 py-5">Module</th>
                <th className="px-6 py-5">Actor</th>
                <th className="px-6 py-5">Date & Time</th>
                <th className="px-6 py-5">Details</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4"><Badge color="blue">{log.action}</Badge></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        {log.userAvatar ? <img src={log.userAvatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-400" size={12} />}
                      </div>
                      <span className="font-bold">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{log.details}</td>
                  <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteLog(log.id)} className="text-slate-200 hover:text-red-600"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const ManageDonations = () => {
  const { user: admin } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllDonations = async () => {
    const data = await getDonations();
    setDonations(data);
    setLoading(false);
  };

  useEffect(() => { fetchAllDonations(); }, []);

  const handleStatusUpdate = async (id: string, status: DonationStatus) => {
    if (!admin) return;
    try {
      await updateDonationStatus(id, status, admin);
      alert(`Donation marked as ${status}.`);
      fetchAllDonations();
    } catch (e) {
      alert("Status update failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!admin) return;
    if (window.confirm("Move this record to archives?")) {
      await deleteDonationRecord(id, admin);
      fetchAllDonations();
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">LOADING LEDGER...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Donation Ledger</h1>
      <Card className="overflow-hidden border-0 shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-black tracking-widest border-b">
              <tr>
                <th className="px-6 py-5">Donor</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Volume</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donations.map(d => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                        {d.userAvatar ? <img src={d.userAvatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-300" />}
                      </div>
                      <span className="font-bold">{d.userName}</span>
                      <Badge color="red">{d.userBloodGroup}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{new Date(d.donationDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-black">{d.units}ml</td>
                  <td className="px-6 py-4"><Badge color={d.status === 'COMPLETED' ? 'green' : (d.status === 'PENDING' ? 'yellow' : 'red')}>{d.status}</Badge></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {d.status === DonationStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatusUpdate(d.id, DonationStatus.COMPLETED)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check size={18}/></button>
                          <button onClick={() => handleStatusUpdate(d.id, DonationStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><X size={18}/></button>
                        </>
                      )}
                      <button onClick={() => handleDelete(d.id)} className="p-2 text-slate-300 hover:text-red-600 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const DonorSearch = () => {
  const { user } = useAuth();
  const [donors, setDonors] = useState<User[]>([]);
  const [filter, setFilter] = useState({ blood: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (user) {
      setHasAccess(user.hasDirectoryAccess || false);
      getUsers().then(u => {
        setDonors(u.filter(d => d.role !== UserRole.ADMIN));
        setLoading(false);
      });
    }
  }, [user]);

  const handleAccessRequest = async () => {
    if (!user) return;
    setRequesting(true);
    try {
      await requestDirectoryAccess(user);
      alert("Access request sent to administration.");
    } catch (e) {
      alert("Request failed.");
    } finally {
      setRequesting(false);
    }
  };

  const filtered = donors.filter(d => 
    (!filter.blood || d.bloodGroup === filter.blood) &&
    (!filter.location || d.location.toLowerCase().includes(filter.location.toLowerCase()))
  );

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95">
        <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
          <Lock size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Directory Restricted</h1>
        <p className="text-slate-500 font-medium leading-relaxed px-10">To protect donor privacy, full access to the search directory requires administrative verification.</p>
        <Button onClick={handleAccessRequest} isLoading={requesting} variant="primary" className="rounded-2xl px-12 shadow-2xl">Request Clearance</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Donor Network</h1>
          <p className="text-slate-500 font-medium">Verified life-savers in our secure database.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select className="md:w-40" value={filter.blood} onChange={(e) => setFilter({...filter, blood: e.target.value})}>
            <option value="">All Groups</option>
            {Object.values(BloodGroup).map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </Select>
          <div className="relative md:w-64">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search by city..." 
               value={filter.location} 
               onChange={(e) => setFilter({...filter, location: e.target.value})}
               className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none shadow-sm transition-all"
             />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Donor Profile</th>
                <th className="px-6 py-5">Blood Group</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Mobile Number</th>
                <th className="px-6 py-5">Last Donation</th>
                <th className="px-6 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                        {d.avatar ? <img src={d.avatar} className="w-full h-full object-cover" /> : <Users className="p-2.5 text-slate-300" />}
                      </div>
                      <span className="font-bold text-[#1E293B]">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color="red" className="px-3 py-1">{d.bloodGroup}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#64748B] font-medium">
                      <MapPin size={14} className="text-slate-400" />
                      {d.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 font-bold text-[#1E293B]">
                      <Phone size={14} className="text-red-500" />
                      {d.phone || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[#64748B] text-xs font-semibold">
                      <Calendar size={14} className="text-slate-400" />
                      {d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : 'New Donor'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to="/support" 
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-100"
                    >
                      <MessageSquare size={14} /> 
                      Contact
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Search size={48} className="mb-4" />
                      <p className="text-lg font-black uppercase tracking-widest">No Matches Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const DirectoryPermissions = () => {
  const { user: admin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const all = await getUsers();
    setUsers(all.filter(u => u.directoryAccessRequested || u.supportAccessRequested));
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (userId: string, type: 'directory' | 'support', approve: boolean) => {
    if (!admin) return;
    try {
      if (type === 'directory') await handleDirectoryAccess(userId, approve, admin);
      else await handleSupportAccess(userId, approve, admin);
      fetchPending();
    } catch (e) {
      alert("Action failed.");
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-black text-slate-400">LOADING REQUESTS...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><BellRing size={24} /></div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification Center</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map(u => (
          <Card key={u.id} className="p-8 border-0 shadow-lg bg-white relative overflow-hidden">
            {u.directoryAccessRequested && <div className="absolute top-0 right-0 p-1 bg-blue-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Directory Request</div>}
            {u.supportAccessRequested && !u.directoryAccessRequested && <div className="absolute top-0 right-0 p-1 bg-green-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Support Request</div>}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <Users className="text-slate-300" size={32} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{u.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                <Badge color="gray" className="mt-2">{u.role}</Badge>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => handleAction(u.id, u.directoryAccessRequested ? 'directory' : 'support', true)} 
                className="flex-1 rounded-2xl bg-green-600 hover:bg-green-700 shadow-green-100"
              >
                Approve Access
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAction(u.id, u.directoryAccessRequested ? 'directory' : 'support', false)} 
                className="flex-1 rounded-2xl border-slate-100 text-slate-400"
              >
                Deny
              </Button>
            </div>
          </Card>
        ))}
        {users.length === 0 && (
          <div className="col-span-full py-32 text-center opacity-20 flex flex-col items-center">
            <CheckCircle size={80} className="mb-6" />
            <p className="text-2xl font-black uppercase tracking-[0.2em]">Zero Pending Requests</p>
          </div>
        )}
      </div>
    </div>
  );
};
