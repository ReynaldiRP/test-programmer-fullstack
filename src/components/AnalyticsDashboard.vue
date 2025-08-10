<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="header">
      <Menubar class="menubar">
        <template #start>
          <h2 class="app-title">Inventory Dashboard</h2>
        </template>
        <template #end>
          <Badge
            :value="lowStockCount"
            severity="warning"
            class="notification-badge"
          />
        </template>
      </Menubar>
    </div>

    <!-- Date Filter Section -->
    <div class="main-content">
      <Card class="filter-card">
        <template #header>
          <div class="filter-header">
            <h3 class="filter-title">
              <i class="pi pi-filter"></i>
              Date Filter
            </h3>
          </div>
        </template>
        <template #content>
          <div class="date-filter-grid">
            <div class="date-field">
              <label for="startDate">Start Date</label>
              <Calendar
                id="startDate"
                v-model="startDate"
                placeholder="Select start date"
                dateFormat="yy-mm-dd"
                @date-select="onDateChange"
                :maxDate="endDate"
                showIcon
              />
            </div>
            <div class="date-field">
              <label for="endDate">End Date</label>
              <Calendar
                id="endDate"
                v-model="endDate"
                placeholder="Select end date"
                dateFormat="yy-mm-dd"
                @date-select="onDateChange"
                :minDate="startDate"
                showIcon
              />
            </div>
            <div class="filter-actions">
              <Button
                label="Apply Filter"
                icon="pi pi-check"
                @click="applyDateFilter"
                :loading="loading"
              />
              <Button
                label="Clear Filter"
                icon="pi pi-times"
                severity="secondary"
                @click="clearDateFilter"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Summary Stats Cards -->
      <!-- Stats Cards -->
      <div class="stats-grid">
        <Card class="stat-card">
          <template #header>
            <div class="stat-header">
              <i class="pi pi-box stat-icon"></i>
            </div>
          </template>
          <template #content>
            <div class="stat-content">
              <h3 class="stat-number">
                {{ formatNumber(dashboardData.totalProducts) }}
              </h3>
              <p class="stat-label">Total Products</p>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #header>
            <div class="stat-header">
              <i class="pi pi-dollar stat-icon"></i>
            </div>
          </template>
          <template #content>
            <div class="stat-content">
              <h3 class="stat-number">
                ${{ formatNumber(dashboardData.inventoryValue) }}
              </h3>
              <p class="stat-label">Inventory Value</p>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #header>
            <div class="stat-header">
              <i class="pi pi-exclamation-triangle stat-icon"></i>
            </div>
          </template>
          <template #content>
            <div class="stat-content">
              <h3 class="stat-number">
                {{ formatNumber(dashboardData.lowStockCount) }}
              </h3>
              <p class="stat-label">Low Stock Items</p>
            </div>
          </template>
        </Card>

        <Card class="stat-card">
          <template #header>
            <div class="stat-header">
              <i class="pi pi-calendar stat-icon"></i>
            </div>
          </template>
          <template #content>
            <div class="stat-content">
              <h3 class="stat-number">
                {{ filteredData ? 'Filtered' : 'All Time' }}
              </h3>
              <p class="stat-label">Date Range</p>
            </div>
          </template>
        </Card>
      </div>
      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Sales per Month Chart -->
        <Card class="chart-card">
          <template #header>
            <h3 class="chart-title">
              <i class="pi pi-calendar"></i>
              Sales per Month
            </h3>
          </template>
          <template #content>
            <Chart
              type="line"
              :data="monthlyChartData"
              :options="monthlyChartOptions"
              class="chart"
            />
          </template>
        </Card>

        <!-- Sales per Category Chart -->
        <Card class="chart-card">
          <template #header>
            <h3 class="chart-title">
              <i class="pi pi-chart-pie"></i>
              Sales by Category
            </h3>
          </template>
          <template #content>
            <Chart
              type="doughnut"
              :data="categoryChartData"
              :options="categoryChartOptions"
              class="chart"
            />
          </template>
        </Card>
      </div>

      <!-- Top Products Table -->
      <div class="table-section">
        <Card class="table-card">
          <template #header>
            <h3 class="table-title">
              <i class="pi pi-star"></i>
              Top Products by Sales Value
            </h3>
          </template>
          <template #content>
            <DataTable
              :value="topProducts"
              responsiveLayout="scroll"
              class="top-products-table"
              :loading="loading"
              stripedRows
              sortMode="multiple"
              paginator
              :rows="5"
              :totalRecords="topProducts.length"
            >
              <Column field="name" header="Product Name" sortable>
                <template #body="slotProps">
                  <div class="product-name">
                    <strong>{{ slotProps.data.name }}</strong>
                    <small class="category-label">{{
                      slotProps.data.category_name
                    }}</small>
                  </div>
                </template>
              </Column>
              <Column field="price" header="Unit Price" sortable>
                <template #body="slotProps">
                  <span class="price-cell"
                    >${{ formatNumber(slotProps.data.price) }}</span
                  >
                </template>
              </Column>
              <Column field="total_quantity_sold" header="Qty Sold" sortable>
                <template #body="slotProps">
                  <Badge
                    :value="formatNumber(slotProps.data.total_quantity_sold)"
                    severity="info"
                  />
                </template>
              </Column>
              <Column field="total_sales_value" header="Total Sales" sortable>
                <template #body="slotProps">
                  <span class="sales-value"
                    >${{ formatNumber(slotProps.data.total_sales_value) }}</span
                  >
                </template>
              </Column>
            </DataTable>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { inventoryApi } from '../services/api.js';

