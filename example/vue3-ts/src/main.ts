import { createApp } from 'vue'
import App from './App.vue';
import router from './router'
import vue3Plugin from 'web-skeleton-screen/vue3Plugin'
import wssConfig from '../wss.config';

const app = createApp(App);
app.use(vue3Plugin, wssConfig)
app.use(router).mount('#app')
