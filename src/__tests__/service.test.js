import Service from '../services/service';
// We get the apiClient instance from the Service class
const apiClient = new Service().http;

// Mock localStorage
let localStorageMock = {};

// Mock global localStorage
beforeAll(() => {
    // Create a mock implementation for localStorage since Storage API is not in node
    const localStorageImpl = {
        getItem: jest.fn((key) => localStorageMock[key] || null),
        setItem: jest.fn((key, value) => {
            localStorageMock[key] = value.toString();
        }),
        clear: jest.fn(() => {
            localStorageMock = {};
        }),
        removeItem: jest.fn((key) => {
            delete localStorageMock[key];
        }),
        length: Object.keys(localStorageMock).length,
        key: jest.fn((index) => Object.keys(localStorageMock)[index] || null),
    };

    // Assign the mock to global.localStorage
    Object.defineProperty(global, 'localStorage', {
        value: localStorageImpl,
        writable: true, // Allow it to be modified (e.g., cleared)
    });
});

// Mock console.log and console.error to prevent logs during tests
// and to check if they were called.
beforeEach(() => {
    // Clear mocks and reset localStorage before each test
    jest.clearAllMocks();
    localStorage.clear(); // This will now call our mock 'clear'

    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

describe('apiClient Configuration', () => {
    it('should be created with the correct baseURL', () => {
        expect(apiClient.defaults.baseURL).toBe('/api');
    });

    it('should be created with the correct default Content-Type header', () => {
        expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
});

describe('Request Interceptor', () => {
    // Interceptors are stored in an array. [0] is the one we just added.
    const requestInterceptor = apiClient.interceptors.request.handlers[0].fulfilled;
    const errorInterceptor = apiClient.interceptors.request.handlers[0].rejected;

    it('should add the Authorization header if a token exists in localStorage', () => {
        // Arrange
        const mockToken = 'my-fake-token-123';
        localStorage.setItem('token', mockToken);
        const mockConfig = { headers: {} };

        // Act
        const newConfig = requestInterceptor(mockConfig);

        // Assert
        expect(localStorage.getItem).toHaveBeenCalledWith('token');
        expect(newConfig.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should NOT add the Authorization header if no token exists', () => {
        // Arrange
        const mockConfig = { headers: {} };

        // Act
        const newConfig = requestInterceptor(mockConfig);

        // Assert
        expect(localStorage.getItem).toHaveBeenCalledWith('token');
        expect(newConfig.headers.Authorization).toBeUndefined();
    });

    it('should reject with the error on request failure', async () => {
        // Arrange
        const mockError = new Error('Network failed');

        // Act & Assert
        await expect(errorInterceptor(mockError)).rejects.toThrow('Network failed');
    });
});

describe('Response Interceptor', () => {
    const responseInterceptor = apiClient.interceptors.response.handlers[0].fulfilled;
    const errorInterceptor = apiClient.interceptors.response.handlers[0].rejected;

    it('should log the response and return it on success', () => {
        // Arrange
        const mockResponse = { data: { id: 1, name: 'Test' }, status: 200 };

        // Act
        const result = responseInterceptor(mockResponse);

        // Assert
        expect(console.log).toHaveBeenCalledWith('API Response:', mockResponse);
        expect(result).toEqual(mockResponse);
    });

    it('should log the error.response and reject on failure', async () => {
        // Arrange
        const mockError = {
            message: 'Request failed with status code 500',
            response: { data: 'Server Error', status: 500 },
        };

        // Act & Assert
        await expect(errorInterceptor(mockError)).rejects.toEqual(mockError);
        expect(console.error).toHaveBeenCalledWith('API Error:', mockError.response);
    });

    it('should log the error.message if error.response is missing', async () => {
        // Arrange
        const mockError = {
            message: 'Network Error',
        };

        // Act & Assert
        await expect(errorInterceptor(mockError)).rejects.toEqual(mockError);
        expect(console.error).toHaveBeenCalledWith('API Error:', mockError.message);
    });
});

describe('Service Class', () => {
    it('should contain an http property that is the apiClient', () => {
        const service1 = new Service();
        const service2 = new Service();

        // Check that the service has the http property
        expect(service1.http).toBeDefined();
        // Check that it's the *same* instance (singleton)
        expect(service1.http).toBe(service2.http);
        expect(service1.http.defaults.baseURL).toBe('/api');
    });
});

