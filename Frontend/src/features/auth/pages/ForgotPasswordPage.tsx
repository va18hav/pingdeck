import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { useForgotPassword } from '../hooks/useAuth';

export const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const forgotPasswordMutation = useForgotPassword();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) return;

        forgotPasswordMutation.mutate(trimmedEmail, {
            onSuccess: () => {
                // Navigate to reset password page with email context
                navigate(`/reset-password?email=${encodeURIComponent(trimmedEmail)}`);
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 animate-fade-in">
                {/* Header Section */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-2">
                        <Mail size={28} className="stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">Forgot Password</h2>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        Enter your registered email address and we'll send you a 4-digit code to reset your password.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-semibold text-slate-800"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={forgotPasswordMutation.isPending || !email}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                        {forgotPasswordMutation.isPending ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>Send Verification Code</span>
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                {/* Back to Sign In link */}
                <div className="text-center pt-2 border-t border-slate-100">
                    <Link
                        to="/login"
                        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Back to Sign In</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};
