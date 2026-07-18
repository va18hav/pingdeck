import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useCreateFolder } from '../hooks/useFolders';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    parentId?: string | null;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, projectId, parentId }) => {
    const [name, setName] = useState('');
    const [, setSearchParams] = useSearchParams();

    const createFolderMutation = useCreateFolder(projectId, (data) => {
        setName('');
        setSearchParams({ folderId: data.id });
        onClose();
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        createFolderMutation.mutate({ name, projectId, parentId });
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-8 shadow-xl space-y-6 relative animate-scale-up">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                    <X size={20} />
                </button>

                <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Create New Folder</h3>
                    <p className="text-slate-400 text-xs mt-1">Organize endpoints into sub-sections</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Authentication"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={createFolderMutation.isPending}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
                    >
                        {createFolderMutation.isPending ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <span>Create Folder</span>
                        )}
                    </button>
                </form>
            </div>
        </div>,
        document.body
    );
};