const loading = ref(false);
const startDate = ref(null);
const endDate = ref(null);

const dashboardData = ref({
  totalProducts: 0,
  lowStockCount: 0,
  inventoryValue: 0,
});

// Mock analytics data for frontend requirements
const monthlyData = ref([
  { month: '2025-01', total_sales: 45000, transaction_count: 120 },
  { month: '2025-02', total_sales: 52000, transaction_count: 140 },
  { month: '2025-03', total_sales: 48000, transaction_count: 135 },
  { month: '2025-04', total_sales: 61000, transaction_count: 160 },
  { month: '2025-05', total_sales: 55000, transaction_count: 150 },
  { month: '2025-06', total_sales: 67000, transaction_count: 180 },
]);

const categoryData = ref([
  { category_name: 'Electronics', total_sales: 125000, total_quantity: 450 },
  { category_name: 'Clothing', total_sales: 98000, total_quantity: 320 },
  { category_name: 'Books', total_sales: 45000, total_quantity: 280 },
  { category_name: 'Home & Garden', total_sales: 67000, total_quantity: 190 },
  { category_name: 'Sports', total_sales: 34000, total_quantity: 150 },
]);

const topProducts = ref([
  {
    id: 1,
    name: 'Smartphone Pro',
    price: 999,
    category_name: 'Electronics',
    total_sales_value: 25000,
    total_quantity_sold: 25,
  },
  {
    id: 2,
    name: 'Laptop Gaming',
    price: 1499,
    category_name: 'Electronics',
    total_sales_value: 22000,
    total_quantity_sold: 15,
  },
  {
    id: 3,
    name: 'Wireless Headphones',
    price: 299,
    category_name: 'Electronics',
    total_sales_value: 18000,
    total_quantity_sold: 60,
  },
  {
    id: 4,
    name: 'Running Shoes',
    price: 129,
    category_name: 'Sports',
    total_sales_value: 15000,
    total_quantity_sold: 116,
  },
  {
    id: 5,
    name: 'Designer T-Shirt',
    price: 89,
    category_name: 'Clothing',
    total_sales_value: 12000,
    total_quantity_sold: 135,
  },
  {
    id: 6,
    name: 'Coffee Maker',
    price: 199,
    category_name: 'Home & Garden',
    total_sales_value: 11000,
    total_quantity_sold: 55,
  },
  {
    id: 7,
    name: 'Fitness Tracker',
    price: 249,
    category_name: 'Electronics',
    total_sales_value: 10500,
    total_quantity_sold: 42,
  },
  {
    id: 8,
    name: 'Winter Jacket',
    price: 179,
    category_name: 'Clothing',
    total_sales_value: 9800,
    total_quantity_sold: 55,
  },
  {
    id: 9,
    name: 'Gaming Mouse',
    price: 79,
    category_name: 'Electronics',
    total_sales_value: 9200,
    total_quantity_sold: 116,
  },
  {
    id: 10,
    name: 'Yoga Mat',
    price: 49,
    category_name: 'Sports',
    total_sales_value: 8800,
    total_quantity_sold: 180,
  },
  {
    id: 11,
    name: 'Bluetooth Speaker',
    price: 159,
    category_name: 'Electronics',
    total_sales_value: 8500,
    total_quantity_sold: 53,
  },
  {
    id: 12,
    name: 'Kitchen Knife Set',
    price: 129,
    category_name: 'Home & Garden',
    total_sales_value: 8200,
    total_quantity_sold: 64,
  },
  {
    id: 13,
    name: 'Denim Jeans',
    price: 89,
    category_name: 'Clothing',
    total_sales_value: 7900,
    total_quantity_sold: 89,
  },
  {
    id: 14,
    name: 'Tennis Racket',
    price: 199,
    category_name: 'Sports',
    total_sales_value: 7600,
    total_quantity_sold: 38,
  },
  {
    id: 15,
    name: 'LED Desk Lamp',
    price: 69,
    category_name: 'Home & Garden',
    total_sales_value: 7300,
    total_quantity_sold: 106,
  },
  {
    id: 16,
    name: 'Tablet Case',
    price: 39,
    category_name: 'Electronics',
    total_sales_value: 7000,
    total_quantity_sold: 179,
  },
  {
    id: 17,
    name: 'Polo Shirt',
    price: 59,
    category_name: 'Clothing',
    total_sales_value: 6800,
    total_quantity_sold: 115,
  },
  {
    id: 18,
    name: 'Basketball',
    price: 29,
    category_name: 'Sports',
    total_sales_value: 6500,
    total_quantity_sold: 224,
  },
  {
    id: 19,
    name: 'Garden Hose',
    price: 45,
    category_name: 'Home & Garden',
    total_sales_value: 6200,
    total_quantity_sold: 138,
  },
  {
    id: 20,
    name: 'Phone Case',
    price: 25,
    category_name: 'Electronics',
    total_sales_value: 6000,
    total_quantity_sold: 240,
  },
]);

