
import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { getLandingConfig, updateLandingConfig } from '../services/api';
import { Card, Button, Input, Toast, useToast } from '../components/UI';
import { LandingPageConfig } from '../types';
import { Monitor, Save, Globe, LogIn, UserPlus, List, BarChart, MessageSquare, Layout, Megaphone } from 'lucide-react';
import clsx from 'clsx';

export const AdminPageCustomizer = () => {
  const { user } = useAuth();
  const { toastState, showToast, hideToast } = useToast();
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'landing' | 'auth' | 'footer'>('landing');

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
      showToast("Settings synchronized.");
    } catch (e) { showToast("Update failed.", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 animate-pulse">Syncing configuration...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <Toast {...toastState} onClose={hideToast} />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Page Customizer</h1>
          <p className="text-sm text-slate-500 font-medium">Rebrand every visual and text element of the platform.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('landing')} className={clsx("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === 'landing' ? "bg-white shadow-md text-red-600" : "text-slate-500")}><Globe size={16} className="inline mr-2" /> Landing</button>
          <button onClick={() => setActiveTab('auth')} className={clsx("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === 'auth' ? "bg-white shadow-md text-red-600" : "text-slate-500")}><LogIn size={16} className="inline mr-2" /> Auth</button>
          <button onClick={() => setActiveTab('footer')} className={clsx("px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeTab === 'footer' ? "bg-white shadow-md text-red-600" : "text-slate-500")}><Layout size={16} className="inline mr-2" /> Footer</button>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="px-8 rounded-2xl shadow-xl"><Save className="mr-2" size={18} /> Sync Settings</Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'landing' && (
          <>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Monitor className="text-red-600" /> Hero Section</h3>
              <Input label="Main Hero Title" value={config?.heroTitle} onChange={e => setConfig(p => p ? {...p, heroTitle: e.target.value} : null)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Hero Subtitle</label>
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px] shadow-inner" value={config?.heroSubtitle} onChange={e => setConfig(p => p ? {...p, heroSubtitle: e.target.value} : null)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Primary Button Text" value={config?.heroButtonPrimary} onChange={e => setConfig(p => p ? {...p, heroButtonPrimary: e.target.value} : null)} />
                <Input label="Secondary Button Text" value={config?.heroButtonPrimary} onChange={e => setConfig(p => p ? {...p, heroButtonPrimary: e.target.value} : null)} />
              </div>
            </Card>
            <div className="space-y-8">
              <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><BarChart className="text-blue-600" /> Stats Section</h3>
                <Input label="Stats Title" value={config?.statsSectionTitle} onChange={e => setConfig(p => p ? {...p, statsSectionTitle: e.target.value} : null)} />
              </Card>
              <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><MessageSquare className="text-green-600" /> Feedback Section</h3>
                <Input label="Title" value={config?.feedbackSectionTitle} onChange={e => setConfig(p => p ? {...p, feedbackSectionTitle: e.target.value} : null)} />
                <Input label="Subtitle" value={config?.feedbackSectionSubtitle} onChange={e => setConfig(p => p ? {...p, feedbackSectionSubtitle: e.target.value} : null)} />
              </Card>
              <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
                <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Megaphone className="text-red-600" /> Call to Action</h3>
                <Input label="CTA Title" value={config?.ctaTitle} onChange={e => setConfig(p => p ? {...p, ctaTitle: e.target.value} : null)} />
                <Input label="CTA Subtitle" value={config?.ctaSubtitle} onChange={e => setConfig(p => p ? {...p, ctaSubtitle: e.target.value} : null)} />
                <Input label="CTA Button Text" value={config?.ctaButtonText} onChange={e => setConfig(p => p ? {...p, ctaButtonText: e.target.value} : null)} />
              </Card>
            </div>
          </>
        )}

        {activeTab === 'auth' && (
          <>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white ring-4 ring-slate-50">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><LogIn className="text-red-600" /> Login Screen</h3>
              <Input label="Form Title" value={config?.loginTitle} onChange={e => setConfig(p => p ? {...p, loginTitle: e.target.value} : null)} />
              <Input label="Form Subtitle" value={config?.loginSubtitle} onChange={e => setConfig(p => p ? {...p, loginSubtitle: e.target.value} : null)} />
              <Input label="Sidebar Headline" value={config?.loginHeadline} onChange={e => setConfig(p => p ? {...p, loginHeadline: e.target.value} : null)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sidebar Description</label>
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[80px] shadow-inner" value={config?.loginDescription} onChange={e => setConfig(p => p ? {...p, loginDescription: e.target.value} : null)} />
              </div>
              <Input label="Button Label" value={config?.loginButtonLabel} onChange={e => setConfig(p => p ? {...p, loginButtonLabel: e.target.value} : null)} />
            </Card>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white ring-4 ring-slate-50">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><UserPlus className="text-blue-600" /> Registration Screen</h3>
              <Input label="Form Title" value={config?.registerTitle} onChange={e => setConfig(p => p ? {...p, registerTitle: e.target.value} : null)} />
              <Input label="Form Subtitle" value={config?.registerSubtitle} onChange={e => setConfig(p => p ? {...p, registerSubtitle: e.target.value} : null)} />
              <Input label="Sidebar Headline" value={config?.registerHeadline} onChange={e => setConfig(p => p ? {...p, registerHeadline: e.target.value} : null)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sidebar Description</label>
                <textarea className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[80px] shadow-inner" value={config?.registerDescription} onChange={e => setConfig(p => p ? {...p, registerDescription: e.target.value} : null)} />
              </div>
              <Input label="Button Label" value={config?.registerButtonLabel} onChange={e => setConfig(p => p ? {...p, registerButtonLabel: e.target.value} : null)} />
            </Card>
          </>
        )}

        {activeTab === 'footer' && (
          <>
            <Card className="p-8 space-y-6 rounded-[2.5rem] border-0 shadow-xl bg-white">
              <h3 className="font-black text-lg flex items-center gap-3 text-slate-900"><Globe className="text-slate-400" /> Footer Details</h3>
              <Input label="Copyright Notice" value={config?.footerCopyright} onChange={e => setConfig(p => p ? {...p, footerCopyright: e.target.value} : null)} />
              <Input label="Footer Tagline" value={config?.footerTagline} onChange={e => setConfig(p => p ? {...p, footerTagline: e.target.value} : null)} />
            </Card>
          </>
        )}
      </form>
    </div>
  );
};
