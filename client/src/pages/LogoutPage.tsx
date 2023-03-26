import {useEffect} from "react";
import {logout} from "@/auth/authStore";
import {useLocation} from "wouter";

export default function LogoutPage() {
  const [, navigate] = useLocation();
  useEffect(() => {
    (async () => {
      await logout();
      navigate('/');
    })();
  }, [navigate]);

  return <p>Logging out...</p>;
}
