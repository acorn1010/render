import {Button} from "@/components/base/buttons/Button";
import {AuthProviderId, signInWithProvider} from "@/auth/authStore";
import {ReactElement} from "react";
import {FaGithub, FaGoogle} from "react-icons/all";

const PROVIDER_BUTTONS = {
  google: {name: 'Google', logo: FaGoogle},
  github: {name: 'GitHub', logo: FaGithub},
} satisfies {[provider in AuthProviderId]: {name: string, logo: (props: {className?: string}) => ReactElement}};

export default function LoginPage() {
  return (
      <div className='flex-center flex-col gap-2 m-auto'>
        <h1 className='text-3xl font-semibold'>Log In</h1>
        <LoginButton provider='google' />
        <LoginButton provider='github' />
      </div>
  );
}

function LoginButton({provider}: {provider: keyof typeof PROVIDER_BUTTONS}) {
  const {name, logo: Logo} = PROVIDER_BUTTONS[provider];
  return (
      <Button className='flex-center whitespace-nowrap rounded w-56' onClick={() => signInWithProvider(provider)}>
        <Logo className='h-5 mx-2' /> {name}
      </Button>
  );
}
