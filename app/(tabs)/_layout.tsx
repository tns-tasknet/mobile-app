import { Drawer } from 'expo-router/drawer'

export default function Layout() {

    // Este Layout es para poder usar el Drawer
  return (
    <Drawer>
      <Drawer.Screen name="dashboard" options={{ 
        title: 'Menu Principal',
        }} 
        />


    </Drawer>
  )
}

