import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ label, color }) {
  return <Text style={{ color, fontWeight: '800', fontSize: 12 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: 64,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon label="H" color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => <TabIcon label="C" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <TabIcon label="S" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => <TabIcon label="N" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <TabIcon label="M" color={color} />,
        }}
      />
    </Tabs>
  );
}
