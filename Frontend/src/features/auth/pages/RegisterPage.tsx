import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { RegisterForm } from '../components/RegisterForm';
import { useGoogleLogin } from '../hooks/useAuth';

export const RegisterPage: React.FC = () => {
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
                    document.getElementById('google-signup-div'),
                    { theme: 'outline', size: 'large', width: 384, text: 'signup_with' }
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
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-2">
                        <Activity size={28} className="stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Account</h2>
                    <p className="text-sm text-slate-500">
                        Join PingDeck to monitor your endpoints
                    </p>
                </div>

                {/* Form */}
                <RegisterForm />

                {/* Divider & Google Signup */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider select-none">or sign up with</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="flex justify-center">
                        <div id="google-signup-div" className="w-full min-h-[40px] flex justify-center"></div>
                    </div>
                </div>

                {/* Navigation links */}
                <div className="text-center pt-2 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
