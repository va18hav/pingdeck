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
    folderId?: string | null;
    headers?: Record<string, string> | null;
    body?: string | null;
    queryParams?: Record<string, string> | null;
    auth?: any | null;
    monitors?: Array<{ id: string; interval: number; status: string }>;
    sslVerification?: boolean;
    createdAt: string;
}

export interface TestEndpointResponse {
    statusCode: number | null;
    responseTime: number;
    status: 'UP' | 'DOWN';
    responseBody: string | null;
    responseHeaders: Record<string, string> | null;
    error: string | null;
    cookiesRefreshed?: boolean;
}
