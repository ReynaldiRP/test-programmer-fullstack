import { createRouter, createWebHistory } from 'vue-router';
import AnalyticsDashboard from '../components/AnalyticsDashboard.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'AnalyticsDashboard',
      component: AnalyticsDashboard,
    },
  ],
});

export default router;
