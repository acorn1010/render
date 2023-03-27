import {Button} from "@/components/buttons/Button";
import {authStore, logout} from "@/auth/authStore";
import {useState} from "react";

export default function DashboardHomePage() {
  const displayName = authStore.use('displayName')[0];

  return (
      <div className='flex-center flex-col m-auto gap-2'>
        <p>Pretty dashboard. Make a token!</p>
        <p>Welcome back, {displayName}</p>
        <LogoutButton />
      </div>
  );
}

function LogoutButton() {
  const [isSending, setIsSending] = useState(false);

  const handleClick = async () => {
    try {
      setIsSending(true);
      await logout();
    } finally {
      setIsSending(false);
    }
  };

  return <Button disabled={isSending} onClick={handleClick}>Logout</Button>;
}
