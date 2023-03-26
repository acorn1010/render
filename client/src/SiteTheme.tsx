import React, {PropsWithChildren} from "react";
import './index.css'
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export function SiteTheme({children}: PropsWithChildren<{}>) {
  return <>{children}</>;
}
