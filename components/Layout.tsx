
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UserRole, AppPermissions, RolePermissions, DonationStatus } from '../types';
import { getAppPermissions, getUsers, getDonations, subscribeToAllIncomingMessages, getAllFeedbacks } from '../services/api';
import { 
  LayoutDashboard, 
  UserCircle, 
  Droplet, 
  Search, 
  FileText, 
  LogOut, 
  Menu, 
  History,
  Users,
  Trash2,
  Bell,
  LifeBuoy,
  MessageSquareQuote,
  CheckCircle2,
  Monitor,
  Megaphone,
  Database,
  UsersRound,
  ChevronRight,
  PieChart,
  Settings,
  IdCard,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import clsx from 'clsx';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [perms, setPerms] = useState<AppPermissions | null>(null);
  
  const [counts, setCounts] = useState({
    donations: 0,
    access: 0,
    messages: 0,
    feedbacks: 0
  });

  useEffect(() => {
    getAppPermissions().then(setPerms);
    
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR) {
      const fetchCounts = async () => {
        try {
          const [users, donations, feedbacks] = await Promise.all([getUsers(), getDonations(), getAllFeedbacks()]);
          setCounts(prev => ({
            ...prev,
            access: users.filter(u => u.directoryAccessRequested || u.supportAccessRequested || u.feedbackAccessRequested || u.idCardAccessRequested).length,
            donations: donations.filter(d => d.status === DonationStatus.PENDING).length,
            feedbacks: feedbacks.filter(f => f.status === 'PENDING').length
          }));
        } catch (e) {
          console.error("Failed to fetch notification counts", e);
        }
      };
      fetchCounts();
    }

    if (user) {
      const unsubscribeMessages = subscribeToAllIncomingMessages(user.id, (msgs) => {
        setCounts(prev => ({ ...prev, messages: msgs.length }));
      }, (err) => {
        console.debug("Layout message subscription restricted:", err.message);
      });
      return () => unsubscribeMessages();
    }
  }, [user, location.pathname]); 

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label, badge }: { to: string, icon: any, label: string, badge?: number }) => {
    const isActive = location.pathname.startsWith(to); // Using startsWith to keep active when search param is in URL
    return (
      <Link
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={clsx(
          "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
          isActive 
            ? "bg-red-50 text-red-600 font-bold shadow-sm" 
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={clsx(isActive ? "text-red-600" : "text-slate-400 group-hover:text-slate-600")} />
          <span className="text-[13px] tracking-tight">{label}</span>
        </div>
        {badge !== undefined && badge > 0 ? (
          <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg shadow-sm">
            {badge}
          </span>
        ) : (
          isActive && <ChevronRight size={14} className="text-red-300" />
        )}
      </Link>
    );
  };

  const SidebarSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="space-y-1 mb-6">
      <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );

  const isAdmin = user?.role === UserRole.ADMIN;
  const isEditor = user?.role === UserRole.EDITOR;

  const currentRolePerms: RolePermissions = perms ? (
    isAdmin ? {
      sidebar: { summary: true, dashboard: true, profile: true, history: true, donors: true, users: true, manageDonations: true, logs: true, directoryPermissions: true, supportCenter: true, feedback: true, approveFeedback: true, landingSettings: true, myNotice: true },
      rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canPerformAction: true, canLogDonation: true, canPostNotice: true }
    } : (isEditor ? perms.editor : perms.user)
  ) : {
    sidebar: { dashboard: true, profile: true, history: true, donors: true, feedback: true, myNotice: true },
    rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:transform-none flex flex-col shadow-2xl lg:shadow-none h-screen overflow-hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-20 flex-shrink-0 flex items-center px-6 gap-3 mb-2">
          <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-100 ring-4 ring-red-50">
            <Droplet className="text-white fill-current" size={22} />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tighter block leading-none">BloodLink</span>
            <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Management Hub</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-10">
          <SidebarSection title="User Hub">
            {currentRolePerms.sidebar.dashboard && <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />}
            {currentRolePerms.sidebar.profile && <NavItem to="/profile" icon={UserCircle} label="Account Profile" />}
            {currentRolePerms.sidebar.history && <NavItem to="/my-donations" icon={History} label="My Donate" />}
          </SidebarSection>

          <SidebarSection title="Community">
             <NavItem to="/donors" icon={Search} label="Donor Directory" />
             {currentRolePerms.sidebar.myNotice && <NavItem to="/notices" icon={Megaphone} label="Board Notices" />}
             {currentRolePerms.sidebar.supportCenter && <NavItem to="/support" icon={LifeBuoy} label="Support Center" badge={counts.messages} />}
             <NavItem to="/feedback" icon={MessageSquareQuote} label="Post Feedback" />
          </SidebarSection>

          {(isAdmin || isEditor) && (
            <>
              <SidebarSection title="Content Admin">
                {currentRolePerms.sidebar.landingSettings && <NavItem to="/landing-settings" icon={Monitor} label="Page Customizer" />}
                {currentRolePerms.sidebar.manageDonations && <NavItem to="/manage-donations" icon={Database} label="Donation Records" badge={counts.donations} />}
                {currentRolePerms.sidebar.approveFeedback && <NavItem to="/approve-feedback" icon={CheckCircle2} label="Moderate Feedback" badge={counts.feedbacks} />}
              </SidebarSection>

              <SidebarSection title="People Control">
                {currentRolePerms.sidebar.users && <NavItem to="/users" icon={UsersRound} label="Manage Users" />}
                {isAdmin && <NavItem to="/notifications" icon={Bell} label="Access Requests" badge={counts.access} />}
                {isAdmin && <NavItem to="/admin/verify" icon={ShieldCheck} label="Verify Identity" />}
                {isAdmin && <NavItem to="/verification-history" icon={ClipboardList} label="Verification History" />}
                {isAdmin && <NavItem to="/team-id-cards" icon={IdCard} label="Team ID Cards" />}
              </SidebarSection>

              <SidebarSection title="System Intel">
                {isAdmin && <NavItem to="/deleted-users" icon={Trash2} label="System Archives" />}
                {currentRolePerms.sidebar.logs && <NavItem to="/logs" icon={FileText} label="Activity Logs" />}
              </SidebarSection>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black overflow-hidden border border-red-100">
              {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-slate-900 truncate">{user?.name}</p>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors bg-white rounded-xl border border-slate-200 hover:border-red-100 shadow-sm active:scale-95"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden bg-white border-b border-slate-200 h-16 flex-shrink-0 flex items-center justify-between px-6 shadow-sm z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center">
              <Droplet className="text-white fill-current" size={18} />
            </div>
            <span className="font-black text-slate-900 tracking-tighter text-lg">BloodLink</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
            <Menu size={20} className="text-slate-700" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
