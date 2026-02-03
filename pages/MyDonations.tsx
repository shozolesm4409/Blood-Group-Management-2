
import React, { useEffect, useState } from 'react';
import { getUserDonations, addDonation, deleteDonationRecord } from '../services/api';
import { useAuth } from '../AuthContext';
import { DonationRecord, DonationStatus } from '../types';
import { Card, Button, Input, Badge, ConfirmModal } from '../components/UI';
import { Plus, History as HistoryIcon, Clock, Check, Calendar, Trash2, Users } from 'lucide-react';
import clsx from 'clsx';

export const MyDonations = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (user) {
      try {
        const data = await getUserDonations(user.id);
        setDonations(data);
      } catch (err) {}
    }
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await addDonation({
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar || '',
        userBloodGroup: user.bloodGroup,
        donationDate: new Date().toISOString(),
        location: formData.get('location') as string,
        units: 450, 
        notes: formData.get('notes') as string
      }, user);
      alert("Donation request submitted successfully. Awaiting verification.");
      setShowForm(false);
      fetchHistory();
    } catch (err) {
      alert("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleteId) return;
    try {
      await deleteDonationRecord(deleteId, user);
      alert("History record deleted successfully.");
      fetchHistory();
      setDeleteId(null);
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Donation History</h1>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" /> Request Donation</Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-white border-red-100 shadow-lg border-t-4 border-t-red-500 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-900 mb-4">Submit New Request</h3>
          <form onSubmit={handleRequest} className="space-y-4">
            <Input label="Location" name="location" required placeholder="Hospital or Blood Bank" />
            <Input label="Notes" name="notes" placeholder="Optional notes..." />
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit" isLoading={loading}>Submit</Button></div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donations.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-l overflow-hidden bg-slate-100 border border-slate-200">
                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <Users className="p-1.5 text-slate-300" size={14} />}
                      </div>
                      <span className="font-bold">{user?.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium">{new Date(d.donationDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{d.location}</td>
                  <td className="px-3 py-2"><Badge color={d.status === 'COMPLETED' ? 'green' : 'yellow'}>{d.status}</Badge></td>
                  <td className="px-3 py-2 text-right"><button onClick={() => setDeleteId(d.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={18} /></button></td>
                </tr>
              ))}
              {donations.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={confirmDelete} title="Delete History?" message="This action will remove the record from your history." />
    </div>
  );
};
