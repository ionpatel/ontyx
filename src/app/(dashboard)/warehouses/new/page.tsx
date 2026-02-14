"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface ZoneInput {
  name: string
  code: string
  type: string
  capacity: string
}

export default function NewWarehousePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    city: "",
    country: "USA",
    phone: "",
    email: "",
    managerName: "",
    capacity: "",
    isDefault: false,
  })
  const [zones, setZones] = useState<ZoneInput[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    router.push("/warehouses")
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addZone = () => {
    setZones(prev => [...prev, { name: "", code: "", type: "storage", capacity: "" }])
  }

  const updateZone = (index: number, field: keyof ZoneInput, value: string) => {
    setZones(prev => prev.map((z, i) => i === index ? { ...z, [field]: value } : z))
  }

  const removeZone = (index: number) => {
    setZones(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/warehouses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Warehouse</h1>
          <p className="text-muted-foreground">Add a new warehouse location</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Warehouse identification details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Warehouse Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., MAIN, EAST"
                    value={formData.code}
                    onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="0"
                    placeholder="e.g., 10000"
                    value={formData.capacity}
                    onChange={(e) => handleChange("capacity", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Warehouse"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => handleChange("isDefault", checked as boolean)}
                />
                <Label htmlFor="isDefault" className="text-sm font-normal">
                  Set as default warehouse
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Physical address and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Warehouse St"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleChange("country", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 555-0100"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="warehouse@company.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerName">Manager Name</Label>
                <Input
                  id="managerName"
                  placeholder="John Smith"
                  value={formData.managerName}
                  onChange={(e) => handleChange("managerName", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zones */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Zones</CardTitle>
              <CardDescription>Define storage zones within this warehouse (optional)</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addZone}>
              <Plus className="mr-2 h-4 w-4" /> Add Zone
            </Button>
          </CardHeader>
          <CardContent>
            {zones.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No zones added. Click &quot;Add Zone&quot; to create zones.
              </p>
            ) : (
              <div className="space-y-4">
                {zones.map((zone, index) => (
                  <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                    <div className="flex-1 grid gap-4 sm:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Zone Name</Label>
                        <Input
                          placeholder="Storage A"
                          value={zone.name}
                          onChange={(e) => updateZone(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input
                          placeholder="STA"
                          value={zone.code}
                          onChange={(e) => updateZone(index, "code", e.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={zone.type}
                          onValueChange={(value) => updateZone(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="storage">Storage</SelectItem>
                            <SelectItem value="picking">Picking</SelectItem>
                            <SelectItem value="receiving">Receiving</SelectItem>
                            <SelectItem value="shipping">Shipping</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Capacity</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="1000"
                          value={zone.capacity}
                          onChange={(e) => updateZone(index, "capacity", e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeZone(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/warehouses">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Warehouse
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
