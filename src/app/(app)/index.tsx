import React from 'react';
import { Redirect } from 'expo-router';

export default function AppIndexRoute() {
  return <Redirect href="/(app)/dashboard" />;
}
