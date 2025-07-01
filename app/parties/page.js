"use client"

import { useState, useEffect } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2 } from "lucide-react"

export default function Parties() {
  const [parties, setParties] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParty, setEditingParty] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact: "",
    email: "",
    gstNumber: "",
    type: "purchase", // purchase or sales
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchParties()
  }, [])

  const fetchParties = async () => {
    try {
      const response = await fetch("/api/parties")
      if (response.ok) {
        const data = await response.json()
        setParties(data)
      }
    } catch (error) {
      console.error("Error fetching parties:", error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingParty ? `/api/parties/${editingParty._id}` : "/api/parties"
      const method = editingParty ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Party ${editingParty ? "updated" : "created"} successfully`,
        })
        setIsDialogOpen(false)
        setEditingParty(null)
        setFormData({
          name: "",
          address: "",
          contact: "",
          email: "",
          gstNumber: "",
          type: "purchase",
        })
        fetchParties()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.message || "Something went wrong",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (party) => {
    setEditingParty(party)
    setFormData({
      name: party.name,
      address: party.address,
      contact: party.contact,
      email: party.email,
      gstNumber: party.gstNumber,
      type: party.type,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this party?")) return

    try {
      const response = await fetch(`/api/parties/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Party deleted successfully",
        })
        fetchParties()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete party",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Parties</h1>
            <p className="text-gray-600">Manage your business parties</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingParty(null)
                  setFormData({
                    name: "",
                    address: "",
                    contact: "",
                    email: "",
                    gstNumber: "",
                    type: "purchase",
                  })
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Party
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingParty ? "Edit Party" : "Add New Party"}</DialogTitle>
                <DialogDescription>
                  {editingParty ? "Update party information" : "Enter party details to add them to your system"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Party Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Party Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select party type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase Party</SelectItem>
                      <SelectItem value="sales">Sales Party</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Input id="contact" name="contact" value={formData.contact} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Please wait..." : editingParty ? "Update Party" : "Add Party"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parties.map((party) => (
            <Card key={party._id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <div>
                    <span>{party.name}</span>
                    <div className="text-sm font-normal text-gray-500 mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          party.type === "purchase" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {party.type === "purchase" ? "Purchase Party" : "Sales Party"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(party)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(party._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Address:</strong> {party.address}
                  </p>
                  <p>
                    <strong>Contact:</strong> {party.contact}
                  </p>
                  <p>
                    <strong>Email:</strong> {party.email}
                  </p>
                  <p>
                    <strong>GST:</strong> {party.gstNumber}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {parties.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No parties found. Add your first party to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
