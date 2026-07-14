export interface Cookie {
    name: string;
    value: string;
    expires?: number; // expiry timestamp (ms)
    domain?: string;
    path?: string;
}

export class CookieJar {
    private cookies: Cookie[] = [];

    constructor(initialCookies?: Cookie[]) {
        if (initialCookies) {
            this.cookies = initialCookies;
        }
    }

    /**
     * Set cookies from a response header.
     * Can receive a single Set-Cookie string or an array of Set-Cookie strings.
     */
    setCookies(setCookieHeader: string | string[] | null, requestUrl: string) {
        if (!setCookieHeader) return;
        const headers = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
        const parsedUrl = new URL(requestUrl);

        for (const header of headers) {
            if (!header) continue;
            const parsed = this.parseCookie(header, parsedUrl.hostname);
            if (parsed) {
                this.addCookie(parsed);
            }
        }
    }

    /**
     * Get outgoing Cookie header string for a request URL.
     */
    getCookieString(requestUrl: string): string {
        const parsedUrl = new URL(requestUrl);
        const now = Date.now();

        // Filter expired and mismatched cookies
        const matched = this.cookies.filter(cookie => {
            // Expiration check
            if (cookie.expires && cookie.expires <= now) {
                return false;
            }

            // Domain check
            if (cookie.domain) {
                const domain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
                if (parsedUrl.hostname !== domain && !parsedUrl.hostname.endsWith('.' + domain)) {
                    return false;
                }
            }

            // Path check
            if (cookie.path) {
                if (!parsedUrl.pathname.startsWith(cookie.path)) {
                    return false;
                }
            }

            return true;
        });

        return matched.map(c => `${c.name}=${c.value}`).join('; ');
    }

    /**
     * Get list of all active cookies.
     */
    toJSON(): Cookie[] {
        const now = Date.now();
        // Return only unexpired cookies
        return this.cookies.filter(c => !c.expires || c.expires > now);
    }

    /**
     * Get earliest expiry timestamp for cache TTL setting (returns null if no expiring cookies).
     */
    getEarliestExpiry(): number | null {
        const now = Date.now();
        const expiring = this.cookies
            .filter(c => c.expires && c.expires > now)
            .map(c => c.expires!);
        
        return expiring.length > 0 ? Math.min(...expiring) : null;
    }

    private addCookie(newCookie: Cookie) {
        // Remove existing cookie with same name, domain, path to prevent duplicates
        this.cookies = this.cookies.filter(c => 
            !(c.name === newCookie.name && c.domain === newCookie.domain && c.path === newCookie.path)
        );

        // If it is expired or max-age is <= 0 (e.g. deletion command), do not add it
        const now = Date.now();
        if (newCookie.expires && newCookie.expires <= now) {
            return;
        }

        this.cookies.push(newCookie);
    }

    private parseCookie(cookieStr: string, requestHost: string): Cookie | null {
        const parts = cookieStr.split(';').map(p => p.trim());
        if (parts.length === 0 || !parts[0]) return null;

        // Parse key-value of the cookie itself
        const firstPart = parts[0];
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx === -1) return null;

        const name = firstPart.substring(0, eqIdx).trim();
        const value = firstPart.substring(eqIdx + 1).trim();
        if (!name) return null;

        const cookie: Cookie = { name, value };

        // Parse attributes
        for (let i = 1; i < parts.length; i++) {
            const attr = parts[i];
            const eq = attr.indexOf('=');
            
            let attrKey = attr.toLowerCase();
            let attrVal = '';
            
            if (eq !== -1) {
                attrKey = attr.substring(0, eq).trim().toLowerCase();
                attrVal = attr.substring(eq + 1).trim();
            }

            if (attrKey === 'expires') {
                const parsedDate = Date.parse(attrVal);
                if (!isNaN(parsedDate)) {
                    cookie.expires = parsedDate;
                }
            } else if (attrKey === 'max-age') {
                const maxAgeSec = parseInt(attrVal, 10);
                if (!isNaN(maxAgeSec)) {
                    cookie.expires = Date.now() + (maxAgeSec * 1000);
                }
            } else if (attrKey === 'domain') {
                cookie.domain = attrVal.toLowerCase();
            } else if (attrKey === 'path') {
                cookie.path = attrVal;
            }
        }

        // Default domain if not specified
        if (!cookie.domain) {
            cookie.domain = requestHost.toLowerCase();
        }

        return cookie;
    }
}
