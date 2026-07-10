// App.js
// Entry point. Boots MeshChain and renders your v0 frontend.
// Replace the <PlaceholderUI> with your imported v0 screens.

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { MeshProvider, useMeshContext } from './src/context/MeshContext';

// ─── Drop your v0 screens here ────────────────────────────────────────────────
// import { RootNavigator } from './src/screens/RootNavigator';

function AppContent() {
  const { ready, identity, error } = useMeshContext();

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.error}>Failed to start: {error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={s.sub}>Starting MeshChain...</Text>
      </View>
    );
  }

  // ── Swap this out for your v0 root navigator ──────────────────────────────
  return (
    <View style={s.center}>
      <Text style={s.ready}>MeshChain ready</Text>
      <Text style={s.sub}>Identity: {identity?.shortId}</Text>
      <Text style={s.sub}>Drop your v0 screens in here</Text>
      {/* <RootNavigator /> */}
    </View>
  );
}

export default function App() {
  return (
    <MeshProvider>
      <AppContent />
    </MeshProvider>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  ready:  { color: '#22C55E', fontSize: 18, fontWeight: '600' },
  sub:    { color: '#6B7280', fontSize: 13, marginTop: 8 },
  error:  { color: '#EF4444', fontSize: 14, textAlign: 'center', padding: 24 },
});
