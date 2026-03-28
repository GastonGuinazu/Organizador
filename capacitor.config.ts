import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.organizador.app",
  appName: "Organizador",
  webDir: "capacitor-www",
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
