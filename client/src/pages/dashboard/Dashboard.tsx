import {authStore} from "@/auth/authStore";
import {PropsWithChildren} from "react";
import {Navbar} from "@/components/base/nav/Navbar";
import {Sidebar} from "@/components/base/nav/Sidebar";
import {Redirect, Switch} from "wouter";
import {Route} from "@/Route";

export default function Dashboard() {
  const displayName = authStore.use('displayName')[0];

  return (
      <DashboardContainer>
        <Switch>
          <Route path='/'>
            <p>Welcome back, {displayName}</p>
            <p>
              More coming soon(TM). For now, you can refresh your API token and see the number of
              monthly page renders you've had.
            </p>
          </Route>
          <Route path='/worker' lazy={() => import('./GettingStartedPage')} />
          <Route path='/settings' lazy={() => import('./SettingsPage')} />
          <Route>
            <Redirect to='/404' />
          </Route>
        </Switch>
      </DashboardContainer>
  );
}

/** Adds a Navbar / side panel to the dashboard. Included in every dashboard route. */
function DashboardContainer({children}: PropsWithChildren<{}>) {
  return (
      <div className='flex h-full min-h-[100vh]'>
        <Sidebar />
        <div className='flex flex-col w-full relative'>
          <Navbar />
          <div className='flex flex-col m-4 z-10'>{children}</div>
        </div>
      </div>
  );
}
