import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useVerifyResetOtp, useResetPassword } from '../hooks/useAuth';
import { toast } from 'sonner';

export const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';

    // Step state: 1 = OTP verify, 2 = Set new password
    const [step, setStep] = useState<1 | 2>(1);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Mutations
    const verifyResetOtpMutation = useVerifyResetOtp();
    const resetPasswordMutation = useResetPassword();

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = code.trim();
        if (trimmedCode.length !== 4) {
            toast.error('Verification code must be exactly 4 digits');
            return;
        }

        verifyResetOtpMutation.mutate(
            { email, code: trimmedCode },
            {
                onSuccess: () => {
                    setStep(2);
                }
            }
        );
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedPassword = newPassword.trim();
        if (trimmedPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }
        if (trimmedPassword !== confirmPassword.trim()) {
            toast.error('Passwords do not match');
            return;
        }

        resetPasswordMutation.mutate({
            email,
            newPassword: trimmedPassword
        });
    };

    if (!email) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-rose-50 text-rose-600 rounded-xl">
                        <ShieldAlert size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Missing Email Parameter</h2>
                    <p className="text-sm text-slate-500">
                        Please initiate password recovery from the login screen.
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-blue-600 hover:underline"
                    >
                        <ArrowLeft size={14} />
                        <span>Go to Login</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 animate-fade-in">
                
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-2">
                        <KeyRound size={28} className="stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                        {step === 1 ? 'Verify Code' : 'Reset Password'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {step === 1 
                            ? `We sent a reset code to ${email}`
                            : 'Set your new secure password below'
                        }
                    </p>
                </div>

                {step === 1 ? (
                    /* Step 1 Form: OTP code verification */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono block text-center">
                                Enter 4-Digit Reset Code
                            </label>
                            <input
                                type="text"
                                maxLength={4}
                                required
                                placeholder="0 0 0 0"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // digits only
                                className="w-full px-4 py-4 border border-slate-200 rounded-xl text-2xl font-mono text-center tracking-[12px] placeholder:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-bold text-slate-800"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={verifyResetOtpMutation.isPending || code.length !== 4}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                            {verifyResetOtpMutation.isPending ? (
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span>Verify & Continue</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    /* Step 2 Form: New password entry */
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                New Password
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-semibold text-slate-800"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-semibold text-slate-800"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={resetPasswordMutation.isPending || !newPassword || !confirmPassword}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                            {resetPasswordMutation.isPending ? (
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <span>Reset Password & Log In</span>
                            )}
                        </button>
                    </form>
                )}

                {/* Footer link */}
                <div className="text-center pt-2 border-t border-slate-100">
                    <Link
                        to="/login"
                        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Cancel</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
