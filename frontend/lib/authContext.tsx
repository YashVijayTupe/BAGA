"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "citizen" | "officer";
  // Location fields
  state: string;
  district: string;
  city: string;
  // Officer-specific
  department?: string;
  employee_id?: string;
  // Verification: 'pending' | 'approved' | 'rejected'
  verification_status?: "pending" | "approved" | "rejected";
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, logout: async () => { } });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch custom user profile from Firestore
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, profile, loading, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
