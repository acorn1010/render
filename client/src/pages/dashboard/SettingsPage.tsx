import {call, poll} from "@/api/call";
import {Button} from "@/components/base/buttons/Button";

export function SettingsPage() {
  return (
      <Button variant='destructive' onClick={async () => {
        const token = await call.refreshToken();
        if (token) {
          poll.update('getProfile')({token});
        }
      }}>Invalidate & Renew Token</Button>
  );
}
