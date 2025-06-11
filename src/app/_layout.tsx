import React from 'react'
import { Stack } from 'expo-router'

const RootLayout = () => {
  return (
    <Stack
        screenOptions={{
            animation: 'ios_from_right',
            headerShown: false,
        }}
        initialRouteName='(tabs)'
    >
        <Stack.Screen
            name="(tabs)"
        />
    </Stack>
  )
}

export default RootLayout