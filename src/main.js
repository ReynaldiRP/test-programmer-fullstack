import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';

// PrimeVue Components
import Button from 'primevue/button';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Menubar from 'primevue/menubar';
import Chart from 'primevue/chart';
import Badge from 'primevue/badge';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';

const app = createApp(App);

app.use(router).use(PrimeVue, {
  theme: {
    preset: Aura,
  },
});

// Register components globally
app.component('Button', Button);
app.component('Card', Card);
app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('InputText', InputText);
app.component('Menubar', Menubar);
app.component('Chart', Chart);
app.component('Badge', Badge);
app.component('Calendar', Calendar);
app.component('Dropdown', Dropdown);

app.mount('#app');
