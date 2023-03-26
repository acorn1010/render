import {useAuth} from "./auth/authStore";
import {SiteTheme} from "./SiteTheme";
import {TrpcProvider} from "./TrpcProvider";
import {Route, Switch} from "wouter";
import loadable from "@loadable/component";
import {useMemo} from "react";
import HomePage from "@/pages/HomePage";

export function App() {
  useAuth();

  return (
      <TrpcProvider>
        <SiteTheme>
          <Switch>
            <Route path='/'><HomePage /></Route>
            <Woute path='/login' lazy='LoginPage' />
            <Woute path='/logout' lazy='LogoutPage' />
          </Switch>
        </SiteTheme>
      </TrpcProvider>
  );
}

// TODO(acorn1010): Use Foony FileUtils to get all possible components.
function Woute({path, lazy}: {path: `/${string}`, lazy: 'LoginPage' | 'LogoutPage'}) {
  const LoadableComponent = useMemo(() => loadable(() => import(`./pages/${lazy}`)), [lazy]);
  return <Route path={path}><LoadableComponent /></Route>;
}
