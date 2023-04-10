import {Link, useLocation} from "wouter";
import {cn} from "@/lib/utils";
import {IconType} from "react-icons";
import {FaCog, FaHome, FaPlayCircle} from "react-icons/all";

type NavLinkProps = {name: string, to: string, icon: IconType};
const navigation = [
  {name: 'Dashboard', to: '/', icon: FaHome},
] as const satisfies ReadonlyArray<NavLinkProps>;

const docs = [
  {name: 'Getting Started', to: '/worker', icon: FaPlayCircle},
] as const satisfies ReadonlyArray<NavLinkProps>;

export function Sidebar({className}: {className?: string}) {
  return (
      <div className="flex grow overflow-hidden relative flex-col items-center gap-y-5 overflow-y-auto bg-blue-800 min-w-[64px] w-16 lg:w-56">
        <Background />
        <div className="flex-center h-14 shrink-0 bg-blue-950 w-full z-10">
          <img
              className="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=blue&shade=500"
              alt="Created by Acorn1010"
          />
        </div>
        <nav className="flex flex-1 flex-col w-full z-10">
          <ul role="list" className="flex w-full flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="mx-2 space-y-1">
                {navigation.map((item, idx) => <NavLink key={idx} {...item} />)}
              </ul>
            </li>
            <li>
              <div className="text-xs mx-4 font-semibold leading-6 text-blue-300">Docs</div>
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
                    ? 'bg-blue-600 text-white active:bg-blue-900'
                    : 'text-blue-300 hover:text-white hover:bg-blue-700 active:bg-blue-900',
                'group flex justify-center lg:justify-start gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold whitespace-nowrap'
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
                    ? 'bg-blue-600 text-white active:bg-blue-900'
                    : 'text-white hover:bg-blue-700 active:bg-blue-900',
                'group flex-center py-3 gap-x-4 text-base leading-6 font-semibold whitespace-nowrap'
            )}
        >
          <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className='hidden lg:block'>{name}</span>
        </Link>
      </li>
  );
}

function Background() {
  return (
      <>
        <div className='bg-blue-700 absolute pointer-events-none rotate-45 inset-0 opacity-30' />
      </>
  );
}
