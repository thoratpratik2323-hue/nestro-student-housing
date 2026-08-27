import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import NestroLanding from './Landing.jsx'
import './index.css'

function Root() {
  const [showApp, setShowApp] = useState(false)
  if (showApp) return <App />
  return <NestroLanding onLaunchApp={() => setShowApp(true)} />
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
