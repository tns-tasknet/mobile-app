import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

export default function Layout() {

    // Este Layout es para poder usar el Drawer
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ 
        title: 'Order',
        headerShown: false,
        tabBarIcon: ({size}) => <Ionicons name ='document-text-outline' size={size}/>
        }} 
        />
      
      <Tabs.Screen name="chat" options={{ 
        title: 'Chat',
        headerShown: false,
        tabBarIcon: ({size}) => <Ionicons name ='chatbubble-ellipses-outline' size={size}/>
        }} 
        />

    </Tabs>
  )
}

