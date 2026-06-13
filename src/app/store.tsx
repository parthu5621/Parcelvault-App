import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  authApi,
  parcelsApi,
  lockersApi,
  studentsApi,
  notificationsApi,
  getToken,
  setToken,
  clearToken,
} from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParcelStatus = 'pending' | 'ready' | 'collected' | 'expired';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  password?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  password?: string;
}

export interface Parcel {
  id: string;
  trackingId: string;
  studentId: string;
  studentName: string;
  description: string;
  deliveryService: string;
  lockerId: string | null;
  lockerLabel: string | null;
  otp: string | null;
  status: ParcelStatus;
  arrivedAt: string;
  assignedAt: string | null;
  collectedAt: string | null;
  expiresAt: string | null;
}

export interface Locker {
  id: string;
  label: string;    // e.g. "A-01"
  section: string;  // A, B, C
  size: 'small' | 'medium' | 'large';
  isOccupied: boolean;
  currentParcelId: string | null;
}

export interface Notification {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: 'alert' | 'reminder' | 'update';
  isRead: boolean;
  createdAt: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface StoreContextType {
  // Auth
  currentUser: Student | Admin | null;
  currentRole: 'student' | 'admin' | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: 'student' | 'admin'; error?: string }>;
  register: (data: any, role?: 'student' | 'admin') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;

  // Data
  students: Student[];
  admins: Admin[];
  lockers: Locker[];
  parcels: Parcel[];
  notifications: Notification[];
  refreshData: () => Promise<void>;

  // Parcel operations
  addParcel: (data: { studentId: string; description: string; deliveryService: string; trackingId: string }) => Promise<Parcel>;
  assignLocker: (parcelId: string, lockerId: string) => Promise<{ success: boolean; otp: string }>;
  collectParcel: (parcelId: string, enteredOtp: string) => Promise<{ success: boolean; error?: string }>;
  getStudentParcels: (studentId: string) => Parcel[];
  releaseLocker: (lockerId: string) => Promise<void>;

  // Notifications
  getStudentNotifications: (studentId: string) => Notification[];
  markNotificationRead: (notifId: string) => Promise<void>;

  // Selected items (for navigation context)
  selectedParcelId: string | null;
  setSelectedParcelId: (id: string | null) => void;
  selectedLockerId: string | null;
  setSelectedLockerId: (id: string | null) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Student | Admin | null>(null);
  const [currentRole, setCurrentRole] = useState<'student' | 'admin' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null);

  // Fetch all lists from the server
  const refreshData = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const [pRes, lRes, nRes] = await Promise.all([
        parcelsApi.list().catch(() => ({ success: false, data: [] })),
        lockersApi.list().catch(() => ({ success: false, data: [] })),
        notificationsApi.list().catch(() => ({ success: false, data: [] })),
      ]);

      if (pRes.success) setParcels(pRes.data);
      if (lRes.success) setLockers(lRes.data);
      if (nRes.success) setNotifications(nRes.data);

      if (currentRole === 'admin') {
        const sRes = await studentsApi.list().catch(() => ({ success: false, data: [] }));
        if (sRes.success) setStudents(sRes.data);
      }
    } catch (err) {
      console.error('Failed to sync backend data:', err);
    }
  };

  // Attempt to restore user session on mount
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (token) {
        try {
          const res = await authApi.me();
          if (res.success && res.user) {
            setCurrentUser(res.user);
            setCurrentRole(res.user.role || 'student');
          } else {
            clearToken();
          }
        } catch (e) {
          console.error('Session restoration failed:', e);
          clearToken();
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  // Fetch fresh data when user/role changes
  useEffect(() => {
    if (currentUser) {
      refreshData();
    } else {
      setParcels([]);
      setLockers([]);
      setNotifications([]);
      setStudents([]);
    }
  }, [currentUser, currentRole]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      if (res.success && res.token) {
        setToken(res.token);
        setCurrentUser(res.user);
        setCurrentRole(res.role as 'student' | 'admin');
        return { success: true, role: res.role as 'student' | 'admin' };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email or password' };
    }
  };

  const register = async (data: any, role: 'student' | 'admin' = 'student') => {
    try {
      const res = await authApi.register({ ...data, role });
      if (res.success && res.token) {
        setToken(res.token);
        setCurrentUser(res.user);
        setCurrentRole(res.role as 'student' | 'admin');
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    clearToken();
    setCurrentUser(null);
    setCurrentRole(null);
    setSelectedParcelId(null);
    setSelectedLockerId(null);
  };

  const addParcel = async (data: { studentId: string; description: string; deliveryService: string; trackingId: string }) => {
    const res = await parcelsApi.create(data);
    if (res.success && res.data) {
      setParcels(prev => [...prev, res.data]);
      return res.data;
    }
    throw new Error('Failed to create parcel');
  };

  const assignLocker = async (parcelId: string, lockerId: string) => {
    try {
      const res = await parcelsApi.assignLocker(parcelId, lockerId);
      if (res.success) {
        await refreshData();
        return { success: true, otp: res.otp };
      }
      return { success: false, otp: '' };
    } catch (err) {
      console.error(err);
      return { success: false, otp: '' };
    }
  };

  const collectParcel = async (parcelId: string, enteredOtp: string) => {
    try {
      const res = await parcelsApi.collect(parcelId, enteredOtp);
      if (res.success) {
        await refreshData();
        return { success: true };
      }
      return { success: false, error: 'Collection failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid OTP. Please try again.' };
    }
  };

  const getStudentParcels = (studentId: string) =>
    parcels.filter(p => p.studentId === studentId);

  const releaseLocker = async (lockerId: string) => {
    try {
      const locker = lockers.find(l => l.id === lockerId);
      if (!locker || !locker.currentParcelId) return;

      const res = await parcelsApi.release(locker.currentParcelId);
      if (res.success) {
        await refreshData();
      }
    } catch (err) {
      console.error('Failed to release locker:', err);
    }
  };

  const getStudentNotifications = (studentId: string) =>
    notifications.filter(n => n.studentId === studentId);

  const markNotificationRead = async (notifId: string) => {
    try {
      const res = await notificationsApi.markRead(notifId);
      if (res.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === notifId ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  return (
    <StoreContext.Provider value={{
      currentUser, currentRole, login, register, logout, loading,
      students, admins, lockers, parcels, notifications, refreshData,
      addParcel, assignLocker, collectParcel, getStudentParcels, releaseLocker,
      getStudentNotifications, markNotificationRead,
      selectedParcelId, setSelectedParcelId,
      selectedLockerId, setSelectedLockerId,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
