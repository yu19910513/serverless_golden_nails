import axios from 'axios';

/**
 * @description A pre-configured Axios instance for all API communications.
 * Includes a base URL ('/api') and default JSON content-type.
 * @type {import('axios').AxiosInstance}
 */
const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * @description Request interceptor to automatically attach the JWT
 * token (from localStorage) to the Authorization header of every outgoing request.
 * @param {import('axios').InternalAxiosRequestConfig} config The outgoing request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} The modified config.
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * @description Response interceptor to log all successful responses
 * and errors for debugging purposes.
 * @param {import('axios').AxiosResponse} response The successful API response.
 * @returns {import('axios').AxiosResponse} The unmodified response.
 */
apiClient.interceptors.response.use(
    (response) => {
        console.log('API Response:', response);
        return response;
    },
    (error) => {
        console.error('API Error:', error.response || error.message);
        return Promise.reject(error);
    }
);

/**
 * @description A base service class that provides a shared and pre-configured Axios client.
 * Services should extend this class to inherit the `http` instance.
 */
class Service {
    /**
     * The configured Axios instance for making HTTP requests.
     * @type {import('axios').AxiosInstance}
     */
    http = apiClient;
}

export default Service;
