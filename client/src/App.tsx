import {useAuth} from "./auth/authStore";
import {LoginPage} from "./pages/LoginPage";
import {SiteTheme} from "./SiteTheme";
import {TrpcProvider} from "./TrpcProvider";

export function App() {
  useAuth();

  return (
      <div className='App'>
        <TrpcProvider>
          <SiteTheme>
            <LoginPage />
          </SiteTheme>
        </TrpcProvider>
      </div>
  );
}
