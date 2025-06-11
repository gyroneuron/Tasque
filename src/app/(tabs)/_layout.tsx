import React from 'react'
import { Tabs } from 'expo-router'

const TabLayout = () => {
  return (
    <Tabs>
      <Tabs.Screen
        name="OfflineVideoScreen"
        options={{
          title: 'Tasks',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />
    </Tabs>
  )
}

export default TabLayout