
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
import { User, DonationRecord, AuditLog, UserRole, DonationStatus, BloodGroup, AppPermissions, ChatMessage, DonationFeedback, FeedbackStatus, RevokedPermission, LandingPageConfig } from '../types';

const COLLECTIONS = {
  USERS: 'users',
  DONATIONS: 'donations',
  LOGS: 'logs',
  DELETED_USERS: 'deleted_users',
  DELETED_DONATIONS: 'deleted_donations',
  DELETED_LOGS: 'deleted_logs',
  SETTINGS: 'settings',
  MESSAGES: 'messages',
  REVOKED_PERMISSIONS: 'revoked_permissions',
  FEEDBACKS: 'feedbacks'
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

// Local Caching Helpers
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

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
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
  await deleteDoc(doc(db, COLLECTIONS.FEEDBACKS, feedbackId));
  await createLog('FEEDBACK_DELETE', admin.id, admin.name, `Deleted feedback ${feedbackId}`, admin.avatar);
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

export const toggleFeedbackVisibility = async (feedbackId: string, isVisible: boolean) => {
  await updateDoc(doc(db, COLLECTIONS.FEEDBACKS, feedbackId), { isVisible });
};

export const subscribeToApprovedFeedbacks = (callback: (feedbacks: DonationFeedback[]) => void, onError?: (err: any) => void) => {
  const q = query(
    collection(db, COLLECTIONS.FEEDBACKS), 
    where('status', '==', FeedbackStatus.APPROVED),
    where('isVisible', '==', true),
    orderBy('timestamp', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DonationFeedback));
    // Cache the JSON data for instant loading next time
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
  await createLog('LANDING_CONFIG_UPDATE', admin.id, admin.name, 'Updated landing page configuration.', admin.avatar);
};

export const getAppPermissions = async (): Promise<AppPermissions> => {
  const local = localStorage.getItem('bloodlink_permissions_override');
  if (local) return JSON.parse(local) as AppPermissions;

  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, 'permissions');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as AppPermissions : {
      user: { sidebar: { dashboard: true, profile: true, history: true, donors: true, directoryPermissions: false, supportCenter: true, feedback: true, approveFeedback: false }, rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canUseMessenger: true, canUseSystemSupport: true }},
      editor: { sidebar: { dashboard: true, profile: true, history: true, donors: true, users: true, manageDonations: true, logs: true, directoryPermissions: false, supportCenter: false, feedback: true, approveFeedback: true, landingSettings: true }, rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canPerformAction: true, canLogDonation: true, canUseMessenger: true, canUseSystemSupport: true }}
    };
  } catch {
    return {
      user: { sidebar: { dashboard: true, profile: true, history: true, donors: true, directoryPermissions: false, supportCenter: true, feedback: true, approveFeedback: false }, rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canUseMessenger: true, canUseSystemSupport: true }},
      editor: { sidebar: { dashboard: true, profile: true, history: true, donors: true, users: true, manageDonations: true, logs: true, directoryPermissions: false, supportCenter: false, feedback: true, approveFeedback: true, landingSettings: true }, rules: { canEditProfile: true, canViewDonorDirectory: true, canRequestDonation: true, canPerformAction: true, canLogDonation: true, canUseMessenger: true, canUseSystemSupport: true }}
    };
  }
};

export const login = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail = normalizedEmail === ADMIN_EMAIL;

  if (!userDoc.exists()) {
    const newUser: User = { id: uid, role: isAdminEmail ? UserRole.ADMIN : UserRole.USER, name: userCredential.user.displayName || normalizedEmail.split('@')[0], email: normalizedEmail, bloodGroup: BloodGroup.O_POS, location: 'Unspecified', phone: '', hasDirectoryAccess: isAdminEmail, hasSupportAccess: true };
    await setDoc(doc(db, COLLECTIONS.USERS, uid), newUser);
    return newUser;
  }
  const data = userDoc.data() as User;
  if (isAdminEmail && data.role !== UserRole.ADMIN) {
    await updateDoc(doc(db, COLLECTIONS.USERS, uid), { role: UserRole.ADMIN, hasDirectoryAccess: true });
    data.role = UserRole.ADMIN;
    data.hasDirectoryAccess = true;
  }
  await createLog('LOGIN', uid, data.name, 'Authenticated successfully.', data.avatar);
  return data;
};

