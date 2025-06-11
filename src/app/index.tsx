import { View, Text, Button } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

const index = () => {
  return (
    <SafeAreaView>
      <Text>Welcome to Tasque!</Text>


      <Button
        title="Go to Tasks"
        onPress={() => {
          router.push('/(tabs)')
        }}
        />
    </SafeAreaView>
  )
}

export default index