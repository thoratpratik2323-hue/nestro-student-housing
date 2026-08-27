import React, { useState } from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import NestroLanding from "./Landing.jsx"
import "./index.css"

function Root() {
  // Remember if user already launched the app (persists across refreshes)
  const [showApp, setShowApp] = useState(
    () => localStorage.getItem("nestro_launched") === "1"
  )

  const handleLaunch = () => {
    localStorage.setItem("nestro_launched", "1")
    setShowApp(true)
  }

  if (showApp) return <App />
  return <NestroLanding onLaunchApp={handleLaunch} />
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />)