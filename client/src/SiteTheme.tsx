import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import React, {PropsWithChildren} from "react";
import './index.css'
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#18181b',  // slate-900
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        variant: 'contained',
      },
      styleOverrides: {
        root: {
          transition: 'none',
        },
      },
    },
  },
});

export function SiteTheme({children}: PropsWithChildren<{}>) {
  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
  );
}
