
export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  USER = 'USER'
}

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-'
}

export enum DonationStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export enum FeedbackStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface NavLink {
  label: string;
  path: string;
}

export interface Notice {
  id: string;
  subject: string;
  details: string; // HTML-ish string for styling
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: string;
  mentions?: string[]; // Array of mentioned user IDs
}

export interface LandingPageConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonPrimary: string;
  heroButtonSecondary: string;
  statsSectionTitle: string;
  feedbackSectionTitle: string;
  feedbackSectionSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButtonText: string;
  
  // Navigation
  navbarLinks?: NavLink[];
  footerLinks?: NavLink[];
  footerCopyright?: string;
  footerTagline?: string;
  
  // Auth Styles
  loginStyles?: { padding: number; margin: number };
  signupStyles?: { padding: number; margin: number };

  // Content Customization
  loginHeadline?: string;       
  loginDescription?: string;    
  loginTitle?: string;          
  loginSubtitle?: string;       
  loginButtonLabel?: string;    

  registerHeadline?: string;    
  registerDescription?: string; 
  registerTitle?: string;       
  registerSubtitle?: string;    
  registerButtonLabel?: string; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bloodGroup: BloodGroup;
  location: string;
  phone: string;
  lastDonationDate?: string;
  avatar?: string;
  password?: string;
  hasDirectoryAccess?: boolean;
  directoryAccessRequested?: boolean;
  hasSupportAccess?: boolean;
  supportAccessRequested?: boolean;
  hasFeedbackAccess?: boolean;
  feedbackAccessRequested?: boolean;
}

export interface DonationRecord {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userBloodGroup: BloodGroup;
  donationDate: string;
  location: string;
  units: number;
  status: DonationStatus;
  notes?: string;
}

export interface DonationFeedback {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  status: FeedbackStatus;
  isVisible: boolean;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId?: string;
  roomId: string;
  text: string;
  timestamp: string;
  isAdminReply?: boolean;
  read?: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userAvatar?: string; 
  timestamp: string;
  details: string;
}

export interface RevokedPermission {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'DIRECTORY' | 'SUPPORT' | 'FEEDBACK';
  revokedAt: string;
  revokedBy: string;
}

export interface RolePermissions {
  sidebar: {
    dashboard: boolean;
    profile: boolean;
    history: boolean;
    donors: boolean;
    users?: boolean;
    manageDonations?: boolean;
    logs?: boolean;
    directoryPermissions?: boolean;
    supportCenter?: boolean;
    feedback?: boolean;
    approveFeedback?: boolean;
    landingSettings?: boolean;
    myNotice?: boolean;
  };
  rules: {
    canEditProfile: boolean;
    canViewDonorDirectory: boolean;
    canRequestDonation: boolean;
    canPerformAction?: boolean;
    canLogDonation?: boolean;
    canLogDonationForOthers?: boolean;
    canUseMessenger?: boolean;
    canUseSystemSupport?: boolean;
    canPostNotice?: boolean;
  };
}

export interface AppPermissions {
  user: RolePermissions;
  editor: RolePermissions;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}
