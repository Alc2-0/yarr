import type {
  BrowserHistory,
  HashHistory,
  History,
  MemoryHistory,
  PartialPath,
} from 'history';
import type { ComponentType } from 'react';
import type { SuspenseResource } from './utils/SuspenseResource';

/**
 * This type takes a given path and returns a union containing the path parameters.
 *
 * The conditional case logic is as follows:
 * 1. First case matches parameters at the start or middle of the path (ie `':username/projects/:projectId/edit'`).
 * 2. Second case matches parameters at the end of the path (ie `':projectId'`).
 * 3. The third matches strings with some other content before a parameter and strips it away (ie `'/project/:projectId'`).
 * 4. The last case returns `never` if none of the three previous cases match (which causes it behave like an empty set when used in a union).
 *
 * The first and third cases are called recursively with a shorter section of the string.
 */
export type PathParameters<Path extends string> =
  Path extends `:${infer Parameter}/${infer Rest}`
    ? Parameter | PathParameters<Rest>
    : Path extends `:${infer Parameter}`
    ? Parameter
    : Path extends `${string}:${infer Rest}`
    ? PathParameters<`:${Rest}`>
    : never;

/**
 * Given a path this type returns a object whose
 * keys are the path parameter names.
 */
export type RouteParameters<Path extends string> = {
  [K in PathParameters<Path>]: string;
};

export type PreloadFunction = () => Promise<unknown>;

export interface PreloadConfig {
  data: PreloadFunction;
  defer?: boolean;
}

export interface PreloadedValue {
  [key: string]: PreloadConfig | PreloadFunction;
}

/**
 * A single route configuration object.
 */
export interface RouteConfig<
  ParentPath extends string = string,
  Path extends string = string
> {
  /**
   * An array of child routes whose paths are relative to the parent path.
   */
  children?: ReadonlyArray<RouteConfig<`${ParentPath}${Path}`>>;
  /**
   * The component to be rendered when the route path matches.
   *
   * This is a function that returns a promise to dynamically load the component.
   *
   * It is recommended to use dynamic import syntax (e.g. `import('./MyComponent')`) to load the component.
   *
   * @example `() => import('./MyComponent').then(m => m.default)`
   */
  component: () => Promise<ComponentType<{}>>;
  /**
   * A string that sets the pathname which the route will be matched against.
   *
   * Children routes will prefix their paths with this pathname.
   */
  path: Path;
  /**
   * A function that returns an object whose keys are preload entities that are
   * mapped to the `preloaded` prop on the rendered route component.
   *
   * Each value is a function that returns a promise to dynamically load any needed data.
   *
   * Requests are initialized concurrently and allows components to suspend.
   *
   * @example
   * ```
   * () => ({
   *   data: () => fetch('https://api.example.com/data'),
   * })
   * ```
   */
  preload?: (
    routeParameters: RouteParameters<`${ParentPath}${Path}`>
  ) => PreloadedValue;
  /**
   * A function where you can perform logic to conditionally determine
   * if the router should redirect the user to another route.
   *
   * This redirect logic is run before any preload logic or component render.
   *
   * The function should return the full pathname of the route to redirect to,
   * or `null` if no redirect should occur.
   *
   * NOTE: redirect rules apply to children routes unless overridden.
   */
  redirectRules?: (
    namedParameters: RouteParameters<`${ParentPath}${Path}`>,
    searchParameters: Record<string, string[] | string>
  ) => string | null;
}

export type RoutesConfig = readonly RouteConfig[];

export type RouteEntry = Omit<RouteConfig, 'component' | 'path'> & {
  component: SuspenseResource<ComponentType>;
};

export type RoutesEntryMap = Map<string, RouteEntry>;

export interface RouterOptions<Routes extends RoutesConfig> {
  /**
   * Indicates to the router whether it should
   * transform preload requests into Suspense resources.
   *
   * @default false
   */
  assistPreload?: boolean;
  /**
   * Tells the router whether or not to continue rendering a
   * previous route component until the new requested route
   * component code has fully loaded.
   *
   * @default false
   */
  awaitComponent?: boolean;
  /**
   * Tells the router whether or not to continue rendering a
   * previous route component until the newly requested routes
   * preload data as loaded.
   *
   * @default false
   */
  awaitPreload?: boolean;
  /**
   * An array of route configuration objects
   */
  routes: Routes;
}

export interface CreateRouterOptions<Routes extends RoutesConfig>
  extends RouterOptions<Routes> {
  history: History;
}

export type RouterSubscriptionCallback = (nextEntry: RouteEntry) => void;

export type RouterSubscriptionDispose = () => void;

export interface RouterContextProps {
  /**
   * When true, tells the router that route preloads should be made into suspense resources.
   */
  readonly assistPreload: boolean;
  /**
   * When true, tells the router will continue to render a previous route component
   * until the new route component is fully loaded and ready to use.
   */
  readonly awaitComponent: boolean;
  /**
   * Returns the current route entry for the current history location.
   */
  readonly get: () => RouteEntry;
  readonly history: BrowserHistory | HashHistory | MemoryHistory;
  /**
   * Returns true if the given pathname matches the current history location.
   *
   * Setting `exact` optional argument will take both
   * the location search query and hash into account in the comparison.
   */
  readonly isActive: (path: string, exact?: boolean) => boolean;
  /**
   * Preloads the component code for a given route.
   */
  readonly preloadCode: (pathname: string) => void;
  /**
   * Function that allows you to subscribe to history location changes.
   * Returns a function that you can call to unsubscribe from the history location changes.
   */
  readonly subscribe: (
    callback: RouterSubscriptionCallback
  ) => RouterSubscriptionDispose;
  /**
   * Preloads both the component code and data for a given route.
   */
  readonly warmRoute: (pathname: string) => void;
}

export type LocationFragment = PartialPath;
export interface MatchedRoute {
  location: LocationFragment;
  params: Record<string, string[] | string>;
  route: RouteEntry;
  search: Record<string, string[] | string>;
}

export type PreloadedMap = Map<
  string,
  { data: SuspenseResource<unknown>; defer: boolean }
>;

export interface PreparedMatchFragment {
  component: SuspenseResource<ComponentType>;
  location: LocationFragment;
  params: Record<string, string[] | string>;
  search: Record<string, string[] | string>;
}

export interface PreparedMatchWithAssist extends PreparedMatchFragment {
  preloaded?: PreloadedMap;
}

export interface PreparedMatchWithoutAssist extends PreparedMatchFragment {
  preloaded?: PreloadedValue;
}
