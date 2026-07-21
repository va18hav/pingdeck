import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useGoogleLogin } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
    const googleLoginMutation = useGoogleLogin();

    useEffect(() => {
        const handleCredentialResponse = (response: any) => {
            if (response.credential) {
                googleLoginMutation.mutate(response.credential);
            }
        };

        const initGoogle = () => {
            const google = (window as any).google;
            if (google && google.accounts && google.accounts.id) {
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                });
                google.accounts.id.renderButton(
                    document.getElementById('google-signin-div'),
                    { theme: 'outline', size: 'large', width: 384, text: 'signin_with' }
                );
            }
        };

        const checkSdk = setInterval(() => {
            if ((window as any).google) {
                initGoogle();
                clearInterval(checkSdk);
            }
        }, 100);

        return () => clearInterval(checkSdk);
    }, [googleLoginMutation]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                {/* Logo and title */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50/50 rounded-xl mb-2">
                        <img src="/logo.png" alt="PingDeck" className="w-9 h-9 object-contain select-none" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">PingDeck</h2>
                    <p className="text-sm text-slate-500">
                        Sign in to monitor your distributed systems
                    </p>
                </div>

                {/* Form */}
                <LoginForm />

                {/* Divider & Google Sign In */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider select-none">or sign in with</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="flex justify-center">
                        <div id="google-signin-div" className="w-full min-h-[40px] flex justify-center"></div>
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
    );
};
