import { createTheme, ThemeOptions } from '@mui/material/styles';

export const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#5090D3',
    },
    secondary: {
      main: '#66B2FF',
    },
  },
};

const theme = createTheme(themeOptions);

theme.spacing(2);

export default theme;