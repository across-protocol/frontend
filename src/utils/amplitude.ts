import { pageLookup } from "components/RouteTrace/useRouteTrace";

export function getPageValue() {
  const path = window.location.pathname;
  const page = pageLookup[path] ?? "404Page";
  return page;
}
