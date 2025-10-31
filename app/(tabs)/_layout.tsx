import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function Layout() {

    // Este Layout es para poder usar el Tabs
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ 
        title: 'Menu',
        headerShown: false,
        tabBarIcon: ({size}) => <Ionicons name ='home' size={size}/>
        }} 
        />
      
      <Tabs.Screen name="profile" options={{ 
        title: 'Perfil',
        headerShown: false,
        tabBarIcon: ({size}) => <Ionicons name ='person' size={size}/>
        }} 
        />

    </Tabs>
  )
}

