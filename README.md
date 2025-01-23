# vue-plugin-scan

like [react-scan](https://github.com/aidenybai/react-scan)

> Scan your Vue app for renders

![demo](./public/demo.mp4)

## Install

```bash
npm install vue-plugin-scan
```

## Usage

```ts
import { createApp } from 'vue'
import VueScan, { type VueScanOptions } from 'vue-plugin-scan'
import App from './App.vue'

import './style.css'

const app = createApp(App)
app.use<VueScanOptions>(VueScan, {})
app.mount('#app')
```

## Credits

- [react-scan](https://github.com/aidenybai/react-scan)
