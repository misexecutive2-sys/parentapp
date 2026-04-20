import React, { createContext, useContext, useState } from "react";

export type Theme = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  card: string;
};

const defaultTheme: Theme = {
  primary: "#0047AB",
  secondary: "#F5F7FA",
  background: "#ffffff",
  text: "#222222",
  card: "#ffffff",
};

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: defaultTheme,
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(defaultTheme);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
