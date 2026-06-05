"use client";

import React from "react";
import { createTheme, MantineProvider, MantineColorsTuple } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import { NavigationProgress } from "@mantine/nprogress";
import { AuthProvider } from "./contexts/AuthContext";

// Define a unified FPT theme color palette (10 shades per Mantine requirement)
const fptBlue = [
  "#e8eff7",
  "#cddceb",
  "#9dbad9",
  "#6895c4",
  "#3f75b2",
  "#265fa3",
  "#1A3A5C", // primary/main
  "#142c48",
  "#0f2137",
  "#0a1626",
] as const;

const fptOrange = [
  "#fff1e6",
  "#ffe3cc",
  "#ffc499",
  "#ffa166",
  "#ff813c",
  "#F37021", // primary/main
  "#d65b14",
  "#a6430b",
  "#7a3005",
  "#4f1e01",
] as const;

const fptGreen = [
  "#eafaf1",
  "#d5f5e3",
  "#abebd2",
  "#72d9ab",
  "#3ebd82",
  "#23AC68", // primary/main
  "#1c8c53",
  "#156c3e",
  "#0f4d2a",
  "#082e16",
] as const;

const theme = createTheme({
  fontFamily: "var(--font-roboto), sans-serif",
  colors: {
    fptBlue: fptBlue as unknown as MantineColorsTuple,
    fptOrange: fptOrange as unknown as MantineColorsTuple,
    fptGreen: fptGreen as unknown as MantineColorsTuple,
  },
  primaryColor: "fptBlue",
});

// Import all Mantine stylesheet dependencies
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/dropzone/styles.css";
import "@mantine/charts/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MantineProvider theme={theme} defaultColorScheme="light" forceColorScheme="light">
        <Notifications />
        <NavigationProgress />
        <ModalsProvider>
          {children}
        </ModalsProvider>
      </MantineProvider>
    </AuthProvider>
  );
}
