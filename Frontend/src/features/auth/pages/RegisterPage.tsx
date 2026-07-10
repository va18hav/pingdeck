import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { api } from '../../../shared/services/api';
import { toast } from 'sonner';

export const RegisterPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/auth/register', { email, password });
            toast.success('Registration successful! Please log in.');
            navigate('/login');
        } catch (err: any) {
            const message = err.response?.data?.message || 'Registration failed';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
                {/* Logo and title */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-2">
                        <ShieldAlert size={28} className="stroke-[2.5]" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Create Account</h2>
                    <p className="text-sm text-slate-500">
                        Join API Guard to secure your endpoints
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
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                <span>Register</span>
                            </>
                        )}
                    </button>
                </form>

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
