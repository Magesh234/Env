// preload runs in the renderer before your page loads
// you can expose safe Node APIs to the frontend here if needed later
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload ready')
})