import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldCheck, Mail } from 'lucide-react';
import { useSendOtp, useVerifyOtp, useUpdatePassword } from '../hooks/useAuth';
import { useAuthStore } from '../../../store/authStore';
import { toast } from 'sonner';

export const UpdatePasswordSection: React.FC = () => {
    const { user } = useAuthStore();
    const sendOtpMutation = useSendOtp();
    const verifyOtpMutation = useVerifyOtp();
    const updatePasswordMutation = useUpdatePassword();

    // Steps: 1 = Idle/Change Request, 2 = Verify OTP, 3 = Set new password
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Cooldown countdown timer for OTP resend
    useEffect(() => {
        if (cooldown === 0) return;
        const interval = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldown]);

    const handleRequestOtp = () => {
        sendOtpMutation.mutate(undefined, {
            onSuccess: () => {
                setStep(2);
                setCooldown(60);
                toast.success('Verification code sent to your email!');
            }
        });
    };

    const handleVerifyOtp = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedCode = code.trim();
        if (trimmedCode.length !== 4) {
            toast.error('Verification code must be exactly 4 digits');
            return;
        }

        verifyOtpMutation.mutate(
            { code: trimmedCode, purpose: 'update-password' },
            {
                onSuccess: () => {
                    setStep(3);
                }
            }
        );
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
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

        updatePasswordMutation.mutate(trimmedPassword, {
            onSuccess: () => {
                // Reset form state on success
                setStep(1);
                setCode('');
                setNewPassword('');
                setConfirmPassword('');
                toast.success('Password updated successfully!');
            }
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <KeyRound size={20} className="stroke-[2.5]" />
                </div>
                <div>
                    <h3 className="text-md font-bold text-slate-900">Change Password</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Securely update your account login credentials</p>
                </div>
            </div>

            {step === 1 && (
                /* Step 1: Trigger email verification code */
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        To change your password, we need to verify your identity. We will send a 4-digit code to your registered email address <span className="font-semibold text-slate-800 font-mono">{user?.email}</span>.
                    </p>
                    <button
                        onClick={handleRequestOtp}
                        disabled={sendOtpMutation.isPending}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {sendOtpMutation.isPending ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Mail size={14} />
                                <span>Send Verification Code</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {step === 2 && (
                /* Step 2: Enter code */
                <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-sm">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            Verification Code
                        </label>
                        <div className="flex gap-3 items-center">
                            <input
                                type="text"
                                maxLength={4}
                                required
                                placeholder="0000"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-slate-800 font-bold"
                            />
                            <button
                                type="submit"
                                disabled={verifyOtpMutation.isPending || code.length !== 4}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                {verifyOtpMutation.isPending ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <span>Verify</span>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                        <button
                            type="button"
                            onClick={handleRequestOtp}
                            disabled={cooldown > 0 || sendOtpMutation.isPending}
                            className="text-blue-600 hover:underline font-semibold disabled:text-slate-400 cursor-pointer"
                        >
                            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {step === 3 && (
                /* Step 3: Enter new password */
                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                    <div className="space-y-3">
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
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-semibold text-slate-800"
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
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-semibold text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                        <button
                            type="submit"
                            disabled={updatePasswordMutation.isPending || !newPassword || !confirmPassword}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
                        >
                            {updatePasswordMutation.isPending ? (
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <ShieldCheck size={14} />
                                    <span>Update Password</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
