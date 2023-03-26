import {authStore} from "@/auth/authStore";
import {Redirect} from "wouter";
import DashboardHomePage from "@/pages/dashboard/DashboardHomePage";

export default function HomePage() {
  const userId = authStore.use('userId')[0];
  if (!userId) {
    return <Redirect to='/login' replace />;
  }

  return <DashboardHomePage />;
}
