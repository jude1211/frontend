// Temporary React typings shim to unblock TS in absence of @types/react

declare module 'react' {
  export = React;
  namespace React {
    // Basic hooks and types minimal surface
    function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
    function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
    interface FC<P = {}> { (props: P & { children?: ReactNode }): any }
    type ReactNode = any;
    interface ChangeEvent<T = any> { target: T }
    interface SyntheticEvent<T = any> { target: T }
  }
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
 