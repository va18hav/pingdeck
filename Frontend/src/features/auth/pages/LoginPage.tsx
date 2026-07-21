import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useGoogleLogin, useGithubLogin } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const googleLoginMutation = useGoogleLogin();
    const githubLoginMutation = useGithubLogin();

    useEffect(() => {
        if (code) {
            if (state === 'google') {
                googleLoginMutation.mutate({
                    code,
                    redirectUri: `${window.location.origin}/login`
                }, {
                    onSettled: () => {
                        setSearchParams({}, { replace: true });
                    }
                });
            } else {
                githubLoginMutation.mutate(code, {
                    onSettled: () => {
                        setSearchParams({}, { replace: true });
                    }
                });
            }
        }
    }, [code, state]);

    const handleGoogleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/login`;
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=google`;
    };

    const handleGithubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        const redirectUri = `${window.location.origin}/login`;
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github`;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
            {/* Unified connected white container card */}
            <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col lg:flex-row overflow-hidden min-h-[580px] relative">
                
                {/* Loader Overlay for OAuth Exchange */}
                {(githubLoginMutation.isPending || googleLoginMutation.isPending || code) && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-20">
                        <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        <p className="mt-4 text-xs font-mono font-bold text-slate-500 tracking-wider">SECURELY SIGNING IN...</p>
                    </div>
                )}

                {/* Left Column: Visual Features Highlights */}
                <div className="hidden lg:flex lg:w-[45%] p-12 flex-col justify-between relative select-none shrink-0">
                    {/* Brand Header */}
                    <div className="flex items-center space-x-2.5 text-blue-600 font-extrabold text-xl font-mono">
                        <img src="/logo.png" alt="PingDeck" className="w-8 h-8 object-contain select-none" />
                        <span>PingDeck</span>
                    </div>

                    <div className="space-y-8 max-w-sm mx-auto my-auto w-full">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight font-sans">
                                Complete API Observability
                            </h1>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Monitor your critical HTTP endpoints globally and catch downtime before your users do.
                            </p>
                        </div>

                        <div className="space-y-5 pt-4">
                            <div className="flex items-start space-x-3.5">
                                <span className="text-blue-600 mt-0.5 text-lg font-bold">✦</span>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Global Uptime Checks</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Continuous background scheduling of endpoint requests with customizable intervals.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3.5">
                                <span className="text-blue-600 mt-0.5 text-lg font-bold">✦</span>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Instant Alert Dispatch</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Immediate notification alerts as soon as response codes deviate from specifications.</p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3.5">
                                <span className="text-blue-600 mt-0.5 text-lg font-bold">✦</span>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Telemetry Log Inspector</h4>
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Detailed response headers, latency trendlines, and raw JSON response body logs.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Metrics */}
                    <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider flex justify-between">
                        <span>⚡ INSTANT ALERTS</span>
                        <span>•</span>
                        <span>🛡️ AUTO-HEALING</span>
                    </div>
                </div>

                {/* Thin vertical divider in-between (stops before the top and bottom edge) */}
                <div className="hidden lg:block w-px bg-slate-200/85 my-14 shrink-0" />

                {/* Right Column: Form Container */}
                <div className="flex-1 p-8 sm:p-12 md:p-16 flex flex-col justify-center relative bg-white">
                    <div className="w-full max-w-sm mx-auto space-y-6">
                        
                        {/* Mobile Header (Only visible below lg screens) */}
                        <div className="text-center space-y-2 lg:hidden">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50/50 rounded-xl mb-2">
                                <img src="/logo.png" alt="PingDeck" className="w-9 h-9 object-contain select-none" />
                            </div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">PingDeck</h2>
                            <p className="text-sm text-slate-500">
                                Sign in to monitor your distributed systems
                            </p>
                        </div>
                        
                        <div className="hidden lg:block space-y-1">
                            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Sign In</h2>
                            <p className="text-xs text-slate-500 font-medium">Access your global API monitoring control center</p>
                        </div>

                        {/* Form */}
                        <LoginForm />

                        {/* Divider & Social Sign In */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="h-px bg-slate-200 flex-1"></div>
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider select-none">or sign in with</span>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={googleLoginMutation.isPending}
                                    className="w-full h-[40px] flex items-center justify-center space-x-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer shadow-sm disabled:opacity-50"
                                >
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                    <span className="text-slate-700 font-sans">Sign in with Google</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleGithubLogin}
                                    disabled={githubLoginMutation.isPending}
                                    className="w-full h-[40px] flex items-center justify-center space-x-2.5 bg-[#24292f] hover:bg-[#24292f]/90 text-white rounded-lg text-sm font-semibold transition-colors duration-150 cursor-pointer shadow-sm disabled:opacity-50"
                                >
                                    <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
                                    </svg>
                                    <span>Sign in with GitHub</span>
                                </button>
                            </div>
                        </div>

                        {/* Navigation links */}
                        <div className="text-center pt-2 border-t border-slate-100 flex flex-col space-y-2">
                            <p className="text-sm text-slate-500">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                                    Register now
                                </Link>
                            </p>
                            <p className="text-xs">
                                <Link to="/forgot-password" className="text-blue-500 hover:underline font-semibold">
                                    Forgot your password?
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
