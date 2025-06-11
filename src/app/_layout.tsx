import React from "react";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@/src/store/index";
import '@/global.css'

const RootLayout = () => {
  return (
    <Provider store={store}>
      <Stack
        screenOptions={{
          animation: "ios_from_right",
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="Tasks" />
      </Stack>
    </Provider>
  );
};

export default RootLayout;
