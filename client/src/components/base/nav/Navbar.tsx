import {Avatar} from "@/components/base/avatar/Avatar";
import {authStore} from "@/auth/authStore";
import {NavTitle} from "@/components/base/nav/NavTitle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuItem
} from "@/components/base/menu/DropdownMenu";

export function Navbar() {
  return (
      <nav className='flex mx-4 my-2'>
        <NavTitle />
        <ProfileAvatar />
      </nav>
  );
}

function ProfileAvatar() {
  const [displayName] = authStore.use('displayName');
  const src = authStore.use('photoUrl')[0] ?? undefined;

  return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className='cursor-pointer hover:brightness-110 active:brightness-90' src={src}>
            {displayName}
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='mx-2'>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
