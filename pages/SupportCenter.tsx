
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { 
  requestSupportAccess, 
  sendMessage, 
  subscribeToRoomMessages, 
  subscribeToAllSupportRooms, 
  subscribeToAllIncomingMessages,
  markMessagesAsRead,
  getUsers,
  getAppPermissions
} from '../services/api';
import { Card, Button, Input, Badge, Toast, useToast } from '../components/UI';
import { LifeBuoy, Lock, BookOpen, MessageSquare, PhoneCall, HelpCircle, CheckCircle, Send, ArrowLeft, Search, User as UserIcon, AlertCircle, ArrowRight, ShieldAlert, Paperclip, Smile, MoreHorizontal } from 'lucide-react';
import { ChatMessage, UserRole, User, AppPermissions } from '../types';
import clsx from 'clsx';

export const SupportCenter = () => {
  const { user, updateUser } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  
  const [activeView, setActiveView] = useState<'hub' | 'system-chat' | 'user-list' | 'private-chat'>('hub');
  
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAppPermissions().then(setPerms);
    if (user) {
      getUsers().then(users => {
        setAllUsers(users);
      }).catch(() => {});
      
      const unsubscribeUnread = subscribeToAllIncomingMessages(user.id, (msgs) => {
        const counts: Record<string, number> = {};
        msgs.forEach(m => {
          const key = m.roomId.startsWith('SUPPORT_') ? 'SYSTEM' : m.senderId;
          counts[key] = (counts[key] || 0) + 1;
        });
        setUnreadCounts(counts);
      }, (err) => {
        console.debug("Unread subscription restricted");
      });
      
      return () => unsubscribeUnread();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setPermissionError(null);
    let unsubscribe: () => void = () => {};

    const handleError = (err: any) => {
      if (err.code === 'permission-denied') {
        setPermissionError("Access denied by security policy. Verification required.");
      }
    };

    if (activeView === 'system-chat') {
      const isStaff = user.role === UserRole.ADMIN || user.role === UserRole.EDITOR;
      if (isStaff) {
        unsubscribe = subscribeToAllSupportRooms((msgs) => {
          setMessages(msgs.filter(m => m.roomId.startsWith('SUPPORT_')));
        }, handleError);
      } else {
        unsubscribe = subscribeToRoomMessages(`SUPPORT_${user.id}`, setMessages, handleError);
      }
    } else if (activeView === 'private-chat' && selectedRecipient) {
      const roomId = [user.id, selectedRecipient.id].sort().join('_');
      markMessagesAsRead(roomId, user.id).catch(() => {});
      unsubscribe = subscribeToRoomMessages(roomId, (msgs) => {
        setMessages(msgs);
      }, handleError);
    }

    return () => unsubscribe();
  }, [activeView, selectedRecipient, user]);

  useEffect(() => {
    if (activeView === 'system-chat' || activeView === 'private-chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeView]);

  const isStaff = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;
  const hasSupportAccess = user?.hasSupportAccess || isStaff;

  const handleRequest = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await requestSupportAccess(user);
      updateUser({ ...user, supportAccessRequested: true });
      showToast("Access request sent to system administrator.");
    } catch (e) {
      showToast("Request failed.", "error");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    let roomId = '';
    let receiverId = '';

    if (activeView === 'system-chat') {
      roomId = user.role === UserRole.USER ? `SUPPORT_${user.id}` : 'SYSTEM_BROADCAST';
      receiverId = 'SYSTEM';
    } else if (activeView === 'private-chat' && selectedRecipient) {
      roomId = [user.id, selectedRecipient.id].sort().join('_');
      receiverId = selectedRecipient.id;
    }

    const msg = {
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar || '',
      receiverId,
      roomId,
      text: newMessage,
      isAdminReply: isStaff
    };

    try {
      await sendMessage(msg);
      setNewMessage('');
    } catch (e: any) {
      showToast("Message could not be sent.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const renderChat = (title: string, icon: any, targetUser?: User) => (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-4">
            <button onClick={() => { setActiveView('hub'); setSelectedRecipient(null); setPermissionError(null); }} className="p-2 hover:bg-slate-50 rounded-2xl transition-colors">
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                {targetUser?.avatar ? <img src={targetUser.avatar} className="w-full h-full object-cover" /> : React.createElement(icon, { size: 24, className: "text-blue-600" })}
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">{title}</h1>
                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1">Live Connection</p>
              </div>
            </div>
         </div>
         <button className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-300">
            <MoreHorizontal size={20} />
         </button>
      </div>

      <Card className="flex-1 flex flex-col border-0 shadow-2xl overflow-hidden rounded-[2.5rem] bg-white relative">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
         
         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
            {permissionError && (
              <div className="p-5 bg-red-50 text-red-700 text-xs font-bold rounded-2xl border border-red-100 flex items-center gap-3 shadow-sm">
                <AlertCircle size={20} className="flex-shrink-0" />
                {permissionError}
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={clsx("flex flex-col group", msg.senderId === user?.id ? "items-end" : "items-start")}>
                <div className={clsx(
                  "max-w-[75%] p-4 rounded-3xl text-sm font-medium shadow-sm transition-all duration-300",
                  msg.senderId === user?.id 
                    ? "bg-blue-600 text-white rounded-br-none hover:bg-blue-700" 
                    : (msg.isAdminReply ? "bg-red-50 text-red-900 rounded-bl-none border border-red-100" : "bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200 hover:bg-slate-200")
                )}>
                  {msg.senderId !== user?.id && (
                    <p className="text-[9px] font-black uppercase opacity-60 mb-1.5 flex items-center gap-1.5">
                      {msg.senderName} {msg.isAdminReply && <Badge color="red" className="text-[7px] py-0 px-1">STAFF</Badge>}
                    </p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 px-2">
                   <span className="text-[9px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                   {msg.senderId === user?.id && <CheckCircle size={10} className="text-blue-400" />}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
         </div>
         
         <div className="p-6 bg-white border-t border-slate-100 relative z-20">
           <form onSubmit={handleSendMessage} className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 shadow-inner group-focus-within:border-blue-400 transition-all">
              <button type="button" className="p-3 text-slate-400 hover:text-blue-600 transition-colors"><Paperclip size={20}/></button>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 bg-transparent border-0 px-2 py-3 text-sm font-bold text-slate-700 focus:ring-0 transition-all outline-none placeholder:text-slate-300"
                disabled={isSending || !!permissionError}
              />
              <button type="button" className="p-3 text-slate-400 hover:text-orange-500 transition-colors"><Smile size={20}/></button>
              <button 
                type="submit" 
                disabled={isSending || !newMessage.trim() || !!permissionError}
                className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-blue-200"
              >
                <Send size={20} className={clsx(isSending && "animate-pulse")} />
              </button>
           </form>
         </div>
      </Card>
    </div>
  );

  // Hub View
  if (!hasSupportAccess) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 animate-in fade-in duration-700">
        <Toast {...toastState} onClose={hideToast} />
        <Card className="p-16 text-center space-y-10 border-0 shadow-2xl bg-white rounded-[4rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -mr-20 -mt-20"></div>
          <div className="w-28 h-28 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner ring-4 ring-blue-50/50">
            <Lock size={56} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Support Locked</h2>
            <p className="text-slate-500 font-medium leading-relaxed text-lg max-w-sm mx-auto">
              সাপোর্ট সেন্টার ব্যবহার করার জন্য আপনার এক্সেস প্রয়োজন। ভেরিফিকেশন রিকোয়েস্ট পাঠান।
            </p>
          </div>
          
          {user?.supportAccessRequested ? (
            <div className="p-6 bg-yellow-50 text-yellow-700 rounded-3xl border border-yellow-100 flex items-center justify-center gap-3 animate-pulse shadow-sm">
              <ShieldAlert size={24} />
              <span className="font-black text-sm uppercase tracking-widest">Awaiting Staff Approval</span>
            </div>
          ) : (
            <Button 
              onClick={handleRequest} 
              isLoading={isRequesting}
              className="w-full py-6 rounded-3xl text-xl bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200"
            >
              Request Support Access
            </Button>
          )}
        </Card>
      </div>
    );
  }

  if (activeView === 'system-chat') return renderChat("System Support", MessageSquare);
  if (activeView === 'private-chat' && selectedRecipient) return renderChat(selectedRecipient.name, UserIcon, selectedRecipient);

  if (activeView === 'user-list') {
    const filteredUsers = allUsers.filter(u => 
      u.id !== user?.id && 
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="h-[calc(100vh-140px)] flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <button onClick={() => setActiveView('hub')} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                <ArrowLeft size={24} className="text-slate-400" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter">User Messenger</h1>
                <p className="text-slate-500 font-medium text-sm">Direct private messaging with the community.</p>
              </div>
           </div>
           <div className="relative w-full md:w-80 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
             <input 
               type="text" 
               placeholder="Find a lifesaver..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-bold shadow-xl shadow-slate-200/50 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-600 transition-all"
             />
           </div>
        </div>

        <Card className="flex-1 flex flex-col border-0 shadow-2xl overflow-hidden rounded-[3rem] bg-white p-6">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {filteredUsers.length > 0 ? filteredUsers.map(u => (
              <div key={u.id} onClick={() => { setSelectedRecipient(u); setActiveView('private-chat'); }} className="flex items-center justify-between p-5 bg-slate-50 hover:bg-blue-50 rounded-[2rem] cursor-pointer transition-all border border-transparent hover:border-blue-100 hover:shadow-xl group">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center border-2 border-white shadow-lg overflow-hidden group-hover:rotate-3 transition-transform">
                      {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-200" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-lg flex items-center justify-center text-[8px] font-black border-2 border-white">{u.bloodGroup}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{u.name}</p>
                      {unreadCounts[u.id] > 0 && <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full animate-bounce shadow-lg ring-2 ring-white">{unreadCounts[u.id]}</span>}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{u.location || 'Donor Hub'}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-600 group-hover:bg-white transition-all">
                  <ArrowRight size={24} />
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 italic">
                 <Search size={48} className="mb-4 text-slate-200" />
                 <p className="font-bold text-slate-400">No members found matching your search.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const unreadTotal = Object.values(unreadCounts).reduce((a: number, b: number) => a + (typeof b === 'number' ? b : 0), 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-6xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex items-center gap-6 border-b border-slate-100 pb-8">
        <div className="p-5 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-100"><LifeBuoy size={32} /></div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Support Hub</h1>
          <p className="text-base text-slate-500 font-medium">Safe communication gateway for the BloodLink community.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div onClick={() => setActiveView('user-list')} className="cursor-pointer group">
          <SupportLinkCard icon={BookOpen} title="Donor Messenger" description="Secure end-to-end chat with registered heroes." color="blue" badge={unreadTotal} />
        </div>
        <div onClick={() => setActiveView('system-chat')} className="cursor-pointer group">
          <SupportLinkCard icon={MessageSquare} title="Staff Support" description="Direct line to system administrators for assistance." color="green" badge={unreadCounts['SYSTEM'] || 0} />
        </div>
        <SupportLinkCard icon={PhoneCall} title="Emergency List" description="Access critical emergency contacts for rapid response." color="red" />
      </div>

      <Card className="p-10 border-0 shadow-2xl bg-white rounded-[3rem] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
        <h3 className="font-black text-2xl mb-10 flex items-center gap-4 text-slate-900 relative z-10"><HelpCircle className="text-blue-600" size={32} /> Common Questions</h3>
        <div className="space-y-8 relative z-10">
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-colors">
            <p className="font-black text-slate-800 mb-2 flex items-center gap-3"><CheckCircle size={20} className="text-green-500" /> How do I verify my donation?</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed pl-8">Once you submit a donation record, our staff team will review and approve it within 24-48 hours. Your recovery timeline starts from that date.</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-colors">
            <p className="font-black text-slate-800 mb-2 flex items-center gap-3"><CheckCircle size={20} className="text-green-500" /> Is my phone number private?</p>
            <p className="text-sm text-slate-500 font-medium leading-relaxed pl-8">Your contact information is only visible to verified users who have been granted explicit directory access by the administrator.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

const SupportLinkCard = ({ icon: Icon, title, description, color, badge }: any) => {
  const colors: any = { 
    blue: "bg-blue-50 text-blue-600 ring-blue-100", 
    green: "bg-green-50 text-green-600 ring-green-100", 
    red: "bg-red-50 text-red-600 ring-red-100" 
  };
  return (
    <Card className="p-8 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] transition-all border-0 shadow-lg group relative overflow-hidden h-full rounded-[2.5rem] bg-white hover:-translate-y-2">
      {badge > 0 && <span className="absolute top-6 right-6 bg-red-600 text-white text-[11px] font-black px-3 py-1.5 rounded-2xl shadow-2xl border-4 border-white animate-bounce">{badge}</span>}
      <div className={clsx("w-16 h-16 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner ring-4", colors[color])}>
        <Icon size={32} />
      </div>
      <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{title}</h4>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>
    </Card>
  );
};
