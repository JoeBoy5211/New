export const API_URL = import.meta.env.VITE_API_URL ?? 'https://catering-backend-ynqk.onrender.com/api';


const TOKEN_KEY = 'caterconnect_token';
const isDev = import.meta.env.DEV;

type RequestOptions = {
    method?: string;
    headers?: HeadersInit;
    body?: any;
};

// Helper function to get auth token
function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

// Helper function for conditional logging
const apiLog = {
    log: (...args: any[]) => {
        if (isDev) console.log('[API]', ...args);
    },
    error: (...args: any[]) => {
        if (isDev) console.error('[API]', ...args);
    },
};

export const api = {
    get: async (endpoint: string, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: 'GET' });
    },
    post: async (endpoint: string, body: any, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: 'POST', body });
    },
    put: async (endpoint: string, body: any, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: 'PUT', body });
    },
    patch: async (endpoint: string, body: any, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: 'PATCH', body });
    },
    delete: async (endpoint: string, options: RequestOptions = {}) => {
        return request(endpoint, { ...options, method: 'DELETE' });
    },
};

async function request(endpoint: string, options: RequestOptions) {
    const url = `${API_URL}${endpoint}`;
    const token = getAuthToken();
    
    const isFormData = options.body instanceof FormData;
    
    const headers: HeadersInit = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    // Add authentication token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method: options.method,
        headers,
        body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
    };

    apiLog.log('Request:', options.method, url);
    if (options.body) {
        apiLog.log('Body:', options.body);
    }

    try {
        const response = await fetch(url, config);
        apiLog.log('Response status:', response.status);

        const responseText = await response.text();
        const parseResponseBody = () => {
            if (!responseText) return {};
            try {
                return JSON.parse(responseText);
            } catch {
                return {};
            }
        };

        if (!response.ok) {
            const errorData = parseResponseBody();
            apiLog.error('Error response:', errorData);
            
            // Handle 401 Unauthorized - token might be invalid
            if (response.status === 401) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem('caterconnect_auth');
            }
            
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }

        const data = parseResponseBody();
        apiLog.log('Success response:', data);
        return data;
    } catch (error) {
        apiLog.error('Request Error:', error);
        throw error;
    }
}
