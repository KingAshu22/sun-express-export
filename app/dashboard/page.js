"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Users, TrendingUp, TrendingDown, Download } from "lucide-react"

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalParties: 0,
    totalItems: 0,
    totalInward: 0,
    totalOutward: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Add this function at the top of the component
  const formatAmount = (amount) => {
    return Number.parseFloat(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })
  }

  useEffect(() => {
    const checkAuth = () => {
      const session = localStorage.getItem("session")
      if (!session) {
        router.push("/")
        return
      }

      const sessionData = JSON.parse(session)
      const now = new Date().getTime()
      if (now >= sessionData.expires) {
        localStorage.removeItem("session")
        router.push("/")
        return
      }

      setUser(sessionData.user)
      fetchStats()
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const exportToCSV = async () => {
    try {
      const response = await fetch("/api/export/csv")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `stock-summary-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parties</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.totalParties)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatAmount(stats.totalItems)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Inward</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatAmount(stats.totalInward)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Outward</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatAmount(stats.totalOutward)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your inventory efficiently</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => router.push("/parties")} className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Parties
              </Button>
              <Button onClick={() => router.push("/stock/opening")} className="w-full justify-start" variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Opening Stock
              </Button>
              <Button onClick={() => router.push("/stock/inward")} className="w-full justify-start" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Stock Inward
              </Button>
              <Button onClick={() => router.push("/stock/outward")} className="w-full justify-start" variant="outline">
                <TrendingDown className="mr-2 h-4 w-4" />
                Stock Outward
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest stock movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500">No recent activity to display</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
