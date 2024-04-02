import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useMainStore } from '@/store/index'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

const mainStore = useMainStore()
const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("user-token"))
if (mainStore && token) {
    mainStore.setUserToken(token.split("=")[1])
}

app.mount('#app')
