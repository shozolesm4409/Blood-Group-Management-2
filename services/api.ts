
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updatePassword as firebaseUpdatePassword,
  sendPasswordResetEmail,
  signOut 
} from "@firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  addDoc, 
  orderBy, 
  limit,
  onSnapshot,
  writeBatch
} from "@firebase/firestore";
import { auth, db } from "./firebase";
export { db };
import { User, DonationRecord, AuditLog, UserRole, DonationStatus, BloodGroup, AppPermissions, ChatMessage, DonationFeedback, FeedbackStatus, RevokedPermission, LandingPageConfig, Notice } from '../types';

const COLLECTIONS = {
  USERS: 'users',
  DONATIONS: 'donations',
  LOGS: 'logs',
  DELETED_USERS: 'deleted_users',
  DELETED_DONATIONS: 'deleted_donations',
  DELETED_LOGS: 'deleted_logs',
  DELETED_FEEDBACKS: 'deleted_feedbacks',
  DELETED_NOTICES: 'deleted_notices',
  SETTINGS: 'settings',
  MESSAGES: 'messages',
  REVOKED_PERMISSIONS: 'revoked_permissions',
  FEEDBACKS: 'feedbacks',
  NOTICES: 'notices',
  VERIFICATION_LOGS: 'verification_logs'
};

const CACHE_KEYS = {
  APPROVED_FEEDBACKS: 'bloodlink_cached_feedbacks'
};

export const ADMIN_EMAIL = 'shozolesm4409@gmail.com'.trim().toLowerCase();

const createLog = async (action: string, userId: string, userName: string, details: string, userAvatar?: string) => {
  try {
    await addDoc(collection(db, COLLECTIONS.LOGS), {
      action,
      userId,
      userName,
      userAvatar: userAvatar || '',
      details,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.debug("Audit logging failed.");
  }
};

export const initiatePasswordResetLink = async (email: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', normalizedEmail));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("এই ইমেইলটি আমাদের সিস্টেমে খুঁজে পাওয়া যায়নি।");
  }

  try {
    await sendPasswordResetEmail(auth, normalizedEmail);
  } catch (error: any) {
    console.error("Firebase Auth Email Error:", error);
    throw new Error("ইমেইল পাঠানো সম্ভব হয়নি। দয়া করে কিছুক্ষণ পর চেষ্টা করুন।");
  }
};

export const logVerificationCheck = async (memberId: string, memberName: string, bloodGroup: string) => {
  try {
    await addDoc(collection(db, COLLECTIONS.VERIFICATION_LOGS), {
      memberId,
      memberName,
      bloodGroup,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.debug("Verification logging failed.");
  }
};

export const getVerificationLogs = async () => {
  const q = query(collection(db, COLLECTIONS.VERIFICATION_LOGS), orderBy('timestamp', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getNotices = async (): Promise<Notice[]> => {
  const q = query(collection(db, COLLECTIONS.NOTICES), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
};

export const addNotice = async (notice: Omit<Notice, 'id'>, admin: User) => {
  await addDoc(collection(db, COLLECTIONS.NOTICES), notice);
  await createLog('NOTICE_ADD', admin.id, admin.name, `Posted notice: ${notice.subject}`, admin.avatar);
};

export const updateNotice = async (id: string, updates: Partial<Notice>, admin: User) => {
  await updateDoc(doc(db, COLLECTIONS.NOTICES, id), updates);
  await createLog('NOTICE_UPDATE', admin.id, admin.name, `Updated notice: ${id}`, admin.avatar);
};

export const deleteNotice = async (id: string, admin: User) => {
  const ref = doc(db, COLLECTIONS.NOTICES, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const batch = writeBatch(db);
    const archiveRef = doc(db, COLLECTIONS.DELETED_NOTICES, id);
    batch.set(archiveRef, {
      ...snap.data(),
      deletedAt: new Date().toISOString(),
      deletedBy: admin.name
    });
    batch.delete(ref);
    await batch.commit();
    await createLog('NOTICE_DELETE', admin.id, admin.name, `Archived notice ${id}`, admin.avatar);
  }
};

export const getDeletedNotices = async (): Promise<any[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.DELETED_NOTICES));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const restoreDeletedNotice = async (id: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_NOTICES, id);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.NOTICES, id), data);
    batch.delete(deletedRef);
    await batch.commit();
    await createLog('NOTICE_RESTORE', admin.id, admin.name, `Restored notice ${id}`, admin.avatar);
  }
};

export const subscribeToNotices = (callback: (notices: Notice[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.NOTICES), orderBy('timestamp', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice)));
  }, onError);
};

