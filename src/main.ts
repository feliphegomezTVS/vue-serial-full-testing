import { createApp } from "vue";
import { createPinia } from "pinia";


import App from "./App.vue";
import router from "./router";

import 'xterm/css/xterm.css';
import "./assets/main.css";
import "./assets/main.scss";
import * as bootstrap from 'bootstrap';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
