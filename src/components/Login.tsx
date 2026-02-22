import { useEffect, useState } from 'react';
import { Lock, ChevronRight, Server, Activity, AlertCircle, UserPlus } from 'lucide-react';
import Logo3D from './Logo3D';
import { auth, googleProvider, db } from '../firebase';
import {
    createUserWithEmailAndPassword,
    getRedirectResult,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginProps {
    onLogin: (user: string, org: string) => void;
}

const getErrorCode = (err: unknown): string | undefined => {
    if (!err || typeof err !== 'object') return undefined;
    const rec = err as Record<string, unknown>;
    const code = rec.code;
    return typeof code === 'string' ? code : code != null ? String(code) : undefined;
};

const buildUnauthorizedDomainError = () => {
    const currentHost = typeof window !== 'undefined' ? window.location.host : 'unknown-host';
    const configuredAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'not-configured';
    return `This URL isn't authorized for Firebase Auth. Current host: ${currentHost}. Configured auth domain: ${configuredAuthDomain}. Add "${currentHost}" in Firebase Console -> Authentication -> Settings -> Authorized domains, then hard refresh and retry.`;
};

export default function Login({ onLogin }: LoginProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false); // Toggle state

    // Default Org (User can't change this in "Test Mode" simplicity)
    const org = "Global Mfg - NA East";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState(""); // For Registration
    const [error, setError] = useState("");

    const isLikelyMobile = () => {
        if (typeof window === 'undefined') return false;
        const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
        const smallScreen = window.matchMedia?.('(max-width: 768px)')?.matches ?? false;
        return coarsePointer || smallScreen;
    };

    const upsertGoogleProfileAndContinue = async (user: User) => {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
            userRef,
            {
                email: user.email,
                name: user.displayName || user.email || "Google User",
                organization: org,
                lastLogin: new Date().toISOString(),
            },
            { merge: true }
        );

        onLogin(user.displayName || user.email || "Google User", org);
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const result = await getRedirectResult(auth);
                if (cancelled) return;
                if (result?.user) {
                    setIsLoading(true);
                    setError("");
                    await upsertGoogleProfileAndContinue(result.user);
                }
            } catch (err: unknown) {
                if (cancelled) return;
                console.error("Google Redirect Login Failed:", err);
                const code = getErrorCode(err);
                if (code === 'auth/unauthorized-domain') {
                    setError(buildUnauthorizedDomainError());
                } else {
                    setError("SSO Authorization failed.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (isRegistering) {
                // REGISTER FLOW
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                // Write user profile to Firestore
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: userCredential.user.email,
                    name: fullName || "New User",
                    organization: org,
                    role: "Operator",
                    createdAt: new Date().toISOString()
                });

                onLogin(userCredential.user.email || "New User", org);

            } else {
                // LOGIN FLOW
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                onLogin(userCredential.user.email || "Authenticated User", org);
            }

        } catch (err: unknown) {
            console.error("Auth Failed:", err);
            const code = getErrorCode(err);
            // Better error messages
            if (code === 'auth/email-already-in-use') setError("Email already registered.");
            else if (code === 'auth/weak-password') setError("Password should be at least 6 chars.");
            else if (code === 'auth/invalid-credential') setError("Invalid credentials.");
            else setError("Authentication failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError("");
        try {
            // Popups are commonly blocked on mobile; prefer redirect there.
            if (isLikelyMobile()) {
                await signInWithRedirect(auth, googleProvider);
                return;
            }

            const result = await signInWithPopup(auth, googleProvider);
            await upsertGoogleProfileAndContinue(result.user);
        } catch (err: unknown) {
            console.error("Google Login Failed:", err);
            const code = getErrorCode(err);
            if (code === 'auth/unauthorized-domain') {
                setError(buildUnauthorizedDomainError());
            } else if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
                // Give a seamless fallback when a popup is blocked.
                try {
                    await signInWithRedirect(auth, googleProvider);
                    return;
                } catch (redirectErr) {
                    console.error("Google Redirect Fallback Failed:", redirectErr);
                }
                setError("SSO popup was blocked. Retrying with redirect...");
            } else {
                setError("SSO Authorization failed.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950 font-sans tracking-wide overflow-x-hidden overflow-y-auto">
            {/* Abstract Tech Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 min-h-[100dvh] flex items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-5xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row md:h-[600px]">

                {/* Left Side - Product Context */}
                <div className="w-full md:w-5/12 p-6 sm:p-10 md:p-12 flex flex-col justify-between bg-gradient-to-b from-slate-800/50 to-slate-900/50 border-b md:border-b-0 md:border-r border-white/5 relative group">
                    <div>
                        <div className="flex items-center gap-3 mb-10">
                            <div className="relative rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-500 overflow-hidden">
                                <Logo3D size={48} speed={0.8} colorScheme="blue" />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">NetMonit</span>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
                            Industrial Network<br />
                            <span className="text-blue-400">Health Monitor</span>
                        </h2>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="bg-slate-800 p-2 rounded-lg h-fit border border-slate-700">
                                    <Activity className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold text-sm">L1-L7 Diagnostics</h4>
                                    <p className="text-slate-400 text-xs mt-1">Full-stack telemetry packet analysis.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-slate-800 p-2 rounded-lg h-fit border border-slate-700">
                                    <Server className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold text-sm">Real-Time Topology</h4>
                                    <p className="text-slate-400 text-xs mt-1">3D Digital Twin of physical infrastructure.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-600 mt-12 font-mono">
                        v2.4.0-stable | ENTERPRISE EDITION
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-7/12 p-6 sm:p-10 md:p-12 bg-black/20 flex flex-col justify-center">

                    <div className="mb-8 pl-1">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            {isRegistering ? "Create Account" : "Secure Access"}
                        </h3>
                        <p className="text-slate-400 text-sm">
                            {isRegistering ? "Initialize a new operator identity." : "Authenticate to access the command center."}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5 max-w-sm">
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20 animate-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* Google SSO Button */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Identity Provider</label>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-transparent shadow-lg text-sm"
                            >
                                <img src="https://www.vectorlogo.zone/logos/google/google-icon.svg" className="w-5 h-5" alt="Google" />
                                {isRegistering ? "Sign up with Google" : "Sign in with Google SSO"}
                            </button>
                        </div>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-800"></div>
                            <span className="flex-shrink mx-4 text-slate-600 text-[10px] font-bold uppercase tracking-widest">Or Use Credentials</span>
                            <div className="flex-grow border-t border-slate-800"></div>
                        </div>

                        <div className="space-y-4">
                            {isRegistering && (
                                <div className="animate-in slide-in-from-left-4 duration-300">
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Full Name (e.g. John Doe)"
                                        className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block w-full p-3 transition-all hover:border-slate-700 placeholder-slate-600"
                                        required
                                    />
                                </div>
                            )}
                            <div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@globalmfg.com"
                                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block w-full p-3 transition-all hover:border-slate-700 placeholder-slate-600"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-950/50 border border-slate-800 text-slate-200 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 block w-full p-3 transition-all hover:border-slate-700 placeholder-slate-600"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group border border-blue-500/50"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        <span className="text-sm">Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        {isRegistering ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                        {isRegistering ? "Create Official Account" : "Initialize Session"}
                                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => { setIsRegistering(!isRegistering); setError(""); }}
                                className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 w-full font-medium"
                            >
                                {isRegistering ? (
                                    <>Already have credentials? <span className="text-blue-400">Sign In</span></>
                                ) : (
                                    <>New operator? <span className="text-blue-400">Register Account</span></>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                </div>
            </div>
        </div>
    );
}
