import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const features = [
  {
    id: 1,
    icon: 'task-alt',
    iconType: 'MaterialIcons',
    title: 'Smart Task Management',
    description: 'Create, organize, and track your tasks with intelligent priority sorting and due date reminders.',
    color: '#4F46E5',
    bgColor: '#EEF2FF'
  },
  {
    id: 2,
    icon: 'filter-list',
    iconType: 'MaterialIcons',
    title: 'Advanced Filtering',
    description: 'Filter tasks by status, priority, or due date. Find exactly what you need, when you need it.',
    color: '#059669',
    bgColor: '#ECFDF5'
  },
  {
    id: 3,
    icon: 'video-library',
    iconType: 'MaterialIcons',
    title: 'Offline Video Library',
    description: 'Download and watch educational videos offline. Perfect for learning on the go without internet.',
    color: '#DC2626',
    bgColor: '#FEF2F2'
  },
  {
    id: 4,
    icon: 'cloud-sync',
    iconType: 'MaterialIcons',
    title: 'Smart Sync',
    description: 'Your tasks sync seamlessly across devices while videos are stored locally for offline access.',
    color: '#7C3AED',
    bgColor: '#F3E8FF'
  }
];

const WelcomeScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(0);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Pulse animation for the logo
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleGetStarted = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.push('/(tabs)/Dashboard');
    });
  };

  const renderIcon = (iconName: string, iconType: string, color: string, size: number = 24) => {
    switch (iconType) {
      case 'MaterialIcons':
        return <MaterialIcons name={iconName as any} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName as any} size={size} color={color} />;
      case 'Ionicons':
        return <Ionicons name={iconName as any} size={size} color={color} />;
      default:
        return <MaterialIcons name="star" size={size} color={color} />;
    }
  };

  const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      }}
      className="bg-white rounded-2xl p-6 mx-4 mb-4 shadow-lg"
    >
      <View className="flex-row items-start">
        <View 
          className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
          style={{ backgroundColor: feature.bgColor }}
        >
          {renderIcon(feature.icon, feature.iconType, feature.color, 24)}
        </View>
        
        <View className="flex-1">
          <Text className="text-gray-900 text-lg font-bold mb-2">
            {feature.title}
          </Text>
          <Text className="text-gray-600 text-sm leading-5">
            {feature.description}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1F2937', '#374151', '#4B5563']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Header Section */}
          <View className="items-center pt-12 pb-8 px-6">
            {/* App Logo/Icon */}
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
              className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-6 shadow-xl"
            >
              <MaterialIcons name="task-alt" size={48} color="#4F46E5" />
            </Animated.View>

            {/* App Title */}
            <Animated.Text
              style={{
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
              className="text-white text-4xl font-bold mb-3"
            >
              Welcome to Tasque
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text
              style={{
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              }}
              className="text-gray-300 text-lg text-center leading-6 px-4"
            >
              Your all-in-one productivity companion for task management and offline learning
            </Animated.Text>
          </View>

          {/* Features Section */}
          <View className="px-2">
            <Animated.Text
              style={{
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              }}
              className="text-white text-2xl font-bold text-center mb-6"
            >
              What makes Tasque special?
            </Animated.Text>

            {features.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 0],
                  }),
                },
              ],
            }}
            className="mx-4 mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6"
          >
            <Text className="text-white text-xl font-bold text-center mb-4">
              Built for Productivity
            </Text>
            
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">∞</Text>
                <Text className="text-gray-300 text-sm mt-1">Tasks</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">📱</Text>
                <Text className="text-gray-300 text-sm mt-1">Offline Ready</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">⚡</Text>
                <Text className="text-gray-300 text-sm mt-1">Fast Sync</Text>
              </View>
            </View>
          </Animated.View>


          <View className="px-6 mt-8">

            <Animated.View
              style={{
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [70, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                onPress={handleGetStarted}
                activeOpacity={0.8}
                className="bg-white rounded-2xl py-4 px-6 mb-4 shadow-xl"
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-gray-900 text-lg font-bold mr-2">
                    Get Started
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#1F2937" />
                </View>
              </TouchableOpacity>
            </Animated.View>


            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [80, 0],
                    }),
                  },
                ],
              }}
              className="flex-row justify-center space-x-6 gap-4"
            >
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/Dashboard')}
                className="flex-row items-center bg-white/20 backdrop-blur-lg rounded-xl py-3 px-4"
              >
                <MaterialIcons name="task" size={16} color="#FFFFFF" />
                <Text className="text-white text-sm font-medium ml-2">
                  View Tasks
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(tabs)/OfflineVideoScreen')}
                className="flex-row items-center bg-white/20 backdrop-blur-lg rounded-xl py-3 px-4"
              >
                <MaterialIcons name="video-library" size={16} color="#FFFFFF" />
                <Text className="text-white text-sm font-medium ml-2">
                  Watch Videos
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>


          <Animated.View
            style={{ opacity: fadeAnim }}
            className="items-center mt-8 mb-4"
          >
            <Text className="text-gray-400 text-sm text-center">
              Start your productivity journey today
            </Text>
            <View className="flex-row items-center mt-2">
              <View className="w-2 h-2 bg-white rounded-full mx-1" />
              <View className="w-2 h-2 bg-white/60 rounded-full mx-1" />
              <View className="w-2 h-2 bg-white/30 rounded-full mx-1" />
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;