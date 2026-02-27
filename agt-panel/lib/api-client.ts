
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://agt-api.adhyatmparivar.com";

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: RequestMethod;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, isFormData = false } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method,
    headers: {
      ...headers,
    },
  };

  const useFormData = isFormData || (typeof FormData !== 'undefined' && body instanceof FormData);

  if (body) {
    if (useFormData) {
      config.body = body;
      // Content-Type header is set automatically for FormData
    } else {
      config.headers = {
        'Content-Type': 'application/json',
        ...config.headers,
      };
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      // Try to parse error message
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

// --- Books ---

export const booksApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    languageIds?: (string | number)[];
    categoryIds?: (string | number)[];
    isAvailable?: boolean;
    kabatNumber?: number | string;
    minPages?: number;
    maxPages?: number;
    bookSize?: string;
    yearAD?: number | string;
    vikramSamvat?: number | string;
    veerSamvat?: number | string;
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.search) query.append('search', params.search)
    if (params?.languageIds && params.languageIds.length > 0) {
      params.languageIds.forEach(id => query.append('languageId', id.toString()))
    }
    if (params?.categoryIds && params.categoryIds.length > 0) {
      params.categoryIds.forEach(id => query.append('categoryId', id.toString()))
    }
    if (params?.isAvailable !== undefined) {
      query.append('isAvailable', params.isAvailable.toString())
    }
    if (params?.kabatNumber) query.append('kabatNumber', params.kabatNumber.toString())
    if (params?.minPages) query.append('minPages', params.minPages.toString())
    if (params?.maxPages) query.append('maxPages', params.maxPages.toString())
    if (params?.bookSize) query.append('bookSize', params.bookSize)
    if (params?.yearAD) query.append('yearAD', params.yearAD.toString())
    if (params?.vikramSamvat) query.append('vikramSamvat', params.vikramSamvat.toString())
    if (params?.veerSamvat) query.append('veerSamvat', params.veerSamvat.toString())

    return apiRequest<any>(`/api/books${query.toString() ? '?' + query.toString() : ''}`)
  },
  getById: (id: number | string) => apiRequest<any>(`/api/books/${id}`),
  create: (data: any) => apiRequest<any>('/api/books', { method: 'POST', body: data }),
  bulkCreate: (data: any) => apiRequest<any>('/api/books/bulk', { method: 'POST', body: data }),
  update: (id: number | string, data: any) => apiRequest<any>(`/api/books/${id}`, { method: 'PUT', body: data }),
  delete: (id: number | string) => apiRequest<any>(`/api/books/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: (number | string)[]) => apiRequest<any>('/api/books/bulk-delete', { method: 'DELETE', body: { ids } }),
};

// --- Readers ---

export const readersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.search) query.append('search', params.search)
    return apiRequest<any>(`/api/readers${query.toString() ? '?' + query.toString() : ''}`)
  },
  getById: (id: number | string) => apiRequest<any>(`/api/readers/${id}`),
  create: (data: any) => apiRequest<any>('/api/readers', { method: 'POST', body: data }),
  update: (id: number | string, data: any) => apiRequest<any>(`/api/readers/${id}`, { method: 'PUT', body: data }),
  delete: (id: number | string) => apiRequest<any>(`/api/readers/${id}`, { method: 'DELETE' }),
};

// --- Orders ---

export const ordersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    statuses?: string[];
    cities?: string[];
    states?: string[];
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.search) query.append('search', params.search)
    if (params?.statuses && params.statuses.length > 0) {
      params.statuses.forEach(status => query.append('status', status))
    }
    if (params?.cities && params.cities.length > 0) {
      params.cities.forEach(city => query.append('city', city))
    }
    if (params?.states && params.states.length > 0) {
      params.states.forEach(state => query.append('state', state))
    }
    return apiRequest<any>(`/api/orders${query.toString() ? '?' + query.toString() : ''}`)
  },
  getById: (id: number | string) => apiRequest<any>(`/api/orders/${id}`),
  create: (data: any) => apiRequest<any>('/api/orders', { method: 'POST', body: data }),
  updateStatus: (id: number | string, status: string) => apiRequest<any>(`/api/orders/${id}/status`, { method: 'PUT', body: { status } }),
  updateBookStatus: (orderId: number | string, bookId: number | string, status: string) => apiRequest<any>(`/api/orders/${orderId}/books/${bookId}/status`, { method: 'PUT', body: { status } }),
  update: (id: number | string, data: any) => apiRequest<any>(`/api/orders/${id}`, { method: 'PUT', body: data }),
  delete: (id: number | string) => apiRequest<any>(`/api/orders/${id}`, { method: 'DELETE' }),
  getByReader: (readerId: number | string) => apiRequest<any[]>(`/api/orders/reader/${readerId}`),
  getBookStats: (bookId: number | string) => apiRequest<any>(`/api/orders/book/${bookId}/stats`),
};

// --- Masters ---

export const mastersApi = {
  getLanguages: (params?: { search?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    return apiRequest<any[]>(`/api/masters/languages${query.toString() ? '?' + query.toString() : ''}`)
  },
  createLanguage: (data: { name: string; code: string }) => apiRequest<any>('/api/masters/languages', { method: 'POST', body: data }),
  updateLanguage: (id: number | string, data: { name: string; code?: string }) => apiRequest<any>(`/api/masters/languages/${id}`, { method: 'PUT', body: data }),
  deleteLanguage: (id: number | string) => apiRequest<any>(`/api/masters/languages/${id}`, { method: 'DELETE' }),

  getCategories: (params?: { search?: string }) => {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    return apiRequest<any[]>(`/api/masters/categories${query.toString() ? '?' + query.toString() : ''}`)
  },
  createCategory: (data: { name: string; description?: string }) => apiRequest<any>('/api/masters/categories', { method: 'POST', body: data }),
  updateCategory: (id: number | string, data: { name: string; description?: string }) => apiRequest<any>(`/api/masters/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id: number | string) => apiRequest<any>(`/api/masters/categories/${id}`, { method: 'DELETE' }),
};

// --- Interests ---

export const interestsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.search) query.append('search', params.search)
    return apiRequest<any>(`/api/interests${query.toString() ? '?' + query.toString() : ''}`)
  },
  getUserInterests: (userId: string) => apiRequest<any[]>(`/api/interests?userId=${userId}`),
  create: (data: any) => apiRequest<any>('/api/interests', { method: 'POST', body: data }),
  updateStatus: (id: string | number, status: string) => apiRequest<any>(`/api/interests/${id}/status`, { method: 'PUT', body: { status } }),
  delete: (id: string | number) => apiRequest<any>(`/api/interests/${id}`, { method: 'DELETE' }),
};

// --- Activity Logs ---

export const logsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.append('page', params.page.toString())
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.search) query.append('search', params.search)
    return apiRequest<any>(`/api/activity-logs${query.toString() ? '?' + query.toString() : ''}`)
  },
  getById: (id: number | string) => apiRequest<any>(`/api/activity-logs/${id}`),
  create: (data: any) => apiRequest<any>('/api/activity-logs', { method: 'POST', body: data }),
  update: (id: number | string, data: any) => apiRequest<any>(`/api/activity-logs/${id}`, { method: 'PUT', body: data }),
  delete: (id: number | string) => apiRequest<any>(`/api/activity-logs/${id}`, { method: 'DELETE' }),
};