export const getCachedFeedbacks = (): DonationFeedback[] => {
  const cached = localStorage.getItem(CACHE_KEYS.APPROVED_FEEDBACKS);
  return cached ? JSON.parse(cached) : [];
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } as User : null;
  } catch (e) {
    return null;
  }
};

export const changePassword = async (userId: string, userName: string, current: string, newPass: string) => {
  if (auth.currentUser) {
    await firebaseUpdatePassword(auth.currentUser, newPass);
    const u = await getUserProfile(userId);
    await createLog('PASSWORD_CHANGE', userId, userName, 'User changed their password', u?.avatar);
  } else {
    throw new Error("User must be logged in to change password");
  }
};

export const getLogs = async (): Promise<AuditLog[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.LOGS), orderBy('timestamp', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
  } catch (e: any) {
    return [];
  }
};

export const updateDonationStatus = async (id: string, status: DonationStatus, admin: User): Promise<void> => {
  const donationRef = doc(db, COLLECTIONS.DONATIONS, id);
  const donationSnap = await getDoc(donationRef);
  
  if (donationSnap.exists()) {
    const donationData = donationSnap.data() as DonationRecord;
    await updateDoc(donationRef, { status });
    
    if (status === DonationStatus.COMPLETED) {
      await updateDoc(doc(db, COLLECTIONS.USERS, donationData.userId), { 
        lastDonationDate: donationData.donationDate 
      });
    }
    
    await createLog('DONATION_STATUS_UPDATE', admin.id, admin.name, `Updated donation ${id} to ${status}`, admin.avatar);
  }
};

export const submitFeedback = async (message: string, user: User) => {
  await addDoc(collection(db, COLLECTIONS.FEEDBACKS), {
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar || '',
    message,
    status: FeedbackStatus.PENDING,
    isVisible: false,
    timestamp: new Date().toISOString()
  });
};

export const deleteFeedback = async (feedbackId: string, admin: User) => {
  const ref = doc(db, COLLECTIONS.FEEDBACKS, feedbackId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const batch = writeBatch(db);
    const archiveRef = doc(db, COLLECTIONS.DELETED_FEEDBACKS, feedbackId);
    batch.set(archiveRef, { 
      ...snap.data(), 
      deletedAt: new Date().toISOString(), 
      deletedBy: admin.name 
    });
    batch.delete(ref);
    await batch.commit();
    await createLog('FEEDBACK_DELETE', admin.id, admin.name, `Archived feedback ${feedbackId}`, admin.avatar);
  }
};

export const permanentlyDeleteArchivedFeedback = async (id: string, admin: User) => {
  await deleteDoc(doc(db, COLLECTIONS.DELETED_FEEDBACKS, id));
  await createLog('FEEDBACK_PERMANENT_DELETE', admin.id, admin.name, `Permanently removed feedback ${id} from archives.`, admin.avatar);
};

export const getAllFeedbacks = async (): Promise<DonationFeedback[]> => {
  const q = query(collection(db, COLLECTIONS.FEEDBACKS), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationFeedback));
};

export const updateFeedbackStatus = async (feedbackId: string, status: FeedbackStatus, isVisible: boolean) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDBACKS, feedbackId), { 
    status,
    isVisible: status === FeedbackStatus.APPROVED ? isVisible : false
  });
};

export const updateFeedbackMessage = async (feedbackId: string, message: string, admin: User) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDBACKS, feedbackId), { message });
  await createLog('FEEDBACK_EDIT', admin.id, admin.name, `Edited feedback message for ${feedbackId}`, admin.avatar);
};

export const toggleFeedbackVisibility = async (feedbackId: string, isVisible: boolean) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDBACKS, feedbackId), { isVisible });
};

export const subscribeToApprovedFeedbacks = (callback: (feedbacks: DonationFeedback[]) => void, onError?: (err: any) => void) => {
  const q = collection(db, COLLECTIONS.FEEDBACKS);
  
  return onSnapshot(q, (snap) => {
    const data = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as DonationFeedback))
      .filter(f => f.status === FeedbackStatus.APPROVED && f.isVisible === true)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      
    localStorage.setItem(CACHE_KEYS.APPROVED_FEEDBACKS, JSON.stringify(data));
    callback(data);
  }, onError);
};

export const getLandingConfig = async (): Promise<LandingPageConfig | null> => {
  const docRef = doc(db, COLLECTIONS.SETTINGS, 'landing');
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() as LandingPageConfig : null;
};

