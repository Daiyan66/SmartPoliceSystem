import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sps_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Refresh Token and Rate Limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Too Many Requests (Bucket4j Rate Limit)
    if (error.response && error.response.status === 429) {
      console.warn('Rate limit exceeded (HTTP 429). Please wait before retrying.');
      return Promise.reject({
        ...error,
        message: 'Security Rate Limit Exceeded. Too many requests. Please wait a moment.'
      });
    }

    // Handle 401 Unauthorized -> Attempt token refresh
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('sps_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh-token', { refreshToken });
          if (res.data && res.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            localStorage.setItem('sps_access_token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('sps_refresh_token', newRefreshToken);
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token expired or invalid:', refreshError);
          localStorage.removeItem('sps_access_token');
          localStorage.removeItem('sps_refresh_token');
          localStorage.removeItem('sps_user');
          window.location.href = '/login?expired=true';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