// Menu items
// const menuItems = ref([
//   {
//     label: 'Dashboard',
//     icon: 'pi pi-home',
//     command: () => console.log('Dashboard clicked'),
//   },
//   {
//     label: 'Products',
//     icon: 'pi pi-box',
//     command: () => console.log('Products clicked'),
//   },
//   {
//     label: 'Reports',
//     icon: 'pi pi-chart-bar',
//     command: () => console.log('Reports clicked'),
//   },
// ]);

// Computed properties
const lowStockCount = computed(() => dashboardData.value.lowStockCount);

const filteredData = computed(() => {
  return startDate.value && endDate.value;
});

const monthlyChartData = computed(() => {
  let dataToUse = monthlyData.value;

  // Apply date filter if both dates are selected
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);

    dataToUse = monthlyData.value.filter((item) => {
      const itemDate = new Date(item.month + '-01');
      return itemDate >= start && itemDate <= end;
    });
  }

  if (!dataToUse.length) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = dataToUse.map((item) => {
    const date = new Date(item.month + '-01');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  });

  const salesData = dataToUse.map((item) => parseFloat(item.total_sales));

  return {
    labels,
    datasets: [
      {
        label: 'Monthly Sales ($)',
        data: salesData,
        fill: true,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };
});

const monthlyChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#4f46e5',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label: function (context) {
          return `Sales: $${formatNumber(context.parsed.y)}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(107, 114, 128, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 12,
          weight: '500',
        },
        callback: function (value) {
          return '$' + formatNumber(value);
        },
      },
    },
    x: {
      grid: {
        color: 'rgba(107, 114, 128, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 12,
          weight: '500',
        },
      },
    },
  },
});

const categoryChartData = computed(() => {
  let dataToUse = categoryData.value;

  if (startDate.value && endDate.value) {
    dataToUse = categoryData.value.map((item) => ({
      ...item,
      total_sales: item.total_sales * 0.7,
    }));
  }

  if (!dataToUse.length) {
    return {
      labels: [],
      datasets: [],
    };
  }

  const labels = dataToUse.map((item) => item.category_name);
  const salesData = dataToUse.map((item) => parseFloat(item.total_sales));
  const colors = [
    '#4f46e5',
    '#059669',
    '#d97706',
    '#dc2626',
    '#8b5cf6',
    '#0891b2',
    '#c2410c',
    '#be185d',
    '#4338ca',
    '#0d9488',
  ];

  return {
    labels,
    datasets: [
      {
        data: salesData,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4,
      },
    ],
  };
});

const categoryChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          size: 12,
          weight: '500',
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#4f46e5',
      borderWidth: 1,
      cornerRadius: 8,
      callbacks: {
        label: function (context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.label}: $${formatNumber(
            context.parsed
          )} (${percentage}%)`;
        },
      },
    },
  },
  cutout: '60%',
});

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return parseFloat(num).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatDateForAPI = (date) => {
  if (!date) return null;
  return date.toISOString().split('T')[0];
};