export const register = async (data: any): Promise<User> => {
  const normalizedEmail = data.email.trim().toLowerCase();
  const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, data.password);
  const uid = userCredential.user.uid;
  const isAdmin = normalizedEmail === ADMIN_EMAIL;
  const newUser: User = { id: uid, role: isAdmin ? UserRole.ADMIN : UserRole.USER, name: data.name, email: normalizedEmail, bloodGroup: data.bloodGroup as BloodGroup, phone: data.phone, location: data.location, avatar: data.avatar || '', hasDirectoryAccess: isAdmin, hasSupportAccess: true };
  await setDoc(doc(db, COLLECTIONS.USERS, uid), newUser);
  await createLog('REGISTER', uid, data.name, 'Profile initialized.', newUser.avatar);
  return newUser;
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
    await setDoc(doc(db, COLLECTIONS.DELETED_USERS, userId), { ...userData, deletedAt: new Date().toISOString(), deletedBy: admin.name });
    await deleteDoc(userRef);
    await createLog('USER_DELETE', admin.id, admin.name, `Account Purged: ${userData.name}`, admin.avatar);
  }
};

export const handleDirectoryAccess = async (userId: string, approved: boolean, admin: User) => {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data() as User;
    await updateDoc(userRef, { hasDirectoryAccess: approved, directoryAccessRequested: false });
    await createLog('DIRECTORY_ACCESS_UPDATE', admin.id, admin.name, `Directory Access updated for ${userId}`, admin.avatar);
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

export const subscribeToAllIncomingMessages = (userId: string, callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), where('receiverId', '==', userId), where('read', '==', false));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
  }, onError);
};

export const adminForceChangePassword = async (userId: string, newPass: string, admin: User) => {
  await createLog('ADMIN_FORCE_PASSWORD_CHANGE', admin.id, admin.name, `Administrative PIN reset for user ${userId}.`, admin.avatar);
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

export const restoreDeletedLog = async (logId: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_LOGS, logId);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...logData } = snap.data();
    await setDoc(doc(db, COLLECTIONS.LOGS, logId), logData);
    await deleteDoc(deletedRef);
  }
};

export const deleteDonationRecord = async (id: string, admin: User): Promise<void> => {
  const ref = doc(db, COLLECTIONS.DONATIONS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(doc(db, COLLECTIONS.DELETED_DONATIONS, id), { ...snap.data(), deletedAt: new Date().toISOString(), deletedBy: admin.name });
    await deleteDoc(ref);
  }
};

export const deleteLogEntry = async (id: string, admin: User): Promise<void> => {
  const ref = doc(db, COLLECTIONS.LOGS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await setDoc(doc(db, COLLECTIONS.DELETED_LOGS, id), { ...snap.data(), deletedAt: new Date().toISOString(), deletedBy: admin.name });
    await deleteDoc(ref);
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
    await updateDoc(userRef, data.type === 'DIRECTORY' ? { hasDirectoryAccess: true } : { hasSupportAccess: true });
    await deleteDoc(ref);
  }
};

export const restoreDeletedUser = async (userId: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_USERS, userId);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...userData } = snap.data();
    await setDoc(doc(db, COLLECTIONS.USERS, userId), userData);
    await deleteDoc(deletedRef);
  }
};

export const restoreDeletedDonation = async (id: string, admin: User): Promise<void> => {
  const deletedRef = doc(db, COLLECTIONS.DELETED_DONATIONS, id);
  const snap = await getDoc(deletedRef);
  if (snap.exists()) {
    const { deletedAt, deletedBy, ...data } = snap.data();
    await setDoc(doc(db, COLLECTIONS.DONATIONS, id), data);
    await deleteDoc(deletedRef);
  }
};

export const sendMessage = async (msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>) => {
  await addDoc(collection(db, COLLECTIONS.MESSAGES), { ...msg, timestamp: new Date().toISOString(), read: false });
};

export const subscribeToRoomMessages = (roomId: string, callback: (msgs: ChatMessage[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, COLLECTIONS.MESSAGES), where('roomId', '==', roomId), orderBy('timestamp', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage))), onError);
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
  const isSuperAdmin = admin.email.trim().toLowerCase() === ADMIN_EMAIL;
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
