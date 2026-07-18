import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { useCreateEndpoint } from '../hooks/useProjects';

interface CreateEndpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    folderId?: string | null;
}

export const CreateEndpointModal: React.FC<CreateEndpointModalProps> = ({ isOpen, onClose, projectId, folderId }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('https://api.example.com');
    const [method, setMethod] = useState('GET');
    const [, setSearchParams] = useSearchParams();

    const createEndpointMutation = useCreateEndpoint(projectId, (data) => {
        setName('');
        setUrl('https://api.example.com');
        setMethod('GET');
        setSearchParams({ endpointId: data.id });
        onClose();
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !url) return;
        createEndpointMutation.mutate({
            name,
            url,
            method,
            projectId,
            folderId: folderId ?? undefined
        });
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-8 shadow-xl space-y-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                    <X size={20} />
                </button>

                <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Request</h3>
                    <p className="text-slate-400 text-xs mt-1">Add a new API request to your project workspace</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            Request Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Get User Profile"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                Method
                            </label>
                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                className="w-full px-3 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-bold text-slate-700 cursor-pointer"
                            >
                                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1 col-span-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                Target URL
                            </label>
                            <input
                                type="url"
                                required
                                placeholder="https://api.example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-semibold"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={createEndpointMutation.isPending}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-6 shadow-sm"
                    >
                        {createEndpointMutation.isPending ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Plus size={18} />
                                <span>Create Request</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};
