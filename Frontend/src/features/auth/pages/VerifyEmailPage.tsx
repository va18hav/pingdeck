import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useSendOtp, useVerifyOtp, useLogout } from '../hooks/useAuth';
import { toast } from 'sonner';

export const VerifyEmailPage: React.FC = () => {
    const { user } = useAuthStore();
    const sendOtpMutation = useSendOtp();
    const verifyOtpMutation = useVerifyOtp();
    const logoutMutation = useLogout();

    const [code, setCode] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Trigger OTP send on mount if the user has no active OTP yet
    useEffect(() => {
        // Automatically send the first OTP to the user's email
        sendOtpMutation.mutate();
    }, []);

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldown === 0) return;
        const interval = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldown]);

    const handleResend = () => {
        if (cooldown > 0) return;
        sendOtpMutation.mutate(undefined, {
            onSuccess: () => {
                setCooldown(60); // 60 seconds cooldown
            }
        });
    };

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = code.trim();
        if (trimmedCode.length !== 4) {
            toast.error('Please enter a valid 4-digit verification code');
            return;
        }
        verifyOtpMutation.mutate({ code: trimmedCode });
    };

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                
                {/* Header Icon & Description */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-2 animate-pulse">
                        <Mail size={28} className="stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Verify your email</h2>
                    <p className="text-sm text-slate-500">
                        We sent a 4-digit verification code to
                    </p>
                    <p className="text-sm font-semibold text-slate-700 font-mono">
                        {user?.email || 'your email address'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono block text-center">
                            Enter 4-Digit Code
                        </label>
                        <input
                            type="text"
                            maxLength={4}
                            required
                            placeholder="0 0 0 0"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // only digits
                            className="w-full px-4 py-4 border border-slate-200 rounded-xl text-2xl font-mono text-center tracking-[12px] placeholder:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-bold"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={verifyOtpMutation.isPending || code.length !== 4}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {verifyOtpMutation.isPending ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>Verify & Continue</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* Resend & Action Buttons */}
                <div className="flex flex-col items-center space-y-4 pt-2 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldown > 0 || sendOtpMutation.isPending}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center space-x-1.5 cursor-pointer"
                    >
                        {sendOtpMutation.isPending ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : null}
                        <span>
                            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center space-x-1 cursor-pointer transition-colors duration-150"
                    >
                        <LogOut size={12} />
                        <span>Sign out / Change account</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
