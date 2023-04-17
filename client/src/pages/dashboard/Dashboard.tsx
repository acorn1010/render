import {authStore} from "@/auth/authStore";
import {PropsWithChildren} from "react";
import {Navbar} from "@/components/base/nav/Navbar";
import {Sidebar} from "@/components/base/nav/Sidebar";
import {Redirect, Switch} from "wouter";
import {Route} from "@/Route";
import DashboardHomePage from "@/pages/dashboard/DashboardHomePage";

export default function Dashboard() {
  return (
      <DashboardContainer>
        <Switch>
          <Route path='/'>
            <DashboardHomePage />
          </Route>
          <Route path='/getting-started' lazy={() => import('./GettingStartedPage')} />
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
          <div className='flex flex-col m-4 z-10 h-[calc(100vh-88px)] overflow-scroll'>{children}</div>
        </div>
      </div>
  );
}
