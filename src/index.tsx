import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import Scaffold, {loaderEdit, loaderPlay} from './Scaffold';
import theme from './theme';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Scaffold />
  },
  {
    path: "/:story",
    element: <Scaffold />,
    loader: loaderEdit
  },
  {
    path: "/:story/play",
    element: <Scaffold />,
    loader: loaderPlay
  }
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
