import type { VueScanOptions } from 'vue-plugin-scan'
import { createApp } from 'vue'
import VueScan from 'vue-plugin-scan'
import App from './App.vue'

import './style.css'

const app = createApp(App)
app.use<VueScanOptions>(VueScan, {})
app.mount('#app')
