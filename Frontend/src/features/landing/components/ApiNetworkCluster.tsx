import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface EndpointNode {
    id: string;
    name: string;
    x: number;
    y: number;
    branchY: number;
    latencyMs: number;
    code: string;
    latency: string;
    status: 'healthy' | 'down';
}

// Top Source Node (PingDeck Engine)
const PINGDECK_TOP = { x: 270, y: 35 };

// Spacious 2x2 layout for 4 API Endpoints
const ENDPOINTS: EndpointNode[] = [
    // Level 1 (Y = 145)
    { id: 'db', name: 'db.internal.io', x: 110, y: 145, branchY: 95, latencyMs: 28, code: '200 OK', latency: '28ms', status: 'healthy' },
    { id: 'auth', name: 'auth.service.com', x: 430, y: 145, branchY: 95, latencyMs: 42, code: '200 OK', latency: '42ms', status: 'healthy' },
    // Level 2 (Y = 245)
    { id: 'billing', name: 'billing.v1.net', x: 110, y: 245, branchY: 195, latencyMs: 35, code: '200 OK', latency: '35ms', status: 'healthy' },
    { id: 'gateway', name: 'gateway.acme.org', x: 430, y: 245, branchY: 195, latencyMs: 10023, code: '504 DOWN', latency: '10,023ms', status: 'down' },
];

// Alert Box Node directly below DOWN Endpoint (gateway at X=430, Y=245)
const ALERT_NODE = { id: 'alert', name: 'Alert Dispatch', x: 430, y: 340, code: 'Email Sent' };

// Helper to calculate dot position along 90-degree path: (270,35) -> (270,branchY) -> (targetX,branchY) -> (targetX,targetY)
function getOrthogonalPos(targetX: number, targetY: number, branchY: number, progress: number) {
    const seg1 = Math.abs(branchY - 35);
    const seg2 = Math.abs(targetX - 270);
    const seg3 = Math.abs(targetY - branchY);
    const total = seg1 + seg2 + seg3;

    const dist = progress * total;
    if (dist <= seg1) {
        return { x: 270, y: 35 + dist };
    } else if (dist <= seg1 + seg2) {
        const d2 = dist - seg1;
        const dir = targetX > 270 ? 1 : -1;
        return { x: 270 + d2 * dir, y: branchY };
    } else {
        const d3 = dist - seg1 - seg2;
        return { x: targetX, y: branchY + d3 };
    }
}

