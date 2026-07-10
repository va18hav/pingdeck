export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
}

export interface Endpoint {
    id: string;
    name: string;
    url: string;
    method: string;
    interval: number;
    status: string; // 'UP' | 'DOWN' | 'PENDING'
    projectId: string;
    createdAt: string;
}

export interface MonitorResponse {
    id: string;
    endpointId: string;
    statusCode: number | null;
    responseTime: number | null;
    status: 'UP' | 'DOWN';
    error: string | null;
    createdAt: string;
}

export interface MonitorStats {
    totalProjects: number;
    totalEndpoints: number;
    uptimePercentage: number;
    totalAlerts: number;
}