export const updateLandingConfig = async (config: LandingPageConfig, admin: User) => {
  await setDoc(doc(db, COLLECTIONS.SETTINGS, 'landing'), config);
  await createLog('PAGE_CONFIG_UPDATE', admin.id, admin.name, 'Updated Page Customizer configuration.', admin.avatar);
};

export const getAppPermissions = async (): Promise<AppPermissions> => {
  const local = localStorage.getItem('bloodlink_permissions_override');
  if (local) return JSON.parse(local) as AppPermissions;

  const DEFAULT_PERMS: AppPermissions = {
    user: { 
      sidebar: { dashboard: true, profile: true, history: true, donors: true, supportCenter: true, feedback: true, myNotice: true }, 
      rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canUseMessenger: true, canUseSystemSupport: true, canPostNotice: false }
    },
    editor: { 
      sidebar: { dashboard: true, profile: true, history: true, donors: true, users: true, manageDonations: true, logs: true, supportCenter: true, feedback: true, approveFeedback: true, landingSettings: true, myNotice: true }, 
      rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canPerformAction: true, canLogDonation: true, canUseMessenger: true, canUseSystemSupport: true, canPostNotice: true }
    },
    admin: {
      sidebar: { summary: true, dashboard: true, profile: true, history: true, donors: true, users: true, manageDonations: true, logs: true, rolePermissions: true, supportCenter: true, feedback: true, approveFeedback: true, landingSettings: true, myNotice: true, notifications: true, adminVerify: true, verificationHistory: true, teamIdCards: true, deletedUsers: true },
      rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canPerformAction: true, canLogDonation: true, canUseMessenger: true, canUseSystemSupport: true, canPostNotice: true }
    }
  };

  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'permissions');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppPermissions;
    }
    return DEFAULT_PERMS;
  } catch {
    return DEFAULT_PERMS;
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  const normalizedEmail = email.trim().toLowerCase();
  const isSuperAdminEmail = normalizedEmail === ADMIN_EMAIL;

  if (!userDoc.exists()) {
    const newUser: User = { id: uid, idNumber: `BL-${Math.floor(100000 + Math.random() * 900000)}`, role: isSuperAdminEmail ? UserRole.SUPERADMIN : UserRole.USER, name: userCredential.user.displayName || normalizedEmail.split('@')[0], email: normalizedEmail, bloodGroup: BloodGroup.O_POS, location: 'Unspecified', phone: '', hasDirectoryAccess: isSuperAdminEmail, hasSupportAccess: isSuperAdminEmail, hasFeedbackAccess: isSuperAdminEmail, hasIDCardAccess: isSuperAdminEmail };
    await setDoc(doc(db, COLLECTIONS.USERS, uid), newUser);
    return newUser;
  }
  const data = userDoc.data() as User;

  if (data.isSuspended) {
    await signOut(auth);
    throw new Error("Your account has been suspended by the administrator.");
  }

  if (isSuperAdminEmail && data.role !== UserRole.SUPERADMIN) {
     await updateDoc(doc(db, COLLECTIONS.USERS, uid), { role: UserRole.SUPERADMIN });
     data.role = UserRole.SUPERADMIN;
  }

  await createLog('LOGIN', uid, data.name, 'Authenticated successfully.', data.avatar);
  return data;
};

export const register = async (data: any): Promise<User> => {
  const normalizedEmail = data.email.trim().toLowerCase();
  const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, data.password);
  const uid = userCredential.user.uid;
  const isSuperAdmin = normalizedEmail === ADMIN_EMAIL;
  const newUser: User = { id: uid, idNumber: `BL-${Math.floor(100000 + Math.random() * 900000)}`, role: isSuperAdmin ? UserRole.SUPERADMIN : UserRole.USER, name: data.name, email: normalizedEmail, bloodGroup: data.bloodGroup as BloodGroup, phone: data.phone, location: data.location, avatar: data.avatar || '', hasDirectoryAccess: isSuperAdmin, hasSupportAccess: isSuperAdmin, hasFeedbackAccess: isSuperAdmin, hasIDCardAccess: isSuperAdmin };
  await setDoc(doc(db, COLLECTIONS.USERS, uid), newUser);
  await createLog('REGISTER', uid, data.name, 'Profile initialized.', newUser.avatar);
  return newUser;
};

export const toggleUserSuspension = async (userId: string, isSuspended: boolean, admin: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), { isSuspended });
  await createLog('USER_SUSPENSION_TOGGLE', admin.id, admin.name, `User ${userId} suspension set to ${isSuspended}`, admin.avatar);
};

