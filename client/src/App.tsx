import {Button} from "./components/buttons/Button";
import {signInWithProvider, useAuth} from "./auth/authStore";
import './App.css'

export function App() {
  useAuth();

  return (
    <div className="App">
      <LoginPage />
    </div>
  )
}

function LoginPage() {
  return (
      <div className='flex flex-col'>
        <Button onClick={() => signInWithProvider('google')}>
          Log In With Google
        </Button>
        <Button onClick={() => signInWithProvider('github')}>
          Log In With GitHub
        </Button>
      </div>
  );
}
