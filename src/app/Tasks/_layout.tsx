import { Stack } from 'expo-router'
import React from 'react'

const _layout = () => {
  return (
    <Stack>
        <Stack.Screen
          name="AddEditTaskScreen"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="TaskDetailsScreen"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
    </Stack>
  )
}

export default _layout