import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import TerminalView from "../views/TerminalView.vue";

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
    // {
    //   path: "/about",
    //   name: "about",
    //   component: () => import("../views/AboutView.vue"),
    // },
  ],
});

export default router;
