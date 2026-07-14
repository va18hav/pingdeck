export const buildUrlWithParams = (baseUrl: string, queryParams?: any): string => {
    if (!queryParams || typeof queryParams !== 'object') return baseUrl;
    try {
        const url = new URL(baseUrl);
        Object.entries(queryParams).forEach(([key, value]) => {
            if (typeof value === 'string') {
                url.searchParams.append(key, value);
            }
        });
        return url.toString();
    } catch {
        return baseUrl;
    }
};

export const buildHeaders = (customHeaders?: any, auth?: any, body?: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
        'User-Agent': 'PingLoop-Worker/1.0',
        'Accept': '*/*'
    };

    if (customHeaders && typeof customHeaders === 'object') {
        Object.entries(customHeaders).forEach(([key, value]) => {
            if (typeof value === 'string') {
                headers[key] = value;
            }
        });
    }

    const hasContentType = Object.keys(headers).some(k => k.toLowerCase() === 'content-type');
    if (body && !hasContentType) {
        headers['Content-Type'] = 'application/json';
    }

    if (auth && typeof auth === 'object') {
        if (auth.type === 'bearer' && auth.token) {
            headers['Authorization'] = `Bearer ${auth.token}`;
        } else if (auth.type === 'basic' && auth.username && auth.password) {
            const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            headers['Authorization'] = `Basic ${encoded}`;
        } else if (auth.type === 'apiKey' && auth.in === 'header' && auth.key && auth.value) {
            headers[auth.key] = auth.value;
        }
    }

    return headers;
};

export const parseResponseHeaders = (headers: Headers): Record<string, string> => {
    const parsed: Record<string, string> = {};
    headers.forEach((value, key) => {
        parsed[key] = value;
    });
    return parsed;
};