export const ApiNetworkCluster: React.FC = () => {
    // Stage:
    // 0: Slower Pinging outward along 90-degree paths (0ms to 3200ms)
    // 1: Latency-staggered green & red responses (3200ms to 4800ms)
    // 2: Red alert line unfolds & red dot travels down (4800ms to 7400ms)
    // 3: Red dot arrives -> Alert Box pops 100% & STOPS permanently (7400ms+)
    const [stage, setStage] = useState<number>(0);
    const [pingProgress, setPingProgress] = useState<number>(0);
    const [alertProgress, setAlertProgress] = useState<number>(0);
    const [activeStatuses, setActiveStatuses] = useState<Record<string, boolean>>({});

    const animFrameRef = useRef<number | null>(null);

    useEffect(() => {
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            // Phase 0: Ping Outward along right-angle paths (0ms to 2800ms)
            if (elapsed < 2800) {
                setStage(0);
                setPingProgress(elapsed / 2800);
                setActiveStatuses({});
            }
            // Phase 1: Latency-staggered response reveals (2800ms to 4200ms)
            else if (elapsed < 4200) {
                setStage(1);
                setPingProgress(1);

                const staggerElapsed = elapsed - 2800;
                const active: Record<string, boolean> = {};

                if (staggerElapsed >= 100) active['db'] = true;       // 28ms (1st)
                if (staggerElapsed >= 500) active['billing'] = true;  // 35ms (2nd)
                if (staggerElapsed >= 900) active['auth'] = true;     // 42ms (3rd)

                setActiveStatuses(active);
            }
            // Phase 2: DOWN node turns RED & Rapid red alert dot travels down (4200ms to 4900ms = 700ms fast travel!)
            else if (elapsed < 4900) {
                setStage(2);
                setPingProgress(1);
                setActiveStatuses({ db: true, billing: true, auth: true, gateway: true });

                const alertElapsed = elapsed - 4200;
                setAlertProgress(Math.min(1, alertElapsed / 700));
            }
            // Phase 3: Red dot arrives at Alert Box -> Alert Box pops & STOP PERMANENTLY
            else {
                setStage(3);
                setPingProgress(1);
                setAlertProgress(1);
                setActiveStatuses({ db: true, billing: true, auth: true, gateway: true });
                return; // STOP ANIMATION LOOP COMPLETELY
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    const downNode = ENDPOINTS[3]; // gateway.acme.org (X=430, Y=245)
    // Starting Y for unfolding alert line (just below DOWN node card)
    const alertStartY = downNode.y + 24; // 245 + 24 = 269
    // Destination Y for unfolding alert line (just above Alert Box card)
    const alertEndY = ALERT_NODE.y - 24; // 340 - 24 = 316
    // Current Y of unfolding alert line tip
    const currentAlertY = alertStartY + (alertEndY - alertStartY) * alertProgress;

    return (
        <div className="relative w-full h-[410px] select-none overflow-visible">
            {/* SVG Canvas for 90-Degree Paths & Unfolding Red Alert Line */}
            <svg viewBox="0 0 540 410" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="blueLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.3" />
                    </linearGradient>
                    <linearGradient id="redLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.9" />
                    </linearGradient>
                </defs>

                {/* 90-Degree Connection Paths for 4 Endpoints */}
                {ENDPOINTS.map((ep) => {
                    const dPath = `M ${PINGDECK_TOP.x} ${PINGDECK_TOP.y} L ${PINGDECK_TOP.x} ${ep.branchY} L ${ep.x} ${ep.branchY} L ${ep.x} ${ep.y}`;
                    const isDownRed = ep.status === 'down' && activeStatuses[ep.id];
                    const pos = getOrthogonalPos(ep.x, ep.y, ep.branchY, pingProgress);

                    return (
                        <g key={`path-${ep.id}`}>
                            <path
                                d={dPath}
                                fill="none"
                                stroke={isDownRed ? 'url(#redLineGrad)' : 'url(#blueLineGrad)'}
                                strokeWidth="2"
                                strokeDasharray="4 4"
                            />

                            {/* Slower Moving Blue Ping Dot along Right-Angle Path */}
                            {stage === 0 && (
                                <g>
                                    <circle cx={pos.x} cy={pos.y} r="6" fill="#2563eb" opacity="0.35" />
                                    <circle cx={pos.x} cy={pos.y} r="4" fill="#3b82f6" />
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Bright Solid Red Dashed Line that Unfolds Downward as Red Dot Travels */}
                {stage >= 2 && (
                    <g>
                        <line
                            x1={downNode.x}
                            y1={alertStartY}
                            x2={downNode.x}
                            y2={currentAlertY}
                            stroke="#f43f5e"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                        />
                        {/* Moving Red Alert Dot at the Tip of the Unfolding Line */}
                        <circle cx={downNode.x} cy={currentAlertY} r="7" fill="#ef4444" opacity="0.4" />
                        <circle cx={downNode.x} cy={currentAlertY} r="4.5" fill="#f43f5e" />
                    </g>
                )}

                {/* Top Node: PingDeck Logo */}
                <g transform={`translate(${PINGDECK_TOP.x}, ${PINGDECK_TOP.y})`}>
                    <circle r="22" fill="white" stroke="#e2e8f0" strokeWidth="1.5" className="shadow-xs" />
                    <foreignObject x="-20" y="-20" width="40" height="40">
                        <div className="flex items-center justify-center w-full h-full">
                            <img src="/logo.png" alt="PingDeck" className="w-10 h-10 object-contain select-none" />
                        </div>
                    </foreignObject>
                </g>
            </svg>

            {/* Spacious 2x2 API Endpoint Cards */}
            {ENDPOINTS.map((ep) => {
                const isRevealed = activeStatuses[ep.id];
                const isDown = ep.status === 'down' && isRevealed;
                const isHealthy = ep.status === 'healthy' && isRevealed;

                return (
                    <div
                        key={ep.id}
                        style={{
                            left: `${(ep.x / 540) * 100}%`,
                            top: `${(ep.y / 410) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute px-3 py-1.5 rounded-xl border text-xs font-mono transition-all duration-300 shadow-sm ${isDown
                                ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-rose-100 scale-105'
                                : isHealthy
                                    ? 'bg-white border-emerald-300 text-slate-800 shadow-emerald-50'
                                    : 'bg-white border-slate-200 text-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                            {isDown ? (
                                <AlertTriangle size={12} className="text-rose-600 shrink-0 animate-pulse" />
                            ) : isHealthy ? (
                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                            <span className="truncate max-w-[115px]">{ep.name}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-0.5 text-[10px] text-slate-400">
                            <span>{isRevealed ? ep.code : 'checking...'}</span>
                            <span className={`font-semibold ${isDown ? 'text-rose-600' : isHealthy ? 'text-slate-600' : ''}`}>
                                {isRevealed ? ep.latency : '---'}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Alert Dispatch Box — Positioned closely below DOWN node (gap reduced) */}
            {/* 100% INVISIBLE (opacity-0 scale-90) until Stage 3 after the red dot arrives */}
            <div
                style={{
                    left: `${(ALERT_NODE.x / 540) * 100}%`,
                    top: `${(ALERT_NODE.y / 410) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                }}
                className={`absolute px-3.5 py-2 rounded-xl border text-xs font-mono transition-all duration-500 shadow-md ${stage === 3
                        ? 'opacity-100 scale-100 bg-slate-900 border-slate-800 text-white shadow-rose-950/20'
                        : 'opacity-0 scale-90 pointer-events-none'
                    }`}
            >
                <div className="flex items-center gap-2 font-bold text-[11px]">
                    <div className="w-4 h-4 rounded flex items-center justify-center bg-rose-500/20 text-rose-400">
                        <ShieldAlert size={12} />
                    </div>
                    <span>{ALERT_NODE.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1 text-[10px]">
                    <span className="text-rose-400 font-semibold">Outage Alert</span>
                    <span className="text-slate-300 font-semibold">{ALERT_NODE.code}</span>
                </div>
            </div>
        </div>
    );
};
