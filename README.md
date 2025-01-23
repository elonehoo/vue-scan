# vue-plugin-scan

like [react-scan](https://github.com/aidenybai/react-scan)

> Scan your Vue app for renders

<video width="320" height="240" controls>
  <source src="./public/demo.mp4" type="video/mp4">
</video>

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
