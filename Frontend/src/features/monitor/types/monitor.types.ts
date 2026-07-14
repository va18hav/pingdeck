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
    responseBody?: string | null;
    responseHeaders?: any | null;
    error: string | null;
    createdAt: string;
}