// API calls
const loadDashboardData = async () => {
  loading.value = true;
  try {
    const [products, lowStock, inventoryValue] = await Promise.all([
      inventoryApi.getProducts(1, 1000), // Get many products to count
      inventoryApi.getLowStockProducts(),
      inventoryApi.getInventoryValue(),
    ]);

    dashboardData.value = {
      totalProducts: products.total || 0,
      lowStockCount: lowStock.total || 0,
      inventoryValue: inventoryValue.data?.totalValue || 0,
    };

    console.log('Dashboard data loaded from existing endpoints');
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    dashboardData.value = {
      totalProducts: 0,
      lowStockCount: 0,
      inventoryValue: 0,
    };
  } finally {
    loading.value = false;
  }
};

const onDateChange = () => {
  console.log('Date filter applied:', {
    startDate: startDate.value,
    endDate: endDate.value,
  });
};

const applyDateFilter = () => {
  onDateChange();
};

const clearDateFilter = () => {
  startDate.value = null;
  endDate.value = null;
  onDateChange();
};

// Lifecycle
onMounted(() => {
  loadDashboardData();
});
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

.header {
  background: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-light);
}

.menubar {
  border: none;
  border-radius: 0;
}

.app-title {
  color: var(--text-primary);
  margin: 0;
  font-weight: 700;
  font-size: 1.5rem;
}

.notification-badge {
  margin-left: 1rem;
}

