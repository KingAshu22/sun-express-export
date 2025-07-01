"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/auth/LoginForm"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const session = localStorage.getItem("session")
      if (session) {
        const sessionData = JSON.parse(session)
        const now = new Date().getTime()
        if (now < sessionData.expires) {
          setIsAuthenticated(true)
          router.push("/dashboard")
        } else {
          localStorage.removeItem("session")
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sun Express Export</h1>
          <p className="text-gray-600">Stock Management System</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
