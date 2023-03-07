import { useLocation } from "react-router";

export function useBreadcrumb() {
  const location = useLocation();
  const routes = location.pathname
    .split("/")
    .filter((r) => r)
    .reduce((prev, curr) => {
      prev.push({
        path: `${prev[prev.length - 1]?.path ?? ""}/${curr}`,
        name: curr,
      });
      return prev;
    }, [] as { path: string; name: string }[]);
  if (routes.length === 0) {
    routes.push({ path: "/", name: "Home" });
  }
  const ancestorRoutes = routes.slice(0, -1);
  const currentRoute = routes[routes.length - 1];

  return {
    routes,
    ancestorRoutes,
    currentRoute,
  };
}
