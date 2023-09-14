import {Link, useLocation} from "wouter";
import {cn} from "@/lib/utils";
import {IconType} from "react-icons";
import {FaCog, FaHome, FaPlayCircle} from "react-icons/all";

type NavLinkProps = {name: string, to: string, icon: IconType};
const navigation = [
  {name: 'Dashboard', to: '/', icon: FaHome},
] as const satisfies ReadonlyArray<NavLinkProps>;

const docs = [
  {name: 'Getting Started', to: '/getting-started', icon: FaPlayCircle},
] as const satisfies ReadonlyArray<NavLinkProps>;

export function Sidebar() {
  return (
      <div className="flex grow flex-col items-center overflow-y-auto bg-slate-900/50 min-w-[64px] w-16 lg:w-56 lg:min-w-[224px] from-slate-950/30 bg-gradient-to-t border-r border-slate-800/50 shadow">
        <div className="flex-center h-14 shrink-0 w-full z-10">
          <img
              className="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=500"
              alt="Created by Acorn1010"
              />
        </div>
        <nav className="flex flex-1 flex-col w-full z-10 relative overflow-hidden pt-5">
          <Background />
          <ul role="list" className="flex w-full flex-1 flex-col gap-y-7 z-10">
            <li>
              <ul role="list" className="mx-2 space-y-1">
                {navigation.map((item, idx) => <NavLink key={idx} {...item} />)}
              </ul>
            </li>
            <li>
              <div className="text-xs mx-4 font-semibold leading-6 text-gray-300">Docs</div>
              <ul role="list" className="mx-2 space-y-1">
                {docs.map((item, idx) => <NavLink key={idx} {...item} />)}
              </ul>
            </li>
            <BottomNavLink name='Settings' to='/settings' icon={FaCog} />
          </ul>
        </nav>
      </div>
  );
}

function NavLink({name, to, icon: Icon}: NavLinkProps) {
  const location = useLocation()[0];
  const isCurrent = location === to;
  return (
      <li key={name}>
        <Link
            to={to}
            className={cn(
                isCurrent
                    ? 'bg-slate-700/70 active:bg-slate-800 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700/30 active:bg-slate-700/20',
                'group flex justify-center lg:justify-start gap-x-3 rounded-md p-2 text-sm leading-6 font-normal whitespace-nowrap'
            )}
        >
          <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className='hidden lg:block'>{name}</span>
        </Link>
      </li>
  );
}

function BottomNavLink({name, to, icon: Icon}: NavLinkProps) {
  const location = useLocation()[0];
  const isCurrent = location === to;
  return (
      <li key={name} className='mt-auto w-full'>
        <Link
            to={to}
            className={cn(
                isCurrent
                    ? 'bg-slate-700/70 text-white active:bg-slate-800'
                    : 'text-white hover:bg-slate-700/30 active:bg-slate-700',
                'group flex-center py-3 gap-x-4 text-base leading-6 font-normal whitespace-nowrap'
            )}
        >
          <Icon className={cn("h-6 w-6 shrink-0", !isCurrent && 'group-hover:animate-spin')} aria-hidden="true" />
          <span className='hidden lg:block'>{name}</span>
        </Link>
      </li>
  );
}

function Background() {
  return (
      <>
        <div className='bg-transparent absolute pointer-events-none origin-top-left left-full top-0 w-[300%] h-[150%] opacity-50 from-slate-700 bg-gradient-to-b' />
      </>
  );
}
