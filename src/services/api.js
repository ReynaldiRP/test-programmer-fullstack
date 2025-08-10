import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service for inventory management
export const inventoryApi = {
  async getProducts(page = 1) {
    const response = await api.get('/products', {
      params: { page },
    });
    return response.data;
  },

  async getProductsByCategory(category) {
    const response = await api.get('/products', {
      params: { category },
    });
    return response.data;
  },

  async addProduct(product) {
    const response = await api.post('/products', product);
    return response.data;
  },

  async updateProduct(id, product) {
    const response = await api.put(`/products/${id}`, product);
    return response.data;
  },

  async updateStock(product, transactionType) {
    const response = await api.put(`/products/${product.id}`, {
      product,
      transactionType,
    });
    return response.data;
  },

  async getProductHistory(productId) {
    const response = await api.get(`/products/${productId}/history`);
    return response.data;
  },

  // Transactions
  async createTransaction(transaction) {
    const response = await api.post('/transactions', { transaction });
    return response.data;
  },

  // Reports
  async getInventoryValue() {
    const response = await api.get('/reports/inventory');
    return response.data;
  },

  async getLowStockProducts(threshold = 10) {
    const response = await api.get('/reports/low-stock', {
      params: { threshold },
    });
    return response.data;
  },
};

export default inventoryApi;
