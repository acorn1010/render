import {authStore, useAuth} from "./auth/authStore";
import {SiteTheme} from "./SiteTheme";
import {Redirect, Route as Woute, Switch} from "wouter";
import loadable from "@loadable/component";
import {PropsWithChildren, useMemo} from "react";
import {isLoaded} from "@/state/isLoaded";
import DashboardHomePage from "@/pages/dashboard/DashboardHomePage";
import * as React from "react";

export function App() {
  useAuth();

  return (
      <SiteTheme>
        <Switch>
          <AuthRoute type='auth' path='/'><DashboardHomePage /></AuthRoute>
          <AuthRoute type='guest' path='/login' lazy={() => import('./pages/LoginPage')} />

          <Route path='/logout' lazy={() => import('./pages/LogoutPage')} />
        </Switch>
      </SiteTheme>
  );
}

function AuthRoute({type, ...rest}: RouteProps & {type: 'guest' | 'auth'}) {
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

type RouteProps = PropsWithChildren<{path: `/${string}`, lazy?: () => Promise<{default: () => JSX.Element}> /*lazy?: 'LoginPage' | 'LogoutPage'*/}>;

// TODO(acorn1010): Use Foony FileUtils to get all possible components.
function Route(props: RouteProps) {
  const {children, path, lazy} = props;
  const LoadableComponent = useMemo(() => lazy ? loadable(lazy) : null, [lazy]);

  return <Woute path={path}>{LoadableComponent ? <LoadableComponent /> : children}</Woute>;
}
