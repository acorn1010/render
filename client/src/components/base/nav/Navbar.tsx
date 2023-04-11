import {Avatar} from "@/components/base/avatar/Avatar";
import {authStore, logout} from "@/auth/authStore";
import {NavTitle} from "@/components/base/nav/NavTitle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuItem
} from "@/components/base/menu/DropdownMenu";
import {cn} from "@/lib/utils";

export function Navbar({className}: {className?: string}) {
  return (
      <nav className={cn('flex px-4 py-2 bg-gray-900', className)}>
        <span className='grow' />
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
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )
}
