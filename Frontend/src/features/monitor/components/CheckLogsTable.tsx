import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, X, Terminal, Clock } from 'lucide-react';
import type { MonitorResponse } from '../types/monitor.types';

interface CheckLogsTableProps {
    responses?: MonitorResponse[];
}

const highlightJSONLine = (line: string): string => {
    let escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    escaped = escaped.replace(/(".*?")\s*:/g, '<span class="text-amber-600 font-semibold">$1</span>:');
    escaped = escaped.replace(/:\s*(".*?")/g, ': <span class="text-blue-600">$1</span>');
    escaped = escaped.replace(/:\s*(true|false|null|\d+)/g, ': <span class="text-indigo-600 font-bold">$1</span>');
    
    return escaped;
};

const formatJSON = (jsonStr: string): string => {
    try {
        const parsed = JSON.parse(jsonStr);
        return JSON.stringify(parsed, null, 2);
    } catch {
        return jsonStr;
    }
};

export const CheckLogsTable: React.FC<CheckLogsTableProps> = ({ responses }) => {
    const [selectedLog, setSelectedLog] = useState<MonitorResponse | null>(null);
    const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Historical Check Logs</h2>
                <p className="text-slate-500 text-xs">Chronological trace logs of all health status checks (Click any row to inspect details)</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-50/20">
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Response Time</th>
                            <th className="py-4 px-6">Status Code</th>
                            <th className="py-4 px-6">Log Message / Error</th>
                            <th className="py-4 px-6">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {responses && responses.length > 0 ? (
                            responses.map((res) => (
                                <tr 
                                    key={res.id} 
                                    onClick={() => {
                                        setSelectedLog(res);
                                        setActiveTab('body');
                                    }}
                                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                                >
                                    <td className="py-4 px-6">
                                        <span className="flex items-center space-x-2">
                                            {res.status === 'UP' ? (
                                                <ShieldCheck size={16} className="text-emerald-500" />
                                            ) : (
                                                <ShieldAlert size={16} className="text-rose-500" />
                                            )}
                                            <span className={`text-xs font-semibold ${
                                                res.status === 'UP' ? 'text-emerald-700' : 'text-rose-700'
                                            }`}>
                                                {res.status}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 font-mono text-slate-700 text-xs">
                                        {res.responseTime ? `${res.responseTime}ms` : 'N/A'}
                                    </td>
                                    <td className="py-4 px-6 font-mono text-slate-600 text-xs">
                                        {res.statusCode || 'Timeout/Error'}
                                    </td>
                                    <td className="py-4 px-6 text-slate-600 font-mono text-xs max-w-sm truncate" title={res.error || 'Check completed successfully'}>
                                        {res.error || 'Check completed successfully'}
                                    </td>
                                    <td className="py-4 px-6 text-slate-500 text-xs">
                                        {new Date(res.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 font-mono text-xs">
                                    No response history logged yet for this monitor check.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Check Details Inspector Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 shrink-0">
                            <div className="flex items-center space-x-3">
                                {selectedLog.status === 'UP' ? (
                                    <ShieldCheck size={20} className="text-emerald-500" />
                                ) : (
                                    <ShieldAlert size={20} className="text-rose-500" />
                                )}
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Uptime Check Run Detail</h3>
                                    <p className="text-[10px] font-mono text-slate-500">ID: {selectedLog.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Metrics Bento Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 md:p-6 bg-slate-50/20 border-b border-slate-100 shrink-0">
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Response Status</span>
                                <p className={`text-sm font-extrabold ${selectedLog.status === 'UP' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {selectedLog.statusCode || 'N/A'} - {selectedLog.status}
                                </p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Latency / Timing</span>
                                <p className="text-sm font-extrabold text-slate-800 font-mono">
                                    {selectedLog.responseTime ? `${selectedLog.responseTime} ms` : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Run Timestamp</span>
                                <p className="text-xs font-bold text-slate-600">
                                    {new Date(selectedLog.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Error Callout */}
                        {selectedLog.error && (
                            <div className="mx-6 mt-6 p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs flex items-start space-x-2 shrink-0 font-mono">
                                <span className="font-bold">Error:</span>
                                <p className="leading-relaxed">{selectedLog.error}</p>
                            </div>
                        )}

                        {/* Config tabs selector */}
                        <div className="flex border-b border-slate-100 px-6 mt-6 shrink-0">
                            <button
                                onClick={() => setActiveTab('body')}
                                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'body'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Response Body
                            </button>
                            <button
                                onClick={() => setActiveTab('headers')}
                                className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                    activeTab === 'headers'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                Response Headers
                            </button>
                        </div>

                        {/* Tab Content Panels */}
                        <div className="p-6 flex-1 overflow-y-auto min-h-0 bg-slate-50/20">
                            {activeTab === 'body' && (
                                <div className="h-full flex flex-col min-h-[220px]">
                                    {selectedLog.responseBody ? (
                                        (() => {
                                            const formatted = formatJSON(selectedLog.responseBody);
                                            const lines = formatted.split('\n');
                                            return (
                                                <div className="flex font-mono text-xs border border-slate-200 rounded-xl overflow-hidden min-h-0 bg-white">
                                                    <pre className="p-4 text-slate-700 overflow-auto flex-1 whitespace-pre scrollbar-thin max-h-[300px]">
                                                        {lines.map((line, i) => (
                                                            <div key={i} dangerouslySetInnerHTML={{ __html: highlightJSONLine(line) }} />
                                                        ))}
                                                    </pre>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 border-dashed rounded-xl text-center flex-1 space-y-2">
                                            <Terminal size={32} className="text-slate-300 stroke-[1.5]" />
                                            <p className="text-slate-400 text-xs font-mono">No response body captured for this run</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'headers' && (
                                <div className="space-y-3">
                                    {selectedLog.responseHeaders && typeof selectedLog.responseHeaders === 'object' && Object.keys(selectedLog.responseHeaders).length > 0 ? (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead className="bg-slate-50/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                                    <tr>
                                                        <th className="px-4 py-2.5">Header Key</th>
                                                        <th className="px-4 py-2.5">Header Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                                                    {Object.entries(selectedLog.responseHeaders).map(([k, v]) => (
                                                        <tr key={k} className="hover:bg-slate-50/10">
                                                            <td className="px-4 py-2 font-semibold text-slate-500">{k}</td>
                                                            <td className="px-4 py-2 whitespace-normal break-all">{String(v)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 border-dashed rounded-xl text-center flex-1 space-y-2">
                                            <Clock size={32} className="text-slate-300 stroke-[1.5]" />
                                            <p className="text-slate-400 text-xs font-mono">No response headers captured for this run</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 p-4 bg-slate-50/30 flex justify-end shrink-0">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
