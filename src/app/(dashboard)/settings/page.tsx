"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { 
  Building2, User, Bell, Database, Key, Shield,
  Save, Upload, Loader2, Check, MapPin, Mail
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { useOrganization } from "@/hooks/use-organization"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/toast"

const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "QC", label: "Quebec" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "NT", label: "Northwest Territories" },
  { value: "YT", label: "Yukon" },
  { value: "NU", label: "Nunavut" },
]

const TIMEZONES = [
  { value: "America/Toronto", label: "Eastern Time (Toronto)" },
  { value: "America/Winnipeg", label: "Central Time (Winnipeg)" },
  { value: "America/Edmonton", label: "Mountain Time (Edmonton)" },
  { value: "America/Vancouver", label: "Pacific Time (Vancouver)" },
  { value: "America/Halifax", label: "Atlantic Time (Halifax)" },
  { value: "America/St_Johns", label: "Newfoundland Time" },
]

export default function SettingsPage() {
  const { organization, loading: orgLoading, saving: orgSaving, updateOrganization, uploadLogo } = useOrganization()
  const { profile, loading: profileLoading, saving: profileSaving, updateProfile, uploadAvatar, changePassword } = useUserProfile()
  const { user } = useAuth()
  const { success: showSuccess, error: showError } = useToast()
  
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    email: "",
    phone: "",
    website: "",
    taxNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    country: "CA",
    currency: "CAD",
    timezone: "America/Toronto",
  })

  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    timezone: "America/Toronto",
  })
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })

  // Load org data into form
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        legalName: organization.legalName || "",
        email: organization.email || "",
        phone: organization.phone || "",
        website: organization.website || "",
        taxNumber: organization.taxNumber || "",
        addressLine1: organization.addressLine1 || "",
        addressLine2: organization.addressLine2 || "",
        city: organization.city || "",
        province: organization.province || "",
        postalCode: organization.postalCode || "",
        country: organization.country || "CA",
        currency: organization.currency || "CAD",
        timezone: organization.timezone || "America/Toronto",
      })
    }
  }, [organization])
  
  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setProfileData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        jobTitle: profile.jobTitle || "",
        timezone: profile.timezone || "America/Toronto",
      })
    }
  }, [profile])

  const handleSave = async () => {
    const success = await updateOrganization(formData)
    if (success) {
      setSaveSuccess(true)
      showSuccess('Settings Saved', 'Your company settings have been updated')
      setTimeout(() => setSaveSuccess(false), 2000)
    } else {
      showError('Save Failed', 'Could not save settings. Please try again.')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = await uploadLogo(file)
      if (url) {
        showSuccess('Logo Uploaded', 'Your company logo has been updated')
      } else {
        showError('Upload Failed', 'Could not upload logo. Please try again.')
      }
    }
  }
  
  const handleProfileSave = async () => {
    const success = await updateProfile(profileData)
    if (success) {
      setProfileSaveSuccess(true)
      showSuccess('Profile Saved', 'Your profile has been updated')
      setTimeout(() => setProfileSaveSuccess(false), 2000)
    } else {
      showError('Save Failed', 'Could not save profile. Please try again.')
    }
  }
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = await uploadAvatar(file)
      if (url) {
        showSuccess('Photo Updated', 'Your profile photo has been changed')
      }
    }
  }
  
  const handlePasswordChange = async () => {
    setPasswordError(null)
    setPasswordSuccess(false)
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    
    const result = await changePassword(passwordData.newPassword)
    if (result.success) {
      setPasswordSuccess(true)
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } else {
      setPasswordError(result.error || 'Failed to change password')
    }
  }

  if (orgLoading || profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your company and application settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={orgSaving} className="shadow-maple">
          {orgSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saveSuccess ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Profile Tab */}
        <TabsContent value="company" className="space-y-6">
          {/* Logo & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>
                This information appears on invoices and documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={organization?.logoUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {formData.name?.substring(0, 2).toUpperCase() || "OX"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={orgSaving}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Upload Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG or JPG, max 2MB. Appears on invoices.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Company Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your Company Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                    placeholder="Legal business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="billing@company.ca"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(416) 555-0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://company.ca"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">GST/HST Number</Label>
                  <Input
                    id="taxNumber"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                    placeholder="123456789 RT0001"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your CRA business number for tax purposes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Business Address
              </CardTitle>
              <CardDescription>
                Your company's primary business address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine1">Street Address</Label>
                  <Input
                    id="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                    placeholder="Suite 100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Toronto"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select 
                    value={formData.province} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, province: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
                    placeholder="M5V 1A1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Default settings for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={formData.timezone} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, timezone: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map(tz => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fiscal Year Start</Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Templates Link */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Templates</CardTitle>
              <CardDescription>
                Customize how your invoices look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/settings/templates">
                  Customize Invoice Template →
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                Manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
                <div>
                  <p className="font-semibold text-lg">Trial Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {organization?.trialEndsAt 
                      ? `Expires ${new Date(organization.trialEndsAt).toLocaleDateString()}`
                      : "14 days remaining"}
                  </p>
                </div>
                <Button className="shadow-maple">Upgrade to Pro</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">$49</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                  <p className="text-xs text-primary mt-2">Unlimited users</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">Unlimited</p>
                  <p className="text-sm text-muted-foreground">Invoices</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <p className="text-2xl font-bold">Unlimited</p>
                  <p className="text-sm text-muted-foreground">Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what emails you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Notification settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Your personal account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {profileData.firstName?.charAt(0) || 'U'}{profileData.lastName?.charAt(0) || ''}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={profileSaving}
                  >
                    <Upload className="mr-2 h-4 w-4" /> Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Square image recommended
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {profileLoading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : (
                      user?.email || profile?.email || 'demo@ontyx.ca'
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>
              
              {/* Name */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              {/* Phone & Job Title */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profilePhone">Phone</Label>
                  <Input
                    id="profilePhone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(416) 555-0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={profileData.jobTitle}
                    onChange={(e) => setProfileData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="Business Owner"
                  />
                </div>
              </div>
              
              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="profileTimezone">Your Timezone</Label>
                <Select 
                  value={profileData.timezone} 
                  onValueChange={(v) => setProfileData(prev => ({ ...prev, timezone: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleProfileSave} 
                  disabled={profileSaving}
                  className="shadow-maple"
                >
                  {profileSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : profileSaveSuccess ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {profileSaveSuccess ? "Saved!" : "Save Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-green-600">Password changed successfully!</p>
              )}
              
              <Button 
                variant="outline"
                onClick={handlePasswordChange}
                disabled={profileSaving || !passwordData.newPassword}
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
