<template>
  <router-view />
</template>

<script setup></script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto',
    'Helvetica Neue', sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  background-color: var(--bg-secondary);
}

/* Enhanced scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-medium);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-dark);
}

/* Focus outline improvements */
*:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}

/* Selection styling */
::selection {
  background-color: rgba(79, 70, 229, 0.2);
  color: var(--text-primary);
}
</style>
