import React from 'react';
import { UpdatePasswordSection } from '../../auth/components/UpdatePasswordSection';
import { ShieldCheck, Mail } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

export const SettingsPage: React.FC = () => {
    const { user } = useAuthStore();

    return (
        <div className="space-y-10 w-full animate-fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">Account Settings</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Manage your profile information and account security
                </p>
            </div>

            {/* Profile Info Details Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <h3 className="text-md font-bold text-slate-900 font-sans">Account Profile</h3>
                        <p className="text-slate-500 text-xs mt-0.5">Your personal information and email verification status</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-4 text-slate-700">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Email Address</span>
                        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-800">
                            <Mail size={16} className="text-slate-400" />
                            <span>{user?.email}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Account Status</span>
                        <div>
                            {user?.isVerified ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    Verified
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                    Unverified
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Update Card */}
            <UpdatePasswordSection />
        </div>
    );
};
