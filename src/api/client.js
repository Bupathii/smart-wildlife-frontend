import axios from 'axios';

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json',
  },

  timeout: 10000,
});

export function resolveApiAssetUrl(assetUrl) {
  if (!assetUrl || /^https?:\/\//i.test(assetUrl)) return assetUrl;

  const apiOrigin = new URL(apiClient.defaults.baseURL, window.location.origin).origin;
  return new URL(assetUrl, apiOrigin).toString();
}

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export default apiClient;