.main-content {
  padding: 0 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.filter-card {
  margin-bottom: 2rem;
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  background-color: var(--bg-primary);
}

.filter-header {
  padding: 1rem 1.5rem 0 1.5rem;
}

.filter-title {
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-filter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 1.5rem;
  align-items: end;
  padding: 1.5rem;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-field label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-header {
  background: linear-gradient(
    135deg,
    var(--primary-color) 0%,
    var(--primary-dark) 100%
  );
  padding: 1.5rem;
  text-align: center;
  position: relative;
}

.stat-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
}

.stat-icon {
  font-size: 2.25rem;
  color: var(--text-white);
  position: relative;
  z-index: 1;
}

.stat-content {
  text-align: center;
  padding: 1.5rem;
  background-color: var(--bg-primary);
}

.stat-number {
  font-size: 2.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.stat-label {
  color: var(--text-tertiary);
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  background-color: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
}

.chart-title {
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
  font-size: 1.25rem;
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart {
  height: 350px;
  padding: 1rem;
}

/* Table Section */
.table-section {
  margin-bottom: 2rem;
}

.table-card {
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  background-color: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
}

.table-title {
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
  font-size: 1.25rem;
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.top-products-table {
  margin-top: 1rem;
}

/* Pagination Styling */
.top-products-table .p-paginator {
  background-color: var(--bg-secondary);
  border: none;
  border-top: 1px solid var(--border-light);
  padding: 1rem;
  border-radius: 0 0 12px 12px;
}

.top-products-table .p-paginator .p-paginator-pages .p-paginator-page {
  background-color: transparent;
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  margin: 0 2px;
  border-radius: 6px;
  min-width: 2.5rem;
  height: 2.5rem;
  transition: all 0.2s ease;
}

.top-products-table .p-paginator .p-paginator-pages .p-paginator-page:hover {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-white);
}

.top-products-table
  .p-paginator
  .p-paginator-pages
  .p-paginator-page.p-highlight {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-white);
}

.top-products-table .p-paginator .p-paginator-first,
.top-products-table .p-paginator .p-paginator-prev,
.top-products-table .p-paginator .p-paginator-next,
.top-products-table .p-paginator .p-paginator-last {
  background-color: transparent;
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.2s ease;
}

.top-products-table .p-paginator .p-paginator-first:hover,
.top-products-table .p-paginator .p-paginator-prev:hover,
.top-products-table .p-paginator .p-paginator-next:hover,
.top-products-table .p-paginator .p-paginator-last:hover {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-white);
}

.top-products-table .p-paginator .p-dropdown {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-medium);
  border-radius: 6px;
  margin-left: 0.5rem;
}

.top-products-table .p-paginator .p-paginator-current {
  color: var(--text-secondary);
  font-weight: 500;
  background-color: transparent;
}

.product-name {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-label {
  color: var(--text-tertiary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.price-cell,
.sales-value {
  font-weight: 600;
  color: var(--text-primary);
}

.sales-value {
  font-size: 1.1rem;
  color: var(--success-color);
}

/* Enhanced Card Headers */
.stat-card:nth-child(1) .stat-header {
  background: linear-gradient(135deg, var(--success-color) 0%, #047857 100%);
}

.stat-card:nth-child(2) .stat-header {
  background: linear-gradient(
    135deg,
    var(--info-color) 0%,
    var(--primary-color) 100%
  );
}

.stat-card:nth-child(3) .stat-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-card:nth-child(4) .stat-header {
  background: linear-gradient(135deg, var(--warning-color) 0%, #b45309 100%);
}

/* Responsive design */
@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 0 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .date-filter-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .filter-actions .p-button {
    flex: 1;
  }

  .stat-number {
    font-size: 1.75rem;
  }

  .stat-icon {
    font-size: 1.75rem;
  }

  .chart-title,
  .table-title,
  .filter-title {
    font-size: 1.125rem;
    padding: 1rem 1rem 0 1rem;
  }

  .stat-content,
  .stat-header {
    padding: 1rem;
  }

  .chart {
    height: 300px;
  }

  /* Mobile pagination adjustments */
  .top-products-table .p-paginator {
    padding: 0.75rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .top-products-table .p-paginator .p-paginator-current {
    order: -1;
    flex-basis: 100%;
    text-align: center;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }

  .top-products-table .p-paginator .p-paginator-pages .p-paginator-page {
    min-width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }

  .top-products-table .p-paginator .p-dropdown {
    font-size: 0.875rem;
  }
}

@media (max-width: 480px) {
  .stat-number {
    font-size: 1.5rem;
  }

  .stats-grid {
    gap: 0.75rem;
  }
}
</style>
