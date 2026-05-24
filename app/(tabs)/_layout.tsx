import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';

function AnimatedTabIcon({
  focused,
  icon,
}: {
  focused: boolean;
  icon: any;
}) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.12 : 1,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.7,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity,
      }}
    >
      <Ionicons
        name={icon}
        size={22}
        color={focused ? '#6366F1' : '#94A3B8'}
      />
    </Animated.View>
  );
}

// Floating Animated Center Button
function AnimatedCenterButton({
  focused,
  onPress,
}: {
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.08 : 1,
      useNativeDriver: true,
      friction: 4,
    }).start();
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.centerWrapper,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.centerButton}
      >
        <View style={styles.gradientCircle}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </View>

        {/* Glow */}
        <View style={styles.glowRing} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Main Custom Tab Bar
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const activeRouteName = state.routes[state.index].name;
  if (['bookings/[id]', 'resources/[id]'].includes(activeRouteName)) {
    return null;
  }

  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];

    return (
      options.href !== null &&
      !['bookings/[id]', 'resources/[id]'].includes(route.name)
    );
  });

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: insets.bottom + 10,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.container}>
        {visibleRoutes.map((route: any, index: number) => {
          const originalIndex = state.routes.findIndex(
            (r: any) => r.key === route.key
          );

          const focused = state.index === originalIndex;

          const isCenter = index === 2;

          const iconMap: Record<string, any> = {
            index: focused ? 'home' : 'home-outline',

            'resources/index': focused
              ? 'business'
              : 'business-outline',

            book: 'add',

            'bookings/index': focused
              ? 'calendar'
              : 'calendar-outline',

            profile: focused
              ? 'person'
              : 'person-outline',
          };

          const icon = iconMap[route.name] || 'ellipse-outline';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Center FAB
          if (isCenter) {
            return (
              <AnimatedCenterButton
                key={route.key}
                focused={focused}
                onPress={onPress}
              />
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              onPress={onPress}
              style={styles.tab}
            >
              <View
                style={[
                  styles.iconContainer,
                  focused && styles.activeIconContainer,
                ]}
              >
                <AnimatedTabIcon
                  focused={focused}
                  icon={icon}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />

      <Tabs.Screen
        name="resources/index"
        options={{ title: 'Resources' }}
      />

      <Tabs.Screen
        name="book"
        options={{ title: 'Book' }}
      />

      <Tabs.Screen
        name="bookings/index"
        options={{ title: 'Bookings' }}
      />

      <Tabs.Screen
        name="bookings/[id]"
        options={{
          title: 'Booking Details',
          href: null,
        }}
      />

      <Tabs.Screen
        name="resources/[id]"
        options={{
          title: 'Resource Details',
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },

  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    width: '100%',
    maxWidth: 430,

    height: 62,

    paddingHorizontal: 10,

    borderRadius: 36,

    backgroundColor: 'rgba(255,255,255,0.96)',

    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',

    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: {
          width: 0,
          height: 12,
        },
        shadowOpacity: 0.12,
        shadowRadius: 22,
      },

      android: {
        elevation: 18,
      },
    }),
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },

  iconContainer: {
    width: 48,
    height: 48,

    borderRadius: 24,

    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  activeIconContainer: {
    backgroundColor: '#EEF2FF',
  },

  // Floating Action Button
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    marginTop: -38,
  },

  centerButton: {
    width: 68,
    height: 68,

    borderRadius: 34,

    alignItems: 'center',
    justifyContent: 'center',
  },

  gradientCircle: {
    width: 68,
    height: 68,

    borderRadius: 34,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#6366F1',

    borderWidth: 4,
    borderColor: '#FFFFFF',

    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: {
          width: 0,
          height: 10,
        },
        shadowOpacity: 0.45,
        shadowRadius: 18,
      },

      android: {
        elevation: 16,
      },
    }),
  },

  glowRing: {
    position: 'absolute',

    width: 76,
    height: 76,

    borderRadius: 38,

    borderWidth: 2,

    borderColor: 'rgba(99,102,241,0.18)',
    top: -4,
    left: -4,
  },
});