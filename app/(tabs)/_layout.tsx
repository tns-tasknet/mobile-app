import { Drawer } from 'expo-router/drawer'
import React from 'react'

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

