export type RouteState = { origin: string; destination: string };
export type RouteAction =
  { type: "origin" | "destination"; id: string } | { type: "clear" | "swap" };
export const emptyRoute: RouteState = { origin: "", destination: "" };
export function routeReducer(
  state: RouteState,
  action: RouteAction,
): RouteState {
  if (action.type === "clear") return emptyRoute;
  if (action.type === "swap")
    return { origin: state.destination, destination: state.origin };
  if (action.type === "origin")
    return {
      origin: action.id,
      destination: state.destination === action.id ? "" : state.destination,
    };
  if (action.type === "destination")
    return {
      origin: state.origin === action.id ? "" : state.origin,
      destination: action.id,
    };
  return state;
}
