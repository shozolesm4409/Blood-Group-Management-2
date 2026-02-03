
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { addNotice, updateNotice, subscribeToNotices, deleteNotice, getUsers, getAppPermissions } from '../services/api';
import { Card, Button, Input, Badge, Toast, useToast } from '../components/UI';
import { Megaphone, Plus, Trash2, Edit2, Clock, User as UserIcon, Type, Palette, UserPlus, X, Send, Search, Highlighter } from 'lucide-react';
import { Notice, User, UserRole, AppPermissions } from '../types';
import clsx from 'clsx';

export const MyNotice = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<AppPermissions | null>(null);

  // Editor Refs & State
  const editorRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    getAppPermissions().then(setPerms);
    getUsers().then(setAllUsers);
    const unsubscribe = subscribeToNotices((data) => {
      setNotices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;
  const canPost = perms?.[user?.role?.toLowerCase() as 'user' | 'editor']?.rules.canPostNotice || isAdmin;

  // Rich Text Helpers (Browser execCommand for selection-based styling)
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
        await updateNotice(editModeId, {
          subject,
          details,
          mentions: mentionedUsers.map(u => u.id)
        }, user);
        showToast("Notice updated successfully.");
      } else {
        await addNotice({
          subject,
          details,
          authorId: user.id,
          authorName: user.name,
          authorAvatar: user.avatar || '',
          timestamp: new Date().toISOString(),
          mentions: mentionedUsers.map(u => u.id)
        }, user);
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
    // Timeout to ensure DOM is ready for contentEditable
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = notice.details;
      }
    }, 50);
  };

  const resetEditor = () => {
    setEditModeId(null);
    setSubject('');
    if (editorRef.current) editorRef.current.innerHTML = '';
    setMentionedUsers([]);
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm("Move this notice to system archives?")) return;
    try {
      await deleteNotice(id, user);
      showToast("Notice moved to archives.");
    } catch (e) {
      showToast("Action failed.", "error");
    }
  };

  const toggleMention = (u: User) => {
    if (mentionedUsers.find(mu => mu.id === u.id)) {
      setMentionedUsers(mentionedUsers.filter(mu => mu.id !== u.id));
    } else {
      setMentionedUsers([...mentionedUsers, u]);
    }
    setMentionSearch('');
  };

  const filteredForMention = allUsers.filter(u => 
    u.id !== user?.id && 
    (u.name.toLowerCase().includes(mentionSearch.toLowerCase()) || u.bloodGroup.toLowerCase().includes(mentionSearch.toLowerCase())) &&
    !mentionedUsers.find(mu => mu.id === u.id)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <Toast {...toastState} onClose={hideToast} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-100">
            <Megaphone size={28} className="fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Official Board</h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Broadcast & Updates</p>
          </div>
        </div>
        {canPost && (
          <Button 
            onClick={() => { if(showCreate) resetEditor(); setShowCreate(!showCreate); }} 
            variant={showCreate ? "outline" : "primary"}
            className="rounded-2xl px-8"
          >
            {showCreate ? <X className="mr-2" size={18} /> : <Plus className="mr-2" size={18} />}
            {showCreate ? "Close Board" : "New Notice"}
          </Button>
        )}
      </div>

      {showCreate && (
        <Card className="p-8 border-0 shadow-2xl bg-white rounded-[2.5rem] animate-in slide-in-from-top-10 duration-500 overflow-hidden ring-4 ring-red-50">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
             <div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                 {editModeId ? 'Refine Announcement' : 'Compose Notice'}
               </h2>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Broadcast to the community</p>
             </div>
             {editModeId && <Badge color="yellow" className="py-1.5 px-4 rounded-xl">Editing Active</Badge>}
          </div>
          
          <form onSubmit={handlePostNotice} className="space-y-8">
            <div className="space-y-6">
              <Input 
                label="Announcement Subject" 
                placeholder="Ex: Urgent Blood Request / Maintenance Update..." 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
                className="text-lg font-bold py-4 px-6 rounded-2xl"
              />
              
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                  Details (Select text to style)
                </label>
                <div className="bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner">
                   <div className="flex flex-wrap items-center gap-3 p-4 bg-white border-b border-slate-100">
                      {/* Font Weight */}
                      <button type="button" onClick={() => applyStyle('bold')} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Bold selection"><span className="font-black text-lg">B</span></button>
                      <button type="button" onClick={() => applyStyle('italic')} className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Italicize selection"><span className="italic font-serif text-lg">I</span></button>
                      
                      <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
                      
                      {/* Color Palette */}
                      <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
                        <button type="button" onClick={() => applyStyle('foreColor', '#ef4444')} className="w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-sm hover:scale-110 transition-transform" title="Text Red" />
                        <button type="button" onClick={() => applyStyle('foreColor', '#3b82f6')} className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white shadow-sm hover:scale-110 transition-transform" title="Text Blue" />
                        <button type="button" onClick={() => applyStyle('foreColor', '#000000')} className="w-8 h-8 rounded-full bg-black border-2 border-white shadow-sm hover:scale-110 transition-transform" title="Text Black" />
                      </div>
                      
                      <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>
                      
                      {/* Highlight Tool */}
                      <button 
                        type="button" 
                        onClick={() => applyStyle('hiliteColor', '#fef08a')} 
                        className="p-2.5 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest"
                      >
                        <Highlighter size={16} /> Highlight
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={() => applyStyle('removeFormat')} 
                        className="p-2.5 hover:bg-red-50 text-red-400 rounded-xl ml-auto transition-colors"
                        title="Clear Styles"
                      >
                        <X size={18} />
                      </button>
                   </div>
                   
                   <div 
                     ref={editorRef}
                     contentEditable
                     placeholder="Write announcement details here..."
                     className="w-full bg-slate-50 p-8 min-h-[250px] text-base font-medium focus:outline-none custom-scrollbar overflow-y-auto leading-relaxed selection:bg-red-100"
                   />
                </div>
              </div>

              {/* Mention System */}
              <div className="space-y-4">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Hero Mentions (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {mentionedUsers.map(u => (
                    <Badge key={u.id} color="blue" className="py-2 pl-3 pr-2 rounded-xl flex items-center gap-2 normal-case font-bold bg-blue-50 text-blue-600">
                      {u.name}
                      <button type="button" onClick={() => toggleMention(u)} className="p-1 hover:bg-blue-200 rounded-lg"><X size={12} /></button>
                    </Badge>
                  ))}
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by name to tag..." 
                    value={mentionSearch}
                    onChange={e => setMentionSearch(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-bold focus:ring-4 focus:ring-red-500/10 focus:border-red-200 outline-none transition-all"
                  />
                  {mentionSearch && (
                    <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in zoom-in-95 duration-200">
                      {filteredForMention.map(u => (
                        <div key={u.id} onClick={() => toggleMention(u)} className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-4 transition-colors border-b border-slate-50 last:border-0">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                             {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2.5 text-slate-300" />}
                           </div>
                           <div className="flex-1">
                             <p className="text-sm font-black text-slate-800">{u.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{u.location}</p>
                           </div>
                           <Badge color="red">{u.bloodGroup}</Badge>
                        </div>
                      ))}
                      {filteredForMention.length === 0 && <p className="p-6 text-center text-xs text-slate-400 italic">No matches found.</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" isLoading={isPosting} className="flex-1 py-5 rounded-[1.5rem] text-lg">
                <Send className="mr-3" size={22} /> {editModeId ? 'Synchronize Update' : 'Broadcast Now'}
              </Button>
              {editModeId && (
                <Button type="button" variant="outline" onClick={() => { resetEditor(); setShowCreate(false); }} className="py-5 px-10 rounded-[1.5rem] text-slate-400">
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-30">
            <Megaphone className="animate-bounce text-red-600" size={64} />
            <p className="font-black uppercase tracking-[0.3em] text-slate-400 text-sm">Syncing Board...</p>
          </div>
        ) : notices.map(n => (
          <Card key={n.id} className="group overflow-hidden border-0 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] bg-white rounded-[2.5rem] hover:shadow-2xl transition-all duration-500 border-l-[12px] border-l-red-600">
            <div className="p-8 lg:p-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-xl flex-shrink-0">
                      {n.authorAvatar ? <img src={n.authorAvatar} className="w-full h-full object-cover" alt={n.authorName} /> : <UserIcon className="p-4 text-slate-300 w-full h-full" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-red-600 transition-colors">{n.subject}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Posted by</span>
                        <span className="text-xs font-bold text-slate-900">{n.authorName}</span>
                      </div>
                      <span className="text-[10px] text-slate-200 font-black">•</span>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-xs font-bold">{new Date(n.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(n)} className="p-3 text-slate-300 hover:text-blue-600 transition-all bg-slate-50 hover:bg-blue-50 rounded-2xl hover:scale-110 shadow-sm" title="Edit Content">
                      <Edit2 size={20} />
                    </button>
                    <button onClick={() => handleDelete(n.id)} className="p-3 text-slate-300 hover:text-red-600 transition-all bg-slate-50 hover:bg-red-50 rounded-2xl hover:scale-110 shadow-sm" title="Move to Archives">
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-8">
                 <div 
                   className="notice-display text-slate-600 leading-relaxed font-medium text-lg prose prose-slate max-w-none prose-headings:font-black prose-strong:text-slate-900" 
                   dangerouslySetInnerHTML={{ __html: n.details }} 
                 />
                 
                 {n.mentions && n.mentions.length > 0 && (
                   <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-3 items-center">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <UserPlus size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mr-2">Tagged Heroes</span>
                      {n.mentions.map(mid => {
                        const u = allUsers.find(usr => usr.id === mid);
                        return u ? (
                          <div key={mid} className="flex items-center gap-2 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-slate-100 transition-colors group/hero">
                            <div className="w-5 h-5 rounded-lg bg-white overflow-hidden border border-slate-200">
                               {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={12} className="mx-auto mt-0.5 text-slate-300" />}
                            </div>
                            <span className="text-[11px] font-black text-slate-600 group-hover/hero:text-blue-600">@{u.name}</span>
                          </div>
                        ) : null;
                      })}
                   </div>
                 )}
              </div>
            </div>
          </Card>
        ))}
        
        {notices.length === 0 && !loading && (
          <div className="py-32 text-center space-y-6 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-inner">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 shadow-inner">
                <Megaphone size={48} />
             </div>
             <div>
               <p className="text-xl font-black text-slate-400 uppercase tracking-[0.2em]">Silent Airwaves</p>
               <p className="text-slate-300 font-medium italic mt-2">No official announcements currently posted.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
