import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import App from "./App.vue";
import "./styles.css";

const app = createApp(App);

app.use(createPinia());
app.use(ElementPlus, { locale: zhCn });

// 全量注册 Element Plus 图标（CrewCard / AssetTree / 页面头部使用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount("#app");
