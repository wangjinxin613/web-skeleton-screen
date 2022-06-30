import { createApp } from 'vue'
import App from './App.vue';
import router from './router'
const vue3Plugin = require('web-skeleton-screen/vue3Plugin')

const app = createApp(App);
app.use(vue3Plugin, require('../wss.config'))
app.use(router).mount('#app')
