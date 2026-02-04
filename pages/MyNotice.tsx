
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { addNotice, updateNotice, subscribeToNotices, deleteNotice, getUsers, getAppPermissions } from '../services/api';
import { Card, Button, Input, Badge, Toast, useToast, ConfirmModal } from '../components/UI';
import { Megaphone, Plus, Trash2, Edit2, Clock, User as UserIcon, Type, Palette, UserPlus, X, Send, Search, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type as FontIcon } from 'lucide-react';
import { Notice, User, UserRole, AppPermissions } from '../types';
import clsx from 'clsx';

export const MyNotice = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [deleteNoticeId, setDeleteNoticeId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<AppPermissions | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    getAppPermissions().then(setPerms);
    getUsers().then(setAllUsers);
    const unsubscribe = subscribeToNotices((data) => {
      setNotices(data);
      setLoading(false);
    }, (err) => {
      console.error("Notice sync error:", err.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;
  const canPost = perms?.[user?.role?.toLowerCase() as 'user' | 'editor']?.rules.canPostNotice || isAdmin;

  const applyStyle = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !subject.trim() || !editorRef.current?.innerHTML.trim()) {
      showToast("Please provide both subject and details.", "warning");
      return;
    }

    setIsPosting(true);
    const details = editorRef.current.innerHTML;

    try {
      if (editModeId) {
        await updateNotice(editModeId, { subject, details, mentions: mentionedUsers.map(u => u.id) }, user);
        showToast("Notice updated successfully.");
      } else {
        await addNotice({ subject, details, authorId: user.id, authorName: user.name, authorAvatar: user.avatar || '', timestamp: new Date().toISOString(), mentions: mentionedUsers.map(u => u.id) }, user);
        showToast("Notice published successfully.");
      }
      resetEditor();
      setShowCreate(false);
    } catch (e) {
      showToast("Operation failed.", "error");
    } finally {
      setIsPosting(false);
    }
  };

  const startEdit = (notice: Notice) => {
    setEditModeId(notice.id);
    setSubject(notice.subject);
    const mentions = allUsers.filter(u => notice.mentions?.includes(u.id));
    setMentionedUsers(mentions);
    setShowCreate(true);
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = notice.details; }, 50);
  };

  const resetEditor = () => {
    setEditModeId(null);
    setSubject('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setMentionedUsers([]);
  };

  const confirmDelete = async () => {
    if (!user || !deleteNoticeId) return;
    try {
      await deleteNotice(deleteNoticeId, user);
      showToast("Notice archived.");
      setDeleteNoticeId(null);
    } catch (e) { showToast("Action failed.", "error"); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <Toast {...toastState} onClose={hideToast} />
      <ConfirmModal isOpen={!!deleteNoticeId} onClose={() => setDeleteNoticeId(null)} onConfirm={confirmDelete} title="Move to Archives?" message="Archive this notice?" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 rounded-2xl text-white shadow-lg"><Megaphone size={28} className="fill-current" /></div>
          <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">Official Board</h1><p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Broadcast & Updates</p></div>
        </div>
        {canPost && <Button onClick={() => { if(showCreate) resetEditor(); setShowCreate(!showCreate); }} variant={showCreate ? "outline" : "primary"} className="rounded-2xl px-8">{showCreate ? <X className="mr-2" size={18} /> : <Plus className="mr-2" size={18} />} {showCreate ? "Close Editor" : "New Notice"}</Button>}
      </div>

      {showCreate && (
        <Card className="p-8 border-0 shadow-2xl bg-white rounded-[2.5rem] animate-in slide-in-from-top-10 duration-500 overflow-hidden ring-4 ring-red-50">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8 pb-4 border-b border-slate-50">{editModeId ? 'Refine Announcement' : 'Compose Notice'}</h2>
          <form onSubmit={handlePostNotice} className="space-y-8">
            <Input label="Announcement Subject" value={subject} onChange={e => setSubject(e.target.value)} required className="text-lg font-bold py-4 px-6 rounded-2xl" />
            
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Rich Editor (Select text to style)</label>
              <div className="bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner">
                 <div className="flex flex-wrap items-center gap-2 p-4 bg-white border-b border-slate-100 overflow-x-auto no-scrollbar">
                    <button type="button" onClick={() => applyStyle('bold')} className="p-2 hover:bg-slate-100 rounded-lg font-black">B</button>
                    <button type="button" onClick={() => applyStyle('italic')} className="p-2 hover:bg-slate-100 rounded-lg italic">I</button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                    <button type="button" onClick={() => applyStyle('justifyLeft')} className="p-2 hover:bg-slate-100 rounded-lg"><AlignLeft size={16}/></button>
                    <button type="button" onClick={() => applyStyle('justifyCenter')} className="p-2 hover:bg-slate-100 rounded-lg"><AlignCenter size={16}/></button>
                    <button type="button" onClick={() => applyStyle('justifyRight')} className="p-2 hover:bg-slate-100 rounded-lg"><AlignRight size={16}/></button>
                    <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                    <select onChange={(e) => applyStyle('fontSize', e.target.value)} className="bg-slate-50 border-0 rounded-lg text-xs font-bold px-2 py-1 outline-none">
                      <option value="3">Normal</option>
                      <option value="1">Small</option>
                      <option value="5">Large</option>
                      <option value="7">Extra Large</option>
                    </select>
                    <div className="relative group p-2 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-1">
                      <Palette size={16} />
                      <input type="color" onChange={(e) => applyStyle('foreColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    <div className="relative group p-2 hover:bg-slate-100 rounded-lg cursor-pointer flex items-center gap-1">
                      <Highlighter size={16} />
                      <input type="color" onChange={(e) => applyStyle('hiliteColor', e.target.value)} defaultValue="#FFFF00" className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                 </div>
                 <div ref={editorRef} contentEditable className="w-full bg-slate-50 p-8 min-h-[300px] text-base font-medium focus:outline-none custom-scrollbar overflow-y-auto leading-relaxed" />
              </div>
            </div>
            <Button type="submit" isLoading={isPosting} className="w-full py-5 rounded-[1.5rem] text-lg"><Send className="mr-3" size={22} /> {editModeId ? 'Synchronize Update' : 'Broadcast Now'}</Button>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        {loading ? <div className="text-center py-24 opacity-30"><Megaphone className="animate-bounce text-red-600 mx-auto" size={64} /></div> : notices.map(n => (
          <Card key={n.id} className="group overflow-hidden border-0 shadow-lg bg-white rounded-[2.5rem] hover:shadow-2xl transition-all border-l-[12px] border-l-red-600">
            <div className="p-8 lg:p-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-xl flex-shrink-0">
                    {n.authorAvatar ? <img src={n.authorAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-4 text-slate-300 w-full h-full" />}
                  </div>
                  <div><h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-red-600 transition-colors">{n.subject}</h3><div className="flex items-center gap-4 text-slate-400 font-bold text-xs"><span>{n.authorName}</span><span className="opacity-30">•</span><Clock size={14} /><span>{new Date(n.timestamp).toLocaleString()}</span></div></div>
                </div>
                {isAdmin && <div className="flex gap-2"><button onClick={() => startEdit(n)} className="p-2 text-slate-300 hover:text-blue-600"><Edit2 size={18} /></button><button onClick={() => setDeleteNoticeId(n.id)} className="p-2 text-slate-300 hover:text-red-600"><Trash2 size={18} /></button></div>}
              </div>
              <div className="notice-display text-slate-600 leading-relaxed font-medium text-lg prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: n.details }} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