export const logoutUser = async (user: User | null) => {
  if (user) await createLog('LOGOUT', user.id, user.name, 'Session closed.', user.avatar);
  await signOut(auth);
};

export const getDonations = async (): Promise<DonationRecord[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.DONATIONS), orderBy('donationDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationRecord));
  } catch (e) {
    return [];
  }
};

export const getUserDonations = async (userId: string): Promise<DonationRecord[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.DONATIONS), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationRecord)).sort((a,b) => b.donationDate.localeCompare(a.donationDate));
  } catch (e) {
    return [];
  }
};

export const addDonation = async (donation: Omit<DonationRecord, 'id' | 'status'> & { status?: DonationStatus }, performer: User): Promise<DonationRecord> => {
  const status = donation.status || DonationStatus.PENDING;
  const docRef = await addDoc(collection(db, COLLECTIONS.DONATIONS), { ...donation, userAvatar: performer.avatar || '', status });
  if (status === DonationStatus.COMPLETED) {
    await updateDoc(doc(db, COLLECTIONS.USERS, donation.userId), { lastDonationDate: donation.donationDate });
  }
  await createLog('DONATION_ADD', performer.id, performer.name, `Logged ${donation.units}ml.`, performer.avatar);
  return { ...donation, status, id: docRef.id };
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.USERS));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (e) {
    return [];
  }
};

export const deleteUserRecord = async (userId: string, admin: User): Promise<void> => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data() as User;
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.DELETED_USERS, userId), { 
      ...userData, 
      deletedAt: new Date().toISOString(), 
      deletedBy: admin.name 
    });
    batch.delete(userRef);
    await batch.commit();
    await createLog('USER_DELETE', admin.id, admin.name, `Account Purged: ${userData.name}`, admin.avatar);
  }
};

export const handleDirectoryAccess = async (userId: string, approved: boolean, admin: User) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { hasDirectoryAccess: approved, directoryAccessRequested: false });
    await createLog('DIRECTORY_ACCESS_UPDATE', admin.id, admin.name, `Directory Access updated for ${userId}`, admin.avatar);
  }
};

export const requestDirectoryAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { directoryAccessRequested: true });
  await createLog('DIRECTORY_ACCESS_REQUEST', user.id, user.name, 'User requested directory access.', user.avatar);
};

export const requestFeedbackAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { feedbackAccessRequested: true });
  await createLog('FEEDBACK_ACCESS_REQUEST', user.id, user.name, 'User requested experience feedback access.', user.avatar);
};

export const handleFeedbackAccess = async (userId: string, approved: boolean, admin: User) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { hasFeedbackAccess: approved, feedbackAccessRequested: false });
    await createLog('FEEDBACK_ACCESS_UPDATE', admin.id, admin.name, `Feedback access updated for ${userId}`, admin.avatar);
  }
};

export const requestSupportAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { supportAccessRequested: true });
  await createLog('SUPPORT_ACCESS_REQUEST', user.id, user.name, 'User requested support access.', user.avatar);
};

export const handleSupportAccess = async (userId: string, approved: boolean, admin: User) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { hasSupportAccess: approved, supportAccessRequested: false });
    await createLog('SUPPORT_ACCESS_UPDATE', admin.id, admin.name, `Support access updated for ${userId}`, admin.avatar);
  }
};

export const requestIDCardAccess = async (user: User) => {
  await updateDoc(doc(db, COLLECTIONS.USERS, user.id), { idCardAccessRequested: true });
  await createLog('IDCARD_ACCESS_REQUEST', user.id, user.name, 'User requested digital ID card access.', user.avatar);
};

export const handleIDCardAccess = async (userId: string, approved: boolean, admin: User) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    await updateDoc(userRef, { hasIDCardAccess: approved, idCardAccessRequested: false });
    await createLog('IDCARD_ACCESS_UPDATE', admin.id, admin.name, `ID Card access updated for ${userId}`, admin.avatar);
  }
};

export const subscribeToAllIncomingMessages = (userId: string, callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), where('receiverId', '==', userId), where('read', '==', false));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
  }, onError);
};

export const adminForceChangePassword = async (userId: string, newPass: string, admin: User) => {
  await createLog('ADMIN_FORCE_PASSWORD_CHANGE', admin.id, admin.name, `Administrative PIN reset for user ${userId}.`, admin.avatar);
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), { lastPasswordReset: new Date().toISOString() });
};

