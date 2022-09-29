import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import TerminalView from "../views/TerminalView.vue";
import SupplierView from "../views/supplier/index.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/terminal",
      name: "terminal",
      component: TerminalView,
    },
    {
      path: "/client",
      name: "client",
      component: () => import("../views/client/index.vue"),
    },
    {
      path: "/supplier",
      name: "supplier",
      component: SupplierView,
    },
    // {
    //   path: "/about",
    //   name: "about",
    //   component: () => import("../views/AboutView.vue"),
    // },
  ],
});

export default router;
