"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Package, Loader2, Plus, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useCategories } from "@/hooks/use-inventory"
import { inventoryService } from "@/services/inventory"
import { motion } from "framer-motion"


export default function NewProductPage() {
  const router = useRouter()
  const { categories, createCategory } = useCategories()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [formData, setFormData] = useState({
    sku: "",
    barcode: "",
    name: "",
    description: "",
    categoryId: "",
    unitPrice: "",
    costPrice: "",
    taxRate: "13",
    stockQuantity: "0",
    reorderLevel: "10",
    reorderQuantity: "50",
    unit: "piece",
    weight: "",
    length: "",
    width: "",
    height: "",
    isService: false, // NEW: Service vs Physical product
  })

  // Validate form before submit
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.sku.trim()) {
      errors.sku = "SKU is required"
    }
    if (!formData.name.trim()) {
      errors.name = "Product name is required"
    }
    if (!formData.categoryId) {
      errors.categoryId = "Please select a category"
    }
    if (!formData.unitPrice || parseFloat(formData.unitPrice) < 0) {
      errors.unitPrice = "Please enter a valid selling price"
    }
    if (!formData.costPrice || parseFloat(formData.costPrice) < 0) {
      errors.costPrice = "Please enter a valid cost price"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate first
    if (!validateForm()) {
      setError("Please fix the errors below before saving")
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await inventoryService.createProduct({
        sku: formData.sku,
        barcode: formData.barcode || undefined,
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        costPrice: parseFloat(formData.costPrice) || 0,
        taxRate: parseFloat(formData.taxRate) || 13,
        stockQuantity: formData.isService ? 0 : (parseInt(formData.stockQuantity) || 0),
        reorderLevel: formData.isService ? 0 : (parseInt(formData.reorderLevel) || 10),
        reorderQuantity: formData.isService ? 0 : (parseInt(formData.reorderQuantity) || 50),
        unit: formData.unit,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        dimensions: formData.length || formData.width || formData.height ? {
          length: parseFloat(formData.length) || 0,
          width: parseFloat(formData.width) || 0,
          height: parseFloat(formData.height) || 0,
        } : undefined,
        isService: formData.isService,
      })
      
      router.push("/inventory")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product")
    } finally {
      setLoading(false)
    }
  }
  
  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    
    setCreatingCategory(true)
    try {
      const newCat = await createCategory({ name: newCategoryName.trim() })
      if (newCat) {
        setFormData(prev => ({ ...prev, categoryId: newCat.id }))
        setValidationErrors(prev => ({ ...prev, categoryId: "" }))
      }
      setShowCategoryDialog(false)
      setNewCategoryName("")
    } catch (err) {
      console.error("Failed to create category:", err)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    if (field === "isService") {
      setFormData(prev => ({ ...prev, isService: value === "true" }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Demo Mode Banner */}
      { false && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
        >
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Demo Mode:</strong> Product will be created in memory only.
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
          <p className="text-muted-foreground">Add a new product to your inventory</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>Product identification and categorization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      placeholder="PROD-001"
                      value={formData.sku}
                      onChange={(e) => {
                        handleChange("sku", e.target.value)
                        setValidationErrors(prev => ({ ...prev, sku: "" }))
                      }}
                      className={validationErrors.sku ? "border-destructive" : ""}
                    />
                    {validationErrors.sku && (
                      <p className="text-sm text-destructive">{validationErrors.sku}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="123456789012"
                      value={formData.barcode}
                      onChange={(e) => handleChange("barcode", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{formData.isService ? "Service" : "Product"} Name *</Label>
                  <Input
                    id="name"
                    placeholder={formData.isService ? "e.g., Plumbing Service - 1 Hour" : "Enter product name"}
                    value={formData.name}
                    onChange={(e) => {
                      handleChange("name", e.target.value)
                      setValidationErrors(prev => ({ ...prev, name: "" }))
                    }}
                    className={validationErrors.name ? "border-destructive" : ""}
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-destructive">{validationErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => {
                        handleChange("categoryId", value)
                        setValidationErrors(prev => ({ ...prev, categoryId: "" }))
                      }}
                    >
                      <SelectTrigger className={validationErrors.categoryId ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No categories yet. Create one!
                          </div>
                        ) : (
                          categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowCategoryDialog(true)}
                      title="Add new category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {validationErrors.categoryId && (
                    <p className="text-sm text-destructive">{validationErrors.categoryId}</p>
                  )}
                </div>
                
                {/* Product Type Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="isService" className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      This is a Service
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Services don't track inventory (e.g., "Plumbing Service - 1hr")
                    </p>
                  </div>
                  <Switch
                    id="isService"
                    checked={formData.isService}
                    onCheckedChange={(checked) => handleChange("isService", checked ? "true" : "false")}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set product pricing and tax information (CAD)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">{formData.isService ? "Hourly Rate" : "Selling Price"} *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`pl-7 ${validationErrors.unitPrice ? "border-destructive" : ""}`}
                        value={formData.unitPrice}
                        onChange={(e) => {
                          handleChange("unitPrice", e.target.value)
                          setValidationErrors(prev => ({ ...prev, unitPrice: "" }))
                        }}
                      />
                    </div>
                    {validationErrors.unitPrice && (
                      <p className="text-sm text-destructive">{validationErrors.unitPrice}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost {formData.isService ? "(your cost/hr)" : "Price"} *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`pl-7 ${validationErrors.costPrice ? "border-destructive" : ""}`}
                        value={formData.costPrice}
                        onChange={(e) => {
                          handleChange("costPrice", e.target.value)
                          setValidationErrors(prev => ({ ...prev, costPrice: "" }))
                        }}
                      />
                    </div>
                    {validationErrors.costPrice && (
                      <p className="text-sm text-destructive">{validationErrors.costPrice}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Select
                      value={formData.taxRate}
                      onValueChange={(value) => handleChange("taxRate", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0% (Exempt)</SelectItem>
                        <SelectItem value="5">5% (GST only)</SelectItem>
                        <SelectItem value="13">13% (HST - Ontario)</SelectItem>
                        <SelectItem value="15">15% (HST - NS/NB/NL/PEI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit of Measure</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => handleChange("unit", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="lb">Pound</SelectItem>
                        <SelectItem value="meter">Meter</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                        <SelectItem value="ream">Ream</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                        <SelectItem value="license">License</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Profit Preview */}
                {formData.unitPrice && formData.costPrice && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Profit Margin</span>
                      <span className="font-medium text-green-600">
                        {((1 - parseFloat(formData.costPrice) / parseFloat(formData.unitPrice)) * 100).toFixed(1)}%
                        {' '}
                        (${(parseFloat(formData.unitPrice) - parseFloat(formData.costPrice)).toFixed(2)}/unit)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Inventory - Hidden for services */}
          {!formData.isService && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>Stock levels and reorder settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="stockQuantity">Initial Stock</Label>
                      <Input
                        id="stockQuantity"
                        type="number"
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) => handleChange("stockQuantity", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorderLevel">Reorder Level</Label>
                      <Input
                        id="reorderLevel"
                        type="number"
                        min="0"
                        value={formData.reorderLevel}
                        onChange={(e) => handleChange("reorderLevel", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorderQuantity">Reorder Qty</Label>
                      <Input
                        id="reorderQuantity"
                        type="number"
                        min="0"
                        value={formData.reorderQuantity}
                        onChange={(e) => handleChange("reorderQuantity", e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Low stock alerts trigger when inventory falls below the reorder level.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Dimensions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Physical Properties</CardTitle>
                <CardDescription>Weight and dimensions (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="length">Length (cm)</Label>
                    <Input
                      id="length"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.length}
                      onChange={(e) => handleChange("length", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="width">Width (cm)</Label>
                    <Input
                      id="width"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.width}
                      onChange={(e) => handleChange("width", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.height}
                      onChange={(e) => handleChange("height", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end gap-4"
        >
          <Button variant="outline" type="button" asChild>
            <Link href="/inventory">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Product
              </>
            )}
          </Button>
        </motion.div>
      </form>
      
      {/* Create Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your products and services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newCategoryName">Category Name</Label>
              <Input
                id="newCategoryName"
                placeholder="e.g., Plumbing Parts, Services, Tools..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCreateCategory()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || creatingCategory}
            >
              {creatingCategory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
