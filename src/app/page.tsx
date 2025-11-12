import { redirect } from "next/navigation";

/**
 * 根页面组件 - 处理国际化路由重定向
 * 当用户访问根路径时，重定向到默认语言路径
 */
export default function RootPage() {
  // 重定向到默认语言路径，由 next-intl 中间件处理
  redirect("/en");
}