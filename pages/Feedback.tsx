
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitFeedback, getAllFeedbacks, updateFeedbackStatus, toggleFeedbackVisibility } from '../services/api';
import { Card, Button, Input, Badge } from '../components/UI';
import { MessageSquareQuote, Check, X, Clock, User as UserIcon, Eye, EyeOff, Trash2 } from 'lucide-react';
import { DonationFeedback, FeedbackStatus } from '../types';
import clsx from 'clsx';

export const DonationFeedbackPage = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setLoading(true);
    try {
      await submitFeedback(message, user);
      setSuccess(true);
      setMessage('');
    } catch (e) {
      alert("Feedback submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-50 rounded-2xl">
          <MessageSquareQuote className="text-red-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">রক্তদানের অভিজ্ঞতা শেয়ার করুন</h1>
          <p className="text-sm text-slate-500 font-medium">আপনার একটি গল্প অন্য কাউকে রক্তদানে উদ্বুদ্ধ করতে পারে।</p>
        </div>
      </div>

      <Card className="p-8 border-0 shadow-lg">
        {success ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900">অনুপ্রেরণা শেয়ার করার জন্য ধন্যবাদ!</h3>
            <p className="text-slate-500 text-sm">আপনার ফিডব্যাকটি এ্যাডমিন এপ্রুভ করার পর ল্যান্ডিং পেজে শো করবে।</p>
            <Button onClick={() => setSuccess(false)} variant="outline">আবার লিখুন</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">আপনার অভিজ্ঞতা</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="কোথায় রক্ত দিয়েছেন? কেমন লেগেছে? নতুন ডোনারদের জন্য আপনার বার্তা কি?"
                required
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none"
              />
            </div>
            <Button type="submit" isLoading={loading} className="w-full py-4 rounded-2xl">ফিডব্যাক সাবমিট করুন</Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export const FeedbackApprovalPage = () => {
  const [feedbacks, setFeedbacks] = useState<DonationFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  const fetchFeedbacks = async () => {
    try {
      const data = await getAllFeedbacks();
      setFeedbacks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleStatusUpdate = async (id: string, status: FeedbackStatus) => {
    try {
      await updateFeedbackStatus(id, status, true);
      fetchFeedbacks();
    } catch (e) {
      alert("Status update failed.");
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      await toggleFeedbackVisibility(id, !currentVisibility);
      fetchFeedbacks();
    } catch (e) {
      alert("Visibility toggle failed.");
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => filter === 'ALL' || f.status === filter);

  if (loading) return <div className="p-10 text-center font-black text-slate-300 uppercase tracking-widest">Loading queue...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ফিডব্যাক ম্যানেজমেন্ট</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">ডোনারদের সাবমিট করা অভিজ্ঞতার তালিকা</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="ALL">সব ফিডব্যাক</option>
            <option value={FeedbackStatus.PENDING}>পেন্ডিং</option>
            <option value={FeedbackStatus.APPROVED}>এপ্রুভড</option>
            <option value={FeedbackStatus.REJECTED}>রিজেক্টেড</option>
          </select>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">ডোনার</th>
                <th className="px-6 py-4">অভিজ্ঞতা / মেসেজ</th>
                <th className="px-6 py-4">তারিখ</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4">ল্যান্ডিং পেজ</th>
                <th className="px-6 py-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredFeedbacks.map(f => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                        {f.userAvatar ? <img src={f.userAvatar} className="w-full h-full object-cover" /> : <UserIcon className="p-2.5 text-slate-300" />}
                      </div>
                      <span className="font-bold text-slate-900">{f.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-slate-600 line-clamp-2 italic">"{f.message}"</p>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {new Date(f.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={f.status === FeedbackStatus.APPROVED ? 'green' : (f.status === FeedbackStatus.REJECTED ? 'red' : 'yellow')}>
                      {f.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleToggleVisibility(f.id, f.isVisible)}
                      disabled={f.status !== FeedbackStatus.APPROVED}
                      className={clsx(
                        "p-2 rounded-xl transition-all",
                        f.isVisible ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400",
                        f.status !== FeedbackStatus.APPROVED && "opacity-30 cursor-not-allowed"
                      )}
                      title={f.isVisible ? "ল্যান্ডিং পেজ থেকে হাইড করুন" : "ল্যান্ডিং পেজে শো করুন"}
                    >
                      {f.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {f.status === FeedbackStatus.PENDING && (
                        <>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.APPROVED)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all" title="Approve">
                            <Check size={20} />
                          </button>
                          <button onClick={() => handleStatusUpdate(f.id, FeedbackStatus.REJECTED)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Reject">
                            <X size={20} />
                          </button>
                        </>
                      )}
                      {f.status !== FeedbackStatus.PENDING && (
                         <Badge color="gray" className="cursor-default">Finalized</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredFeedbacks.length === 0 && (
          <div className="py-20 text-center text-slate-400 font-bold italic">
            কোন ফিডব্যাক পাওয়া যায়নি।
          </div>
        )}
      </Card>
    </div>
  );
};
