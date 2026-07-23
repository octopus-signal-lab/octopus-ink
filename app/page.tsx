import AppPage from "./app/page";
import SplashPage from "./splash/page";

export default function HomePage() {
  if (process.env.TAURI_BUILD === "1") {
    return <AppPage />;
  }

  return <SplashPage />;
}
