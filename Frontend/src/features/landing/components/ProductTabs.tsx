import React, { useState } from 'react';
import { LayoutGrid, LineChart } from 'lucide-react';

const TABS = [
    {
        id: 'workspace',
        label: 'Workspace & Request Client',
        icon: LayoutGrid,
        title: 'Manage requests, headers, and authentication in one place',
        desc: 'Organize your endpoints into projects and folders. Test GET, POST, PUT, DELETE requests with custom headers, query params, and body data directly from the browser.',
        image: '/workspace_mockup.png',
        alt: 'PingDeck Workspace API Request Panel Client',
    },
    {
        id: 'analytics',
        label: 'Latency & Health Metrics',
        icon: LineChart,
        title: 'Real-time telemetry and full check log inspector',
        desc: 'Track response time curves over time. Inspect complete status codes, response headers, and raw JSON response bodies for every executed health check.',
        image: '/analytics_mockup.png',
        alt: 'PingDeck Latency Chart and Check Logs',
    },
];

export const ProductTabs: React.FC = () => {
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const current = TABS.find((t) => t.id === activeTab) || TABS[0];

    return (
        <section className="py-16 border-t border-slate-200/60">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                        Designed for developer workflow
                    </h2>
                    <p className="text-slate-500 text-sm font-medium max-w-xl">
                        Everything you need to inspect endpoints, track response trends, and catch downtime before your users do.
                    </p>
                </div>

                {/* Tab buttons */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = tab.id === activeTab;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? 'bg-white text-blue-600 border-x border-t border-slate-200 shadow-xs translate-y-px font-bold'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                                }`}
                            >
                                <Icon size={15} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                    <div className="space-y-1.5 max-w-2xl">
                        <h3 className="text-lg font-bold text-slate-900">{current.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                            {current.desc}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-[16/9] relative shadow-inner">
                        <img
                            src={current.image}
                            alt={current.alt}
                            className="w-full h-full object-fill select-none pointer-events-none"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
