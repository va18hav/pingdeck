import React from 'react';

export const SkeletonLoader: React.FC = () => {
    return (
        <div className="w-full animate-pulse space-y-6">
            {/* Header skeletal */}
            <div className="flex items-center justify-between">
                <div className="h-8 bg-slate-200 rounded-md w-1/4"></div>
                <div className="h-10 bg-slate-200 rounded-md w-32"></div>
            </div>

            {/* Grid layout cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 border border-slate-200 bg-white rounded-xl space-y-3">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    </div>
                ))}
            </div>

            {/* Table block */}
            <div className="border border-slate-200 bg-white rounded-xl p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded-md w-1/5 mb-4"></div>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <div className="h-4 bg-slate-200 rounded-md w-1/6"></div>
                        <div className="h-4 bg-slate-200 rounded-md flex-1"></div>
                        <div className="h-4 bg-slate-200 rounded-md w-16"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
