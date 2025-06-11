import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, 
TouchableOpacity, Text
 } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '@/src/utils/Responsive';

// Custom Tab Bar Icons Component
const TabBarIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  let iconName = '';
  let iconSize = scale(24);
  let iconColor = focused ? '#552BFF' : '#8E8E93';

  switch (name) {
    case 'Dashboard':
      iconName = focused ? 'list' : 'list-outline';
      break;
    case 'OfflineVideoScreen':
      iconName = focused ? 'videocam' : 'videocam-outline';
      break;
    default:
      iconName = focused ? 'ellipse' : 'ellipse-outline';
  }

  return (
    <Ionicons name={iconName as any} size={iconSize} color={iconColor} style={styles.tabIcon} />
  );
};

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <BlurView
      intensity={90}
      tint="systemMaterial"
      style={styles.tabBarContainer}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
            ? options.title 
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabItemContent,
                isFocused && styles.tabItemContentFocused
              ]}>
                <TabBarIcon name={route.name} focused={isFocused} />
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? '#552BFF' : '#8E8E93' }
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

const TabLayout = () => {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="OfflineVideoScreen"
        options={{
          title: 'Videos',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon name="OfflineVideoScreen" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.8)' : '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for iOS safe area
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
  },
  tabItemContentFocused: {
    backgroundColor: 'rgba(85, 43, 255, 0.1)',
  },
  tabIcon: {
    fontSize: scale(20),
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: scale(11),
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default TabLayout;