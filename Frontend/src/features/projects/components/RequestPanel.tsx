import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Play, Save, Trash2, Terminal, Cookie, Clock, X, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { JSONCodeEditor } from '../../../shared/components/JSONCodeEditor';
import { useUpdateEndpoint, useTestEndpoint, useGetProjectCookies, useDeleteProjectCookie } from '../hooks/useProjects';
import { useCreateMonitor, useDeleteMonitor, useGetResponses } from '../../monitor/hooks/useMonitor';
import type { Endpoint, TestEndpointResponse } from '../types/project.types';
import { toast } from 'sonner';

interface RequestPanelProps {
    endpoint: Endpoint;
    projectId: string;
}

interface KeyValueItem {
    key: string;
    value: string;
    enabled: boolean;
}

export const RequestPanel: React.FC<RequestPanelProps> = ({ endpoint, projectId }) => {
    // Core states
    const [method, setMethod] = useState(endpoint.method);
    const [url, setUrl] = useState(endpoint.url);
    const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'auth' | 'body' | 'monitor' | 'settings'>('params');

    // Key-value editors states
    const [params, setParams] = useState<KeyValueItem[]>([]);
    const [headers, setHeaders] = useState<KeyValueItem[]>([]);

    // Auth states
    const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic' | 'apiKey' | 'cookie'>('none');
    const [authToken, setAuthToken] = useState('');
    const [authUsername, setAuthUsername] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authKey, setAuthKey] = useState('');
    const [authVal, setAuthVal] = useState('');
    const [authIn, setAuthIn] = useState<'header' | 'query'>('header');

    // Auto-login config states
    const [loginUrl, setLoginUrl] = useState('');
    const [loginMethod, setLoginMethod] = useState('POST');
    const [loginHeaders, setLoginHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
    const [loginBody, setLoginBody] = useState('');
    const [sslVerification, setSslVerification] = useState(true);

    const navigate = useNavigate();

    // Body state
    const [body, setBody] = useState(endpoint.body || '');
    const [bodyType, setBodyType] = useState<'none' | 'json' | 'text'>('none');

    const activeMonitor = endpoint.monitors?.[0];

    // Execution Response state
    const [testResult, setTestResult] = useState<TestEndpointResponse | null>(null);
    const [responseTab, setResponseTab] = useState<'body' | 'headers'>('body');
    const [isCookieModalOpen, setIsCookieModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleValue, setScheduleValue] = useState(5);
    const [scheduleUnit, setScheduleUnit] = useState<'minutes' | 'hours'>('minutes');

    // Hooks
    const queryClient = useQueryClient();
    const updateEndpointMutation = useUpdateEndpoint(projectId);
    const testEndpointMutation = useTestEndpoint();
    const createMonitorMutation = useCreateMonitor(projectId);
    const deleteMonitorMutation = useDeleteMonitor(projectId);
    const { data: dbResponses = [] } = useGetResponses(endpoint.id);
    const { data: cookies = [], refetch: refetchCookies } = useGetProjectCookies(projectId);
    const deleteCookieMutation = useDeleteProjectCookie(projectId);

    useEffect(() => {
        if (isCookieModalOpen) {
            refetchCookies();
        }
    }, [isCookieModalOpen, refetchCookies]);

    const isExecuting = updateEndpointMutation.isPending || testEndpointMutation.isPending;
    const latestDbResponse = dbResponses[0];
    const activeResponse = testResult || (latestDbResponse ? {
        statusCode: latestDbResponse.statusCode,
        responseTime: latestDbResponse.responseTime || 0,
        status: latestDbResponse.status,
        responseBody: latestDbResponse.responseBody || null,
        responseHeaders: latestDbResponse.responseHeaders as Record<string, string> | null,
        error: latestDbResponse.error
    } : null);

    // Init values on endpoint load
    useEffect(() => {
        setMethod(endpoint.method);
        setUrl(endpoint.url);
        setBody(endpoint.body || '');
        setTestResult(null);
        setSslVerification(endpoint.sslVerification !== false);

        // Auto-detect body type
        if (!endpoint.body) {
            setBodyType('none');
        } else {
            try {
                JSON.parse(endpoint.body);
                setBodyType('json');
            } catch {
                setBodyType('text');
            }
        }

        // Load Headers
        const initialHeaders: KeyValueItem[] = [];
        if (endpoint.headers && typeof endpoint.headers === 'object') {
            Object.entries(endpoint.headers).forEach(([key, value]) => {
                initialHeaders.push({ key, value: String(value), enabled: true });
            });
        }
        initialHeaders.push({ key: '', value: '', enabled: true }); // Empty row at bottom
        setHeaders(initialHeaders);

        // Load Query Params
        const initialParams: KeyValueItem[] = [];
        if (endpoint.queryParams && typeof endpoint.queryParams === 'object') {
            Object.entries(endpoint.queryParams).forEach(([key, value]) => {
                initialParams.push({ key, value: String(value), enabled: true });
            });
        }
        initialParams.push({ key: '', value: '', enabled: true }); // Empty row
        setParams(initialParams);

        // Load Auth
        if (endpoint.auth && typeof endpoint.auth === 'object') {
            const auth = endpoint.auth as any;
            setAuthType(auth.type || 'none');
            if (auth.type === 'bearer') setAuthToken(auth.token || '');
            if (auth.type === 'basic') {
                setAuthUsername(auth.username || '');
                setAuthPassword(auth.password || '');
            }
            if (auth.type === 'apiKey') {
                setAuthKey(auth.key || '');
                setAuthVal(auth.value || '');
                setAuthIn(auth.in || 'header');
            }
            if (auth.type === 'cookie') {
                const loginConfig = auth.loginConfig || {};
                setLoginUrl(loginConfig.url || '');
                setLoginMethod(loginConfig.method || 'POST');
                setLoginHeaders(loginConfig.headers ? JSON.stringify(loginConfig.headers, null, 2) : '{\n  "Content-Type": "application/json"\n}');
                setLoginBody(loginConfig.body || '');
            } else {
                setLoginUrl('');
                setLoginMethod('POST');
                setLoginHeaders('{\n  "Content-Type": "application/json"\n}');
                setLoginBody('');
            }
        } else {
            setAuthType('none');
            setLoginUrl('');
            setLoginMethod('POST');
            setLoginHeaders('{\n  "Content-Type": "application/json"\n}');
            setLoginBody('');
        }
    }, [endpoint.id]);

    // Handle URL Parsing to sync with Params table
    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl);
        try {
            const parsed = new URL(newUrl, newUrl.startsWith('http') ? undefined : 'http://dummy.com');
            const searchParamsList: KeyValueItem[] = [];
            parsed.searchParams.forEach((value, key) => {
                searchParamsList.push({ key, value, enabled: true });
            });
            
            // Keep the empty bottom row or append it
            searchParamsList.push({ key: '', value: '', enabled: true });
            setParams(searchParamsList);
        } catch {
            // URL is invalid / partial, don't update query params table yet
        }
    };

    // Reconstruct URL from Params table
    const syncParamsToUrl = (updatedParams: KeyValueItem[]) => {
        try {
            const activeParams = updatedParams.filter(p => p.enabled && p.key);
            const baseUrl = url.split('?')[0];
            if (activeParams.length === 0) {
                setUrl(baseUrl);
                return;
            }
            const queryStr = activeParams
                .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
                .join('&');
            setUrl(`${baseUrl}?${queryStr}`);
        } catch {
            // Reconstruct issue
        }
    };

    // Table edits handler
    const handleTableEdit = (
        type: 'params' | 'headers',
        index: number,
        field: 'key' | 'value' | 'enabled',
        val: string | boolean
    ) => {
        const list = type === 'params' ? [...params] : [...headers];
        const item = { ...list[index] };

        if (field === 'enabled') item.enabled = val as boolean;
        else item[field] = val as string;

        list[index] = item;

        // Auto-append empty row if editing the last row
        if (index === list.length - 1 && (item.key || item.value)) {
            list.push({ key: '', value: '', enabled: true });
        }

        if (type === 'params') {
            setParams(list);
            syncParamsToUrl(list);
        } else {
            setHeaders(list);
        }
    };

    // Table deletes handler
    const handleTableDelete = (type: 'params' | 'headers', index: number) => {
        const list = type === 'params' ? [...params] : [...headers];
        if (list.length <= 1) return; // Keep at least one empty row
        list.splice(index, 1);

        if (type === 'params') {
            setParams(list);
            syncParamsToUrl(list);
        } else {
            setHeaders(list);
        }
    };

    // Construct Payload for Save / Update
    const getPayload = () => {
        const headersRecord: Record<string, string> = {};
        headers.forEach(h => {
            if (h.enabled && h.key) headersRecord[h.key] = h.value;
        });

        const paramsRecord: Record<string, string> = {};
        params.forEach(p => {
            if (p.enabled && p.key) paramsRecord[p.key] = p.value;
        });

        let authPayload: any = null;
        if (authType === 'bearer' && authToken) {
            authPayload = { type: 'bearer', token: authToken };
        } else if (authType === 'basic' && authUsername) {
            authPayload = { type: 'basic', username: authUsername, password: authPassword };
        } else if (authType === 'apiKey' && authKey) {
            authPayload = { type: 'apiKey', key: authKey, value: authVal, in: authIn };
        } else if (authType === 'cookie') {
            let headersObj = {};
            try {
                headersObj = JSON.parse(loginHeaders);
            } catch {
                headersObj = { "Content-Type": "application/json" };
            }
            authPayload = {
                type: 'cookie',
                loginConfig: {
                    url: loginUrl,
                    method: loginMethod,
                    headers: headersObj,
                    body: loginBody
                }
            };
        } else if (authType === 'none') {
            authPayload = { type: 'none' };
        }

        return {
            method,
            url,
            body: bodyType === 'none' ? null : (body || null),
            headers: Object.keys(headersRecord).length > 0 ? headersRecord : null,
            queryParams: Object.keys(paramsRecord).length > 0 ? paramsRecord : null,
            auth: authPayload,
            sslVerification
        };
    };

    const handleSave = () => {
        const payload = getPayload();
        console.log("Saving endpoint configuration to backend scheduler:", payload);
        updateEndpointMutation.mutate({
            id: endpoint.id,
            data: payload
        });
    };

    const handleSend = () => {
        const payload = getPayload();
        console.log("Executing test run. Sending config update to backend first:", payload);
        // Send updates first to ensure worker has latest endpoint config
        updateEndpointMutation.mutate(
            { id: endpoint.id, data: payload },
            {
                onSuccess: () => {
                    console.log("Config saved. Firing test execution queue job for endpoint:", endpoint.id);
                    setTestResult(null);
                    testEndpointMutation.mutate(endpoint.id, {
                        onSuccess: (data) => {
                            console.log("Test execution completed. Response:", data);
                            setTestResult(data);
                            if (data?.cookiesRefreshed) {
                                toast.success("Session expired. Generated a new one successfully!");
                            }
                            queryClient.invalidateQueries({ queryKey: ['responses', endpoint.id] });
                        }
                    });
                }
            }
        );
    };

    const handleActivateMonitor = () => {
        const mins = scheduleUnit === 'hours' ? scheduleValue * 60 : scheduleValue;
        if (mins < 1 || mins > 1440) {
            toast.error("Interval must be between 1 minute and 24 hours (1440 minutes)");
            return;
        }
        createMonitorMutation.mutate({
            endpointId: endpoint.id,
            interval: mins
        }, {
            onSuccess: () => {
                setIsScheduleModalOpen(false);
            }
        });
    };

    const handleStopMonitor = () => {
        if (activeMonitor) {
            deleteMonitorMutation.mutate(activeMonitor.id);
        }
    };

    return (
        <div className="flex-1 lg:min-h-0 flex flex-col space-y-3 lg:overflow-hidden w-full animate-fade-in pb-2">
            {/* Top Method / URL Bar */}
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 items-stretch">
                <div className="flex flex-1 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-500 transition-all duration-200">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="https://api.example.com/endpoint"
                        className="flex-1 px-4 py-3 text-sm focus:outline-none placeholder:text-slate-400 font-semibold"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={handleSend}
                        disabled={testEndpointMutation.isPending || updateEndpointMutation.isPending}
                        className="flex-1 md:flex-none justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-md shadow-blue-100 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {testEndpointMutation.isPending ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <Play size={14} className="fill-current" />
                                <span>Send</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={updateEndpointMutation.isPending}
                        className="flex-1 md:flex-none justify-center px-5 py-3 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Save size={14} />
                        <span>Save</span>
                    </button>

                    <button
                        onClick={() => setIsCookieModalOpen(true)}
                        className="px-3 md:px-4 py-3 border border-slate-200 hover:border-slate-300 bg-white text-slate-600 rounded-xl text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                        title="Manage stored cookies"
                    >
                        <Cookie size={14} />
                        <span>Cookies</span>
                    </button>
                </div>
            </div>

            {/* Config Panel Tabs */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-auto lg:h-[280px] shrink-0">
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 shrink-0 overflow-x-auto scrollbar-thin">
                    {(['params', 'headers', 'auth', 'body', 'settings'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-0">
                    {/* Tab 1: Params */}
                    {activeTab === 'params' && (
                        <KeyValueTable 
                            items={params}
                            type="params"
                            onEdit={handleTableEdit}
                            onDelete={handleTableDelete}
                        />
                    )}

                    {/* Tab 2: Headers */}
                    {activeTab === 'headers' && (
                        <KeyValueTable 
                            items={headers}
                            type="headers"
                            onEdit={handleTableEdit}
                            onDelete={handleTableDelete}
                        />
                    )}

                    {activeTab === 'auth' && (
                        <div className="space-y-4 w-full">
                            <div className="flex flex-col md:flex-row md:items-end gap-4 w-full">
                                <div className="space-y-1 w-full md:w-[35%] shrink-0">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Auth Type</label>
                                    <select
                                        value={authType}
                                        onChange={(e) => setAuthType(e.target.value as any)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-semibold cursor-pointer text-slate-700 bg-white"
                                    >
                                        <option value="none">No Auth</option>
                                        <option value="bearer">Bearer Token</option>
                                        <option value="basic">Basic Auth</option>
                                        <option value="apiKey">API Key</option>
                                        <option value="cookie">Cookie-Based Auth (Session)</option>
                                    </select>
                                </div>

                                {authType === 'cookie' && (
                                    <div className="space-y-1 flex-1 animate-fade-in">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Login URL</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={loginMethod}
                                                onChange={(e) => setLoginMethod(e.target.value)}
                                                className="px-2 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                                            >
                                                <option value="POST">POST</option>
                                                <option value="GET">GET</option>
                                                <option value="PUT">PUT</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={loginUrl}
                                                onChange={(e) => setLoginUrl(e.target.value)}
                                                placeholder="https://api.example.com/auth/login"
                                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {authType === 'bearer' && (
                                <div className="space-y-1 max-w-md animate-fade-in">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Token</label>
                                    <input
                                        type="text"
                                        value={authToken}
                                        onChange={(e) => setAuthToken(e.target.value)}
                                        placeholder="Paste Token here"
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                            )}

                            {authType === 'basic' && (
                                <div className="grid grid-cols-2 gap-4 max-w-xl animate-fade-in text-slate-700">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Username</label>
                                        <input
                                            type="text"
                                            value={authUsername}
                                            onChange={(e) => setAuthUsername(e.target.value)}
                                            placeholder="Username"
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Password</label>
                                        <input
                                            type="password"
                                            value={authPassword}
                                            onChange={(e) => setAuthPassword(e.target.value)}
                                            placeholder="Password"
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {authType === 'cookie' && (
                                <div className="space-y-1.5 w-full border-t border-slate-100 pt-3 animate-fade-in text-slate-700">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Login Body (JSON)</label>
                                    <JSONCodeEditor
                                        value={loginBody}
                                        onChange={setLoginBody}
                                        placeholder=""
                                        rows={4}
                                    />
                                </div>
                            )}

                            {authType === 'apiKey' && (
                                <div className="grid grid-cols-3 gap-3 max-w-2xl animate-fade-in text-slate-700">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Key</label>
                                        <input
                                            type="text"
                                            value={authKey}
                                            onChange={(e) => setAuthKey(e.target.value)}
                                            placeholder="X-API-Key"
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Value</label>
                                        <input
                                            type="text"
                                            value={authVal}
                                            onChange={(e) => setAuthVal(e.target.value)}
                                            placeholder="Key value"
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Add To</label>
                                        <select
                                            value={authIn}
                                            onChange={(e) => setAuthIn(e.target.value as any)}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                                        >
                                            <option value="header">Header</option>
                                            <option value="query">Query Params</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Body */}
                    {activeTab === 'body' && (
                        <div className="space-y-4 h-full flex flex-col min-h-[180px]">
                            {/* Body Type Selector Radio Row */}
                            <div className="flex items-center space-x-5 border-b border-slate-100 pb-3 shrink-0">
                                {(['none', 'json', 'text'] as const).map(type => (
                                    <label key={type} className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors select-none">
                                        <input
                                            type="radio"
                                            name="bodyType"
                                            checked={bodyType === type}
                                            onChange={() => {
                                                setBodyType(type);
                                                if (type === 'json' && !body) {
                                                    setBody('');
                                                } else if (type === 'none') {
                                                    setBody('');
                                                }
                                            }}
                                            className="cursor-pointer h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-slate-300"
                                        />
                                        <span className="capitalize">
                                            {type === 'none' ? 'None' : type === 'json' ? 'JSON (raw)' : 'Text (raw)'}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Conditional Editor Render */}
                            <div className="flex-1 min-h-0 flex flex-col justify-stretch">
                                {bodyType === 'none' && (
                                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl text-center flex-1 space-y-2">
                                        <Terminal size={32} className="text-slate-300 stroke-[1.5]" />
                                        <p className="text-slate-400 text-xs font-mono">This request does not send a body payload</p>
                                    </div>
                                )}

                                {bodyType === 'json' && (
                                    <JSONCodeEditor 
                                        value={body}
                                        onChange={setBody}
                                        placeholder=""
                                        rows={6}
                                    />
                                )}

                                {bodyType === 'text' && (
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Enter plain text payload..."
                                        rows={6}
                                        className="w-full p-4 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-slate-50/50 min-h-[140px] resize-none"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab 5: Settings */}
                    {activeTab === 'settings' && (
                        <div className="space-y-4 max-w-xl animate-fade-in text-slate-700">
                            <div className="flex items-start space-x-3 bg-slate-50/50 p-4 border border-slate-200/60 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="sslVerification"
                                    checked={sslVerification}
                                    onChange={(e) => setSslVerification(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <div className="space-y-0.5 select-none">
                                    <label htmlFor="sslVerification" className="text-xs font-bold text-slate-700 cursor-pointer">
                                        Enable SSL Certificate Verification
                                    </label>
                                    <p className="text-[11px] text-slate-400 leading-normal">
                                        Validate target server SSL/TLS certificates. Uncheck this to ignore certificate errors for self-signed certificates in local (e.g. host.docker.internal) or staging environments.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Test Execution Output Panel (Postman Response Viewer) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex-1 lg:min-h-0 flex flex-col min-h-[300px]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-2.5 shrink-0">
                    <div className="flex items-center space-x-6">
                        <span className="text-sm font-extrabold text-slate-800 tracking-tight">Response</span>
                        {activeResponse && !isExecuting && (
                            <div className="flex border-l border-slate-200 pl-4 space-x-3">
                                {(['body', 'headers'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setResponseTab(tab)}
                                        className={`py-1 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                                            responseTab === tab
                                                ? 'border-blue-600 text-blue-600'
                                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {activeResponse && !isExecuting && (
                            <div className="flex items-center space-x-4 text-xs font-bold shrink-0">
                                <div className="flex items-center space-x-1.5">
                                    <span className="text-slate-400 uppercase font-mono">Status:</span>
                                    <span className={`px-2 py-0.5 rounded ${
                                        activeResponse.status === 'UP' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                        {activeResponse.statusCode || 'ERROR'}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                    <span className="text-slate-400 uppercase font-mono">Time:</span>
                                    <span className="text-slate-700">{activeResponse.responseTime} ms</span>
                                </div>
                            </div>
                        )}

                        {activeMonitor ? (
                            <button
                                onClick={() => navigate(`/monitors/${endpoint.id}`)}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
                            >
                                <Activity size={12} className="stroke-[2.5]" />
                                <span>Monitor Logs</span>
                            </button>
                        ) : (
                            <button
                                disabled={activeResponse?.statusCode === 401}
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1 transition-all cursor-pointer shadow-sm"
                                title={activeResponse?.statusCode === 401 ? "Cannot schedule: Last test returned 401 Unauthorized" : "Configure uptime check schedule"}
                            >
                                <Clock size={12} className="stroke-[2.5]" />
                                <span>Schedule</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col justify-stretch">
                    {isExecuting ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 space-y-3 text-slate-400 text-center select-none flex-1">
                            <span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-slate-500">Executing request...</p>
                                <p className="text-xs">Running live check via background workers.</p>
                            </div>
                        </div>
                    ) : activeResponse ? (
                        <>
                            {responseTab === 'body' && (
                                <div className="flex flex-col h-full min-h-0 flex-1">
                                    {(() => {
                                        const formatted = formatJSON(activeResponse.responseBody || (activeResponse.error ? `Error: ${activeResponse.error}` : ''));
                                        const lines = formatted.split('\n');
                                        return (
                                            <div className="flex font-mono text-xs border border-slate-200/80 rounded-xl overflow-hidden min-h-0 flex-1 bg-white">
                                                {/* Code Content */}
                                                <pre className="p-4 text-slate-700 overflow-x-auto flex-1 whitespace-pre min-h-0 scrollbar-thin">
                                                    {lines.map((line, i) => (
                                                        <div key={i} dangerouslySetInnerHTML={{ __html: highlightJSONLine(line) }} />
                                                    ))}
                                                </pre>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {responseTab === 'headers' && (
                                <div className="space-y-4">
                                    {activeResponse.responseHeaders && Object.keys(activeResponse.responseHeaders).length > 0 ? (
                                        <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                                            <table className="w-full text-left text-xs font-medium text-slate-600 bg-white">
                                                <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-4 py-2.5">Header Name</th>
                                                        <th className="px-4 py-2.5">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {Object.entries(activeResponse.responseHeaders).map(([key, value]) => (
                                                        <tr key={key}>
                                                            <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{key}</td>
                                                            <td className="px-4 py-2.5 font-mono break-all">{value}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic text-center py-6">No response headers</p>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-10 space-y-3 text-slate-400 text-center select-none flex-1">
                            <Terminal size={28} className="stroke-[1.5]" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-bold text-slate-500">No response received</p>
                                <p className="text-xs max-w-[200px]">Click the Send button above to execute this request live.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cookies Management Modal */}
            {isCookieModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-xl relative flex flex-col max-h-[80vh] space-y-4">
                        <button
                            onClick={() => setIsCookieModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex justify-between items-center pr-8">
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Active Cookies</h3>
                                <p className="text-slate-400 text-xs mt-0.5">Stored HTTP sessions for this project workspace</p>
                            </div>
                            {cookies.length > 0 && (
                                <button
                                    onClick={() => deleteCookieMutation.mutate(undefined)}
                                    disabled={deleteCookieMutation.isPending}
                                    className="px-3 py-1.5 border border-red-200 hover:border-red-300 text-red-600 rounded-xl text-xs font-bold bg-red-50/50 hover:bg-red-50 cursor-pointer transition-all disabled:opacity-50"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                            {cookies.length > 0 ? (
                                cookies.map(cookie => (
                                    <div key={cookie.name} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/20 bg-white animate-fade-in">
                                        <div className="space-y-0.5 pr-4 break-all">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-bold text-xs text-slate-800 font-mono">{cookie.name}</span>
                                                {cookie.domain && (
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-mono font-medium">
                                                        {cookie.domain}
                                                     </span>
                                                 )}
                                             </div>
                                             <div className="text-xs text-slate-500 font-mono truncate max-w-sm" title={cookie.value}>
                                                 {cookie.value}
                                             </div>
                                         </div>
                                         <button
                                             onClick={() => deleteCookieMutation.mutate(cookie.name)}
                                             disabled={deleteCookieMutation.isPending}
                                             className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0"
                                             title="Delete cookie"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                     </div>
                                 ))
                             ) : (
                                 <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
                                     <Cookie size={28} className="stroke-[1.5]" />
                                     <div className="space-y-0.5">
                                         <p className="text-sm font-bold text-slate-500">No cookies stored</p>
                                         <p className="text-xs max-w-[280px]">Set-Cookie headers from target server responses automatically compile here.</p>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            )}

            {/* Scheduling Configuration Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative space-y-4">
                        <button
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <div>
                            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Configure check schedule</h3>
                            <p className="text-slate-400 text-xs mt-0.5">Select the check frequency for background pings</p>
                        </div>

                        {activeMonitor ? (
                            <div className="p-5 border border-emerald-100 bg-emerald-50/30 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Status</span>
                                        <div className="flex items-center space-x-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-sm font-bold text-emerald-800">Monitoring Active</span>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5 text-right">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Frequency</span>
                                        <p className="text-sm font-bold text-slate-700">Every {activeMonitor.interval} min</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        handleStopMonitor();
                                        setIsScheduleModalOpen(false);
                                    }}
                                    disabled={deleteMonitorMutation.isPending}
                                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                                >
                                    {deleteMonitorMutation.isPending ? (
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <span>Disable Uptime Schedule</span>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleActivateMonitor();
                                }}
                                className="space-y-4"
                            >
                                {authType === 'cookie' && (
                                    <div className="p-3.5 bg-amber-50 border border-amber-250 text-amber-900 rounded-xl text-xs space-y-1">
                                        <p className="font-bold flex items-center space-x-1">
                                            <span>⚠️ Cookie Session Warning</span>
                                        </p>
                                        <p className="leading-relaxed text-[11px] text-amber-800">
                                            This background monitor uses the active session cookies stored in PingDeck at this moment. The monitor will stop working when these cookies expire. To prevent checks from failing, configure <strong>Auto-Login Credentials</strong> in your Auth tab to handle self-healing refreshes.
                                        </p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                                        Ping Interval
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={scheduleUnit === 'hours' ? 24 : 1440}
                                            required
                                            value={scheduleValue}
                                            onChange={(e) => setScheduleValue(parseInt(e.target.value, 10) || 1)}
                                            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-semibold"
                                        />
                                        <select
                                            value={scheduleUnit}
                                            onChange={(e) => setScheduleUnit(e.target.value as any)}
                                            className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                                        >
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={createMonitorMutation.isPending}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm disabled:opacity-50"
                                >
                                    {createMonitorMutation.isPending ? (
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                        <span>Enable Uptime Schedule</span>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Internal Key-Value Table Component
interface KeyValueTableProps {
    items: KeyValueItem[];
    type: 'params' | 'headers';
    onEdit: (type: 'params' | 'headers', index: number, field: 'key' | 'value' | 'enabled', val: string | boolean) => void;
    onDelete: (type: 'params' | 'headers', index: number) => void;
}

const KeyValueTable: React.FC<KeyValueTableProps> = ({ items, type, onEdit, onDelete }) => {
    return (
        <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <tr>
                        <th className="w-12 text-center py-3"></th>
                        <th className="px-4 py-3">Key</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="w-12 py-3"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/20 group">
                            <td className="py-2.5 text-center">
                                <input
                                    type="checkbox"
                                    checked={item.enabled}
                                    onChange={(e) => onEdit(type, index, 'enabled', e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                            </td>
                            <td className="px-2 py-2.5">
                                <input
                                    type="text"
                                    value={item.key}
                                    onChange={(e) => onEdit(type, index, 'key', e.target.value)}
                                    placeholder="Key"
                                    className="w-full px-2 py-1.5 focus:outline-none focus:bg-slate-50 rounded font-semibold text-slate-800"
                                />
                            </td>
                            <td className="px-2 py-2.5">
                                <input
                                    type="text"
                                    value={item.value}
                                    onChange={(e) => onEdit(type, index, 'value', e.target.value)}
                                    placeholder="Value"
                                    className="w-full px-2 py-1.5 focus:outline-none focus:bg-slate-50 rounded text-slate-600"
                                />
                            </td>
                            <td className="py-2.5 text-center">
                                {index !== items.length - 1 && (
                                    <button
                                        onClick={() => onDelete(type, index)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                        title="Delete row"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// JSON Formatting Helpers
const highlightJSONLine = (line: string): string => {
    let escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Key match: "key":
    escaped = escaped.replace(/(".*?")\s*:/g, '<span class="text-amber-600 font-semibold">$1</span>:');
    
    // String value match: : "value"
    escaped = escaped.replace(/:\s*(".*?")/g, ': <span class="text-blue-600">$1</span>');
    
    // Boolean/Number/Null match:
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
