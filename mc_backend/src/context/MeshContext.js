// src/context/MeshContext.js
// React context that makes identity + ready state available globally.
// Wrap your root navigator with <MeshProvider> in App.js.

import React, { createContext, useContext } from 'react';
import { useMeshController } from '../hooks/useMesh';

const MeshContext = createContext(null);

export function MeshProvider({ children }) {
  const { ready, identity, error } = useMeshController();
  return (
    <MeshContext.Provider value={{ ready, identity, error }}>
      {children}
    </MeshContext.Provider>
  );
}

// Use this in any screen to get identity without prop drilling:
// const { identity } = useMeshContext();
export function useMeshContext() {
  const ctx = useContext(MeshContext);
  if (!ctx) throw new Error('useMeshContext must be used inside <MeshProvider>');
  return ctx;
}
