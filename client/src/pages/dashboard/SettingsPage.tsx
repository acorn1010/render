import {call, poll} from "@/api/call";
import {Button} from "@/components/base/buttons/Button";
import {ApiToken} from "@/components/inputs/ApiToken";
import {DashboardCard} from "@/components/cards/DashboardCard";

export default function SettingsPage() {
  return (
      <DashboardCard>
        <h1 className='text-3xl text-center mb-4'>Settings</h1>
        <div className='flex-center flex-col gap-4'>
          <ApiToken />
          <Button variant='destructive' onClick={async () => {
            const token = await call.refreshToken();
            if (token) {
              poll.update('getProfile')({token});
            }
          }}>Invalidate & Renew Token</Button>
        </div>
      </DashboardCard>
  );
}
