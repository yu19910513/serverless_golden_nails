import axios from 'axios';

/**
 * Creates a pre-configured Axios instance for all API communications.
 * This instance is created only once when the module is loaded, improving efficiency.
 *
 * It is configured with:
 * - A `baseURL` of '/api', so all requests are automatically sent to your serverless functions.
 * - A request interceptor that dynamically attaches the JWT token from localStorage
 * to the `Authorization` header of every outgoing request.
 */
const apiClient = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// The request interceptor adds the auth token to every request.
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
 * A base service class that provides a shared and pre-configured Axios client.
 *
 * Any service that extends this class (e.g., AppointmentService, CustomerService)
 * will inherit the `this.http` property, allowing it to make authenticated API
 * calls without re-implementing the Axios configuration or token logic.
 */
class Service {
    /**
     * The configured Axios instance for making HTTP requests.
     * @type {import('axios').AxiosInstance}
     */
    http = apiClient;
}

export default Service;
