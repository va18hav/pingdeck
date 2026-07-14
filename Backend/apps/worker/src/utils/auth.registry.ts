export interface AuthConfig {
    type: 'none' | 'bearer' | 'basic' | 'apiKey';
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    in?: 'header' | 'query';
}

export interface RequestOptions {
    headers: Record<string, string>;
    url: string;
}

export type AuthHandler = (options: RequestOptions, config: AuthConfig) => void;

export const authRegistry: Record<string, AuthHandler> = {
    bearer: (options, config) => {
        if (config.token) {
            options.headers['Authorization'] = `Bearer ${config.token}`;
        }
    },
    basic: (options, config) => {
        if (config.username) {
            const pwd = config.password || '';
            const encoded = Buffer.from(`${config.username}:${pwd}`).toString('base64');
            options.headers['Authorization'] = `Basic ${encoded}`;
        }
    },
    apiKey: (options, config) => {
        if (config.key && config.value) {
            if (config.in === 'query') {
                try {
                    const parsedUrl = new URL(options.url);
                    parsedUrl.searchParams.append(config.key, config.value);
                    options.url = parsedUrl.toString();
                } catch {
                    // Fallback in case URL parsing fails
                }
            } else {
                options.headers[config.key] = config.value;
            }
        }
    },
    none: () => {}
};

/**
 * Apply the registered authentication strategy to request options.
 */
export const applyAuth = (options: RequestOptions, config: any) => {
    if (!config || typeof config !== 'object' || !config.type) return;
    const handler = authRegistry[config.type];
    if (handler) {
        handler(options, config as AuthConfig);
    }
};
