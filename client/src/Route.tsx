import {PropsWithChildren, useMemo} from "react";
import loadable from "@loadable/component";
import {Redirect, Route as Woute} from "wouter";
import * as React from "react";
import {authStore} from "@/auth/authStore";
import {isLoaded} from "@/state/isLoaded";

type RouteProps = PropsWithChildren<{path?: `/${string}`, lazy?: () => Promise<{default: () => JSX.Element}>}>;

export function Route(props: RouteProps) {
  const {children, lazy, ...rest} = props;
  const LoadableComponent = useMemo(() => lazy ? loadable(lazy) : null, [lazy]);

  return <Woute {...rest}>{LoadableComponent ? <LoadableComponent /> : children}</Woute>;
}

export function AuthRoute({type, ...rest}: RouteProps & {type: 'guest' | 'auth'}) {
  const userId = authStore.use('userId')[0];

  if (!isLoaded(userId)) {
    return <p className='flex-center m-auto'>Loading...</p>;
  } else if (type === 'guest' && !!userId) {
    // Authenticated. Show the homepage.
    return <Redirect to='/' replace />;
  } else if (type === 'auth' && !userId) {
    // Unauthenticated.
    return <Redirect to='/login' replace />;
  }

  return <Route {...rest} />;
}
