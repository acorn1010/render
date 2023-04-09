import {authStore} from "@/auth/authStore";
import {PropsWithChildren} from "react";
import {ApiToken} from "@/components/inputs/ApiToken";
import {SettingsPage} from "@/pages/dashboard/SettingsPage";
import {Navbar} from "@/components/base/nav/Navbar";

export default function DashboardHomePage() {
  const displayName = authStore.use('displayName')[0];

  return (
      <DashboardContainer>
        <div className='flex-center flex-col m-auto gap-4'>
          <ApiToken />
          <p>
            More coming soon(TM). For now, you can refresh your API token and see the number of
            monthly page renders you've had.
          </p>
          <p>Welcome back, {displayName}</p>
          <SettingsPage />
        </div>
      </DashboardContainer>
  );
}

/** Adds a Navbar / side panel to the dashboard. Included in every dashboard route. */
function DashboardContainer({children}: PropsWithChildren<{}>) {
  return (
      <>
        <Navbar />
        {children}
      </>
  );
}
