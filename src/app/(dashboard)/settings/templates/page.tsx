"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Palette, Check, Loader2, Eye, 
  FileText, Save, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useInvoiceTemplates } from "@/hooks/use-invoice-templates"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { TEMPLATE_THEMES } from "@/services/invoice-templates"

export default function InvoiceTemplatesPage() {
  const { 
    templates, 
    defaultTemplate, 
    loading, 
    updateTemplate, 
    applyTheme 
  } = useInvoiceTemplates()
  const { success, error: showError } = useToast()
  
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    primaryColor: defaultTemplate?.primaryColor || '#DC2626',
    secondaryColor: defaultTemplate?.secondaryColor || '#1f2937',
    logoPosition: defaultTemplate?.logoPosition || 'left',
    logoSize: defaultTemplate?.logoSize || 'medium',
    fontStyle: defaultTemplate?.fontStyle || 'modern',
    footerText: defaultTemplate?.footerText || 'Thank you for your business!',
    paymentInstructions: defaultTemplate?.paymentInstructions || '',
    thankYouMessage: defaultTemplate?.thankYouMessage || '',
    showLogo: defaultTemplate?.showLogo ?? true,
    showCompanyAddress: defaultTemplate?.showCompanyAddress ?? true,
    showPaymentTerms: defaultTemplate?.showPaymentTerms ?? true,
  })

  // Sync form when template loads
  if (defaultTemplate && !saving && formData.primaryColor !== defaultTemplate.primaryColor) {
    setFormData({
      primaryColor: defaultTemplate.primaryColor,
      secondaryColor: defaultTemplate.secondaryColor,
      logoPosition: defaultTemplate.logoPosition,
      logoSize: defaultTemplate.logoSize,
      fontStyle: defaultTemplate.fontStyle,
      footerText: defaultTemplate.footerText || '',
      paymentInstructions: defaultTemplate.paymentInstructions || '',
      thankYouMessage: defaultTemplate.thankYouMessage || '',
      showLogo: defaultTemplate.showLogo,
      showCompanyAddress: defaultTemplate.showCompanyAddress,
      showPaymentTerms: defaultTemplate.showPaymentTerms,
    })
  }

  const handleSave = async () => {
    if (!defaultTemplate) return
    
    setSaving(true)
    const result = await updateTemplate(defaultTemplate.id, formData)
    setSaving(false)
    
    if (result) {
      success('Template Saved', 'Your invoice template has been updated')
    } else {
      showError('Save Failed', 'Could not save template changes')
    }
  }

  const handleApplyTheme = async (themeName: keyof typeof TEMPLATE_THEMES) => {
    if (!defaultTemplate) return
    
    setSaving(true)
    const result = await applyTheme(defaultTemplate.id, themeName)
    setSaving(false)
    
    if (result) {
      const theme = TEMPLATE_THEMES[themeName]
      setFormData(prev => ({
        ...prev,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        fontStyle: theme.fontStyle,
      }))
      success('Theme Applied', `Applied "${theme.name}" theme`)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoice Templates</h1>
            <p className="text-muted-foreground">Customize how your invoices look</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="shadow-maple">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Themes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Quick Themes
              </CardTitle>
              <CardDescription>
                Apply a preset color scheme with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-5">
                {Object.entries(TEMPLATE_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => handleApplyTheme(key as keyof typeof TEMPLATE_THEMES)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all hover:scale-105",
                      formData.primaryColor === theme.primaryColor
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div 
                      className="h-8 w-full rounded mb-2"
                      style={{ backgroundColor: theme.primaryColor }}
                    />
                    <p className="text-xs font-medium truncate">{theme.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Custom colors for your invoice branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <Input
                      id="primaryColor"
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#DC2626"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                    <Input
                      id="secondaryColor"
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#1f2937"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout */}
          <Card>
            <CardHeader>
              <CardTitle>Layout & Style</CardTitle>
              <CardDescription>
                Control the appearance of your invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Logo Position</Label>
                  <Select 
                    value={formData.logoPosition}
                    onValueChange={(v: 'left' | 'center' | 'right') => 
                      setFormData(prev => ({ ...prev, logoPosition: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Logo Size</Label>
                  <Select 
                    value={formData.logoSize}
                    onValueChange={(v: 'small' | 'medium' | 'large') => 
                      setFormData(prev => ({ ...prev, logoSize: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (60px)</SelectItem>
                      <SelectItem value="medium">Medium (80px)</SelectItem>
                      <SelectItem value="large">Large (100px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Font Style</Label>
                  <Select 
                    value={formData.fontStyle}
                    onValueChange={(v: 'modern' | 'classic' | 'minimal') => 
                      setFormData(prev => ({ ...prev, fontStyle: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Logo</Label>
                    <p className="text-sm text-muted-foreground">Display your company logo</p>
                  </div>
                  <Switch
                    checked={formData.showLogo}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, showLogo: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Company Address</Label>
                    <p className="text-sm text-muted-foreground">Include your business address</p>
                  </div>
                  <Switch
                    checked={formData.showCompanyAddress}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, showCompanyAddress: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Payment Terms</Label>
                    <p className="text-sm text-muted-foreground">Display payment instructions</p>
                  </div>
                  <Switch
                    checked={formData.showPaymentTerms}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, showPaymentTerms: v }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Text</CardTitle>
              <CardDescription>
                Add personalized messages to your invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  value={formData.footerText}
                  onChange={(e) => setFormData(prev => ({ ...prev, footerText: e.target.value }))}
                  placeholder="Thank you for your business!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                <Textarea
                  id="paymentInstructions"
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                  placeholder="Payment is due within the terms specified..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="thankYouMessage">Thank You Message</Label>
                <Textarea
                  id="thankYouMessage"
                  value={formData.thankYouMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                  placeholder="We appreciate your business..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mini Invoice Preview */}
              <div 
                className="border rounded-lg p-4 bg-white text-xs"
                style={{ fontSize: '8px' }}
              >
                {/* Header */}
                <div 
                  className={cn(
                    "flex mb-3 pb-2 border-b",
                    formData.logoPosition === 'center' && "justify-center",
                    formData.logoPosition === 'right' && "justify-end"
                  )}
                >
                  {formData.showLogo && (
                    <div 
                      className="rounded flex items-center justify-center text-white font-bold"
                      style={{ 
                        backgroundColor: formData.primaryColor,
                        width: formData.logoSize === 'small' ? 24 : formData.logoSize === 'medium' ? 32 : 40,
                        height: formData.logoSize === 'small' ? 24 : formData.logoSize === 'medium' ? 32 : 40,
                      }}
                    >
                      OX
                    </div>
                  )}
                </div>
                
                {/* Invoice Title */}
                <div 
                  className="text-lg font-bold mb-2"
                  style={{ color: formData.primaryColor }}
                >
                  INVOICE
                </div>
                
                {/* Details placeholder */}
                <div className="space-y-1 mb-3">
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
                
                {/* Table placeholder */}
                <div 
                  className="h-1 rounded mb-2"
                  style={{ backgroundColor: formData.secondaryColor, opacity: 0.2 }}
                />
                <div className="space-y-1 mb-3">
                  <div className="h-2 bg-gray-100 rounded"></div>
                  <div className="h-2 bg-gray-100 rounded"></div>
                </div>
                
                {/* Total */}
                <div 
                  className="text-right font-bold p-1 rounded text-white"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  $1,250.00
                </div>
                
                {/* Footer */}
                {formData.footerText && (
                  <div 
                    className="mt-3 pt-2 border-t text-center"
                    style={{ color: formData.secondaryColor, opacity: 0.7 }}
                  >
                    {formData.footerText.substring(0, 30)}...
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Preview is approximate. Download a test PDF to see exact output.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
