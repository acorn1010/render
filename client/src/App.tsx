import {authStore, useAuth} from "./auth/authStore";
import {SiteTheme} from "./SiteTheme";
import {TrpcProvider} from "./TrpcProvider";
import {Redirect, Route as Woute, Switch} from "wouter";
import loadable from "@loadable/component";
import {PropsWithChildren, useMemo} from "react";
import HomePage from "@/pages/HomePage";
import {isLoaded} from "@/state/isLoaded";

export function App() {
  useAuth();

  return (
      <TrpcProvider>
        <SiteTheme>
          <Switch>
            <AuthRoute type='auth' path='/'><HomePage /></AuthRoute>
            <AuthRoute type='guest' path='/login' lazy='LoginPage' />

            <Route path='/logout' lazy='LogoutPage' />
          </Switch>
        </SiteTheme>
      </TrpcProvider>
  );
}

function AuthRoute({type, ...rest}: RouteProps & {type: 'guest' | 'auth'}) {
  const userId = authStore.use('userId')[0];

  if (!isLoaded(userId)) {
    return <p>Loading...</p>;
  } else if (type === 'guest' && !!userId) {
    // Authenticated. Show the homepage.
    return <Redirect to='/' replace />;
  } else if (type === 'auth' && !userId) {
    // Unauthenticated.
    return <Redirect to='/login' replace />;
  }

  return <Route {...rest} />;
}

type RouteProps = PropsWithChildren<{path: `/${string}`, lazy?: 'LoginPage' | 'LogoutPage'}>;

// TODO(acorn1010): Use Foony FileUtils to get all possible components.
function Route(props: RouteProps) {
  const {children, path, lazy} = props;
  const LoadableComponent = useMemo(() => lazy ? loadable(() => import(`./pages/${lazy}`)) : null, [lazy]);

  return <Woute path={path}>{LoadableComponent ? <LoadableComponent /> : children}</Woute>;
}