export const getDeletedUsers = async (): Promise<any[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.DELETED_USERS));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDeletedDonations = async (): Promise<any[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.DELETED_DONATIONS));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDeletedLogs = async (): Promise<any[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.DELETED_LOGS));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDeletedFeedbacks = async (): Promise<any[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.DELETED_FEEDBACKS));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const restoreDeletedLog = async (logId: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_LOGS, logId);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...logData } = snap.data();
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.LOGS, logId), logData);
    batch.delete(deletedRef);
    await batch.commit();
  }
};

export const restoreDeletedFeedback = async (id: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_FEEDBACKS, id);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.FEEDBACKS, id), data);
    batch.delete(deletedRef);
    await batch.commit();
    await createLog('FEEDBACK_RESTORE', admin.id, admin.name, `Restored feedback ${id}`, admin.avatar);
  }
};

export const deleteDonationRecord = async (id: string, admin: User): Promise<void> => {
  const ref = doc(db, COLLECTIONS.DONATIONS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.DELETED_DONATIONS, id), { 
      ...snap.data(), 
      deletedAt: new Date().toISOString(), 
      deletedBy: admin.name 
    });
    batch.delete(ref);
    await batch.commit();
  }
};

export const deleteLogEntry = async (id: string, admin: User): Promise<void> => {
  const ref = doc(db, COLLECTIONS.LOGS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.DELETED_LOGS, id), { 
      ...snap.data(), 
      deletedAt: new Date().toISOString(), 
      deletedBy: admin.name 
    });
    batch.delete(ref);
    await batch.commit();
  }
};

export const getRevokedPermissions = async (): Promise<RevokedPermission[]> => {
  const snap = await getDocs(collection(db, COLLECTIONS.REVOKED_PERMISSIONS));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RevokedPermission));
};

export const restoreRevokedPermission = async (id: string, admin: User): Promise<void> => {
  const ref = doc(db, COLLECTIONS.REVOKED_PERMISSIONS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as RevokedPermission;
    const userRef = doc(db, COLLECTIONS.USERS, data.userId);
    if (data.type === 'DIRECTORY') await updateDoc(userRef, { hasDirectoryAccess: true });
    else if (data.type === 'SUPPORT') await updateDoc(userRef, { hasSupportAccess: true });
    else if (data.type === 'FEEDBACK') await updateDoc(userRef, { hasFeedbackAccess: true });
    await deleteDoc(ref);
  }
};

export const restoreDeletedUser = async (userId: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_USERS, userId);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...userData } = snap.data();
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.USERS, userId), userData);
    batch.delete(deletedRef);
    await batch.commit();
  }
};

export const restoreDeletedDonation = async (id: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_DONATIONS, id);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    const batch = writeBatch(db);
    batch.set(doc(db, COLLECTIONS.DONATIONS, id), data);
    batch.delete(deletedRef);
    await batch.commit();
  }
};

export const sendMessage = async (msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>) => {
  await addDoc(collection(db, COLLECTIONS.MESSAGES), { ...msg, timestamp: new Date().toISOString(), read: false });
};

export const subscribeToRoomMessages = (roomId: string, callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = collection(db, COLLECTIONS.MESSAGES);
  return onSnapshot(q, snap => {
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ChatMessage))
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    callback(data);
  }, onError);
};

export const subscribeToAllSupportRooms = (callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), orderBy('timestamp', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage))), onError);
};

export const markMessagesAsRead = async (roomId: string, userId: string) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), where('roomId', '==', roomId), where('receiverId', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
};

export const updateAppPermissions = async (perms: AppPermissions, admin: User): Promise<{ synced: boolean, error?: string }> => {
  const isSuperAdmin = admin.role === UserRole.SUPERADMIN || admin.email.trim().toLowerCase() === ADMIN_EMAIL;
  if (!isSuperAdmin) throw new Error("Only the System Administrator can modify global permissions.");
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'permissions');
    await setDoc(docRef, perms);
    localStorage.removeItem('bloodlink_permissions_override');
    await createLog('PERMISSIONS_UPDATE', admin.id, admin.name, 'Admin updated global system rules.', admin.avatar);
    return { synced: true };
  } catch (e: any) {
    if (e?.code === 'permission-denied') {
      localStorage.setItem('bloodlink_permissions_override', JSON.stringify(perms));
      return { synced: false, error: "Cloud sync denied." };
    }
    throw e;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>, performer: User): Promise<User> => {
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), data);
  const updated = await getDoc(doc(db, COLLECTIONS.USERS, userId));
  const user = { id: updated.id, ...updated.data() } as User;
  await createLog('PROFILE_UPDATE', performer.id, performer.name, `Updated account: ${user.name}`, performer.avatar);
  return user;
};
