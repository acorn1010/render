import {useAuth} from "./auth/authStore";
import {SiteTheme} from "./SiteTheme";
import {Switch} from "wouter";
import Dashboard from "@/pages/dashboard/Dashboard";
import * as React from "react";
import {AuthRoute, Route} from "@/Route";

export function App() {
  return (
      <>
        <AuthUpdater />
        <SiteTheme>
          <Switch>
            <AuthRoute type='guest' path='/login' lazy={() => import('./pages/LoginPage')} />
            <Route path='/logout' lazy={() => import('./pages/LogoutPage')} />
            <Route path='/404' lazy={() => import('./pages/NotFoundPage')} />

            {/* Dashboard routes. Because dashboard is at the root, we need a catch-all */}
            <AuthRoute type='auth'><Dashboard /></AuthRoute>
          </Switch>
        </SiteTheme>
      </>
  );
}

function AuthUpdater() {
  useAuth();
  return null;
}
