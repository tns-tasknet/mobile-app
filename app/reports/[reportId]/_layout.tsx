import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function Layout() {

    // Este Layout es para poder usar el Tabs
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ 
        title: 'Report',
        headerShown: false,
        tabBarIcon: ({size}) => <Ionicons name ='home' size={size}/>
        }} 
        />

        <Tabs.Screen name="rectification" options={{ 
        title: 'Rectification',
        headerShown: false,
        tabBarIcon: ({size}) => <Ionicons name ='clipboard-outline' size={size}/>
        }} 
        />
      

    </Tabs>
  )
}

