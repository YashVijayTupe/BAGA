"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  Shield,
  Mail,
  Lock,
  User as UserIcon,
  MapPin,
  Briefcase,
  IdCard,
  Clock,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { INDIA_STATES, getDistricts, getCities } from "@/lib/indiaLocations";

const DEPARTMENTS = [
  "Municipal Water Works Department",
  "Municipal Solid Waste Management",
  "Municipal Public Works Department",
  "Gram Panchayat",
  "Zilla Parishad / State PWD",
  "State Electricity Board (MSEDCL/MSEB)",
];

type VerificationStatus = "pending" | "approved" | "rejected" | null;

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"citizen" | "officer">("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Location cascade
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Officer fields
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [employeeId, setEmployeeId] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(null);

  const resetLocation = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedCity("");
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("");
    setSelectedCity("");
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedCity("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerificationStatus(null);
    setLoading(true);

    try {
      if (isLogin) {
        // ── LOGIN ──
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const docSnap = await getDoc(
          doc(db, "users", userCredential.user.uid)
        );
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.role === "officer") {
            // Check officer verification status
            if (userData.verification_status === "pending") {
              setVerificationStatus("pending");
              await auth.signOut();
              return;
            }
            if (userData.verification_status === "rejected") {
              setVerificationStatus("rejected");
              await auth.signOut();
              return;
            }
            // Approved officer
            window.location.href = "/officer";
          } else {
            window.location.href = "/";
          }
        } else {
          throw new Error("User profile not found. Please re-register.");
        }
      } else {
        // ── REGISTER ──
        if (!selectedState || !selectedDistrict || !selectedCity) {
          throw new Error("Please select your State, District, and City/Village.");
        }
        if (role === "officer" && !employeeId.trim()) {
          throw new Error("Employee ID is required for officer registration.");
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        const profileData: any = {
          uid: user.uid,
          name: name.trim(),
          email,
          role,
          state: selectedState,
          district: selectedDistrict,
          city: selectedCity,
          created_at: new Date().toISOString(),
        };

        if (role === "officer") {
          profileData.department = department;
          profileData.employee_id = employeeId.trim().toUpperCase();
          profileData.verification_status = "pending"; // Must be approved by admin
        } else {
          profileData.verification_status = "approved"; // Citizens auto-approved
        }

        await setDoc(doc(db, "users", user.uid), profileData);

        if (role === "officer") {
          // Sign out officer immediately — they need admin approval first
          await auth.signOut();
          setVerificationStatus("pending");
        } else {
          window.location.href = "/";
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const districts = getDistricts(selectedState);
  const cities = getCities(selectedState, selectedDistrict);

  // ── Pending / Rejected screens ──
  if (verificationStatus === "pending") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>
        <div className="glass-card w-full max-w-md p-8 rounded-2xl text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-yellow-500/15 flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Verification Pending</h2>
          <p className="text-muted-foreground mb-4">
            Your government officer account has been submitted for verification.
          </p>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs font-medium text-yellow-400 mb-2 uppercase tracking-wider">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• A BAGA Administrator will verify your Employee ID and district jurisdiction</li>
              <li>• You will receive an approval once verified (usually within 24 hours)</li>
              <li>• After approval, log in again to access the Officer Portal</li>
            </ul>
          </div>
          <button
            onClick={() => { setVerificationStatus(null); setIsLogin(true); }}
            className="w-full py-3 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80 transition-all"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card w-full max-w-md p-8 rounded-2xl text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Verification Rejected</h2>
          <p className="text-muted-foreground mb-6">
            Your officer registration was rejected. The Employee ID or jurisdiction provided could not be verified. Please contact your department&apos;s administrative office.
          </p>
          <button
            onClick={() => { setVerificationStatus(null); setIsLogin(true); }}
            className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-saffron-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="glass-card w-full max-w-md p-8 rounded-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-saffron-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">BAGA Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Role Selector — Register only */}
        {!isLogin && (
          <div className="flex bg-secondary/50 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setRole("citizen"); resetLocation(); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === "citizen" ? "bg-background shadow-md text-foreground" : "text-muted-foreground"}`}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => { setRole("officer"); resetLocation(); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${role === "officer" ? "bg-emerald-500/20 text-emerald-500 shadow-md" : "text-muted-foreground"}`}
            >
              Government Officer
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name — Register only */}
          {!isLogin && (
            <div className="relative">
              <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary/30 border border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Location Fields — Register only */}
          {!isLogin && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-saffron-500" />
                <p className="text-xs font-semibold text-saffron-500 uppercase tracking-wider">
                  {role === "citizen" ? "Your Location (Village / City)" : "Your Jurisdiction"}
                </p>
              </div>

              {/* State */}
              <div className="relative">
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  required
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full appearance-none bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50"
                >
                  <option value="">-- Select State --</option>
                  {INDIA_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div className="relative">
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  required
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedState}
                  className="w-full appearance-none bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50 disabled:opacity-40"
                >
                  <option value="">-- Select District --</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* City / Village */}
              <div className="relative">
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  required
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedDistrict}
                  className="w-full appearance-none bg-secondary/30 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/50 disabled:opacity-40"
                >
                  <option value="">-- Select City / Village --</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Officer Fields — Register only */}
          {!isLogin && role === "officer" && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Officer Details</p>
              </div>

              {/* Department */}
              <div className="relative">
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full appearance-none bg-secondary/30 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Employee ID */}
              <div className="relative">
                <IdCard className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Government Employee ID (e.g. MH-PWD-20045)"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-secondary/30 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Info box */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-400/90">
                  <strong>Note:</strong> Your account will be in <strong>Pending</strong> status until verified by a BAGA Administrator. You will not be able to log in until approved.
                </p>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all mt-2 ${loading ? "opacity-50" : "hover:scale-[1.02] active:scale-[0.98]"} ${!isLogin && role === "officer" ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25" : "bg-gradient-to-r from-saffron-500 to-saffron-600 shadow-saffron-500/25"}`}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : role === "officer" ? "Submit for Verification" : "Create Account"}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); setVerificationStatus(null); }}
            className="ml-2 font-medium text-foreground hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </main>
  );
}
