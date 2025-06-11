import { View, Text, Button } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

const index = () => {
  return (
    <SafeAreaView>
      <Text>Welcome to Tasque</Text>

        <Text>Navigate to the Tasks tab to manage your tasks</Text>
        <Text>Use the bottom navigation to switch between tabs</Text>
        <Text>Explore the app and enjoy task management!</Text>
        <Text>Happy Tasking!</Text>


        <Button
          title="Go to Tasks"
          onPress={() => {
           router.push('/(tabs)/OfflineVideoScreen')
          }}
        />
    </SafeAreaView>
  )
}

export default index