import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Simulates a browser environment inside Node.js
    environment: 'happy-dom', 
    
    // Optional: Makes test functions like 'describe', 'test', and 'expect' 
    // globally available so you don't have to import them in every file.
    globals: true, 
  },
})