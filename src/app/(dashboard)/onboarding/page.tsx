'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useOrganization } from '@/hooks/use-organization';
import { industryTemplateService, INDUSTRY_TEMPLATES, IndustryType } from '@/services/industry-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'industry' | 'business' | 'settings' | 'complete';

interface BusinessInfo {
  name: string;
  legalName?: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  province: string;
  postalCode?: string;
  country: string;
}

const PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization, updateOrganization } = useOrganization();

  const [step, setStep] = useState<Step>('industry');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    name: organization?.name || '',
    legalName: '',
    taxNumber: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    province: 'ON',
    postalCode: '',
    country: 'CA',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if already onboarded
  useEffect(() => {
    if (organization?.businessType && organization?.onboardingCompleted) {
      router.push('/dashboard');
    }
  }, [organization, router]);

  const handleIndustrySelect = (industry: IndustryType) => {
    setSelectedIndustry(industry);
  };

  const handleNextStep = () => {
    if (step === 'industry' && selectedIndustry) {
      setStep('business');
    } else if (step === 'business' && businessInfo.name) {
      setStep('settings');
    } else if (step === 'settings') {
      handleComplete();
    }
  };

  const handlePrevStep = () => {
    if (step === 'business') setStep('industry');
    if (step === 'settings') setStep('business');
  };

  const handleComplete = async () => {
    if (!selectedIndustry || !organization?.id) return;

    setIsLoading(true);
    try {
      // Apply industry template
      await industryTemplateService.applyTemplate(organization.id, selectedIndustry);

      // Update organization info - use camelCase properties
      await updateOrganization({
        name: businessInfo.name,
        province: businessInfo.province,
        onboardingCompleted: true,
      } as any);

      setStep('complete');

      // Redirect after showing success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTemplate = selectedIndustry 
    ? INDUSTRY_TEMPLATES.find(t => t.industry === selectedIndustry)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === 'industry' ? "bg-red-600 text-white" : "bg-green-500 text-white"
            )}>
              {step !== 'industry' ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded">
              <div className={cn(
                "h-full rounded transition-all",
                step !== 'industry' ? "w-full bg-green-500" : "w-0"
              )} />
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === 'business' ? "bg-red-600 text-white" : 
              step === 'settings' || step === 'complete' ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            )}>
              {step === 'settings' || step === 'complete' ? <Check className="w-5 h-5" /> : "2"}
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded">
              <div className={cn(
                "h-full rounded transition-all",
                step === 'settings' || step === 'complete' ? "w-full bg-green-500" : "w-0"
              )} />
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === 'settings' ? "bg-red-600 text-white" : 
              step === 'complete' ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            )}>
              {step === 'complete' ? <Check className="w-5 h-5" /> : "3"}
            </div>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <span>Industry</span>
            <span>Business Info</span>
            <span>Finish</span>
          </div>
        </div>

        {/* Step 1: Industry Selection */}
        {step === 'industry' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Ontyx! 🇨🇦
              </h1>
              <p className="text-gray-600 text-lg">
                Select your industry to get started with pre-configured settings
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INDUSTRY_TEMPLATES.map((template) => (
                <Card
                  key={template.industry}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                    selectedIndustry === template.industry 
                      ? "ring-2 ring-red-600 shadow-lg" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleIndustrySelect(template.industry)}
                >
                  <CardContent className="p-6 text-center">
                    <div 
                      className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      {template.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {template.description}
                    </p>
                    {selectedIndustry === template.industry && (
                      <div 
                        className="mt-3 text-xs font-medium py-1 px-3 rounded-full inline-flex items-center gap-1"
                        style={{ backgroundColor: template.color, color: 'white' }}
                      >
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTemplate && (
              <Card className="mt-6 bg-gradient-to-r from-gray-50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${selectedTemplate.color}20` }}
                    >
                      {selectedTemplate.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        {selectedTemplate.name} Template
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        This template includes:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedTemplate.modules.map((mod) => (
                          <div key={mod} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="capitalize">{mod.replace('-', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleNextStep}
                disabled={!selectedIndustry}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Business Information */}
        {step === 'business' && (
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Business Information</CardTitle>
              <CardDescription>
                Tell us about your business
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Business Name *</Label>
                  <div className="relative mt-1.5">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      value={businessInfo.name}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                      placeholder="Your Business Name"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="legalName">Legal Name (if different)</Label>
                  <Input
                    id="legalName"
                    value={businessInfo.legalName}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, legalName: e.target.value })}
                    placeholder="Legal Entity Name"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="taxNumber">GST/HST Number</Label>
                  <Input
                    id="taxNumber"
                    value={businessInfo.taxNumber}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, taxNumber: e.target.value })}
                    placeholder="123456789 RT 0001"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={businessInfo.phone}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                      placeholder="(416) 555-1234"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={businessInfo.email}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                      placeholder="hello@yourbusiness.ca"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative mt-1.5">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="website"
                      type="url"
                      value={businessInfo.website}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                      placeholder="https://yourbusiness.ca"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="address"
                      value={businessInfo.address}
                      onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                      placeholder="123 Main Street"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={businessInfo.city}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                    placeholder="Toronto"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="province">Province</Label>
                  <select
                    id="province"
                    value={businessInfo.province}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, province: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={businessInfo.postalCode}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, postalCode: e.target.value.toUpperCase() })}
                    placeholder="M5V 3A8"
                    className="mt-1.5"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleNextStep}
                  disabled={!businessInfo.name}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Settings Confirmation */}
        {step === 'settings' && selectedTemplate && (
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Ready to Go!</CardTitle>
              <CardDescription>
                We&apos;ll set up your workspace with these settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Business Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-red-600" />
                    Your Business
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Name:</span> <span className="font-medium">{businessInfo.name}</span></p>
                    {businessInfo.phone && <p><span className="text-gray-500">Phone:</span> {businessInfo.phone}</p>}
                    {businessInfo.email && <p><span className="text-gray-500">Email:</span> {businessInfo.email}</p>}
                    {businessInfo.city && (
                      <p><span className="text-gray-500">Location:</span> {businessInfo.city}, {businessInfo.province}</p>
                    )}
                  </div>
                </div>

                {/* Template Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    {selectedTemplate.name} Setup
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Currency:</span> {selectedTemplate.settings.currency}</p>
                    <p><span className="text-gray-500">Tax:</span> HST 13% (Ontario)</p>
                    <p><span className="text-gray-500">Payment Terms:</span> {selectedTemplate.settings.defaultPaymentTerms} days</p>
                    <p><span className="text-gray-500">Fiscal Year:</span> Calendar Year</p>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  What&apos;s Being Set Up
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{selectedTemplate.chartOfAccounts.length} Chart of Accounts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{selectedTemplate.taxRates.length} Tax Rates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>{selectedTemplate.modules.length} Modules</span>
                  </div>
                  {selectedTemplate.services && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{selectedTemplate.services.length} Services</span>
                    </div>
                  )}
                  {selectedTemplate.emailTemplates && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{selectedTemplate.emailTemplates.length} Email Templates</span>
                    </div>
                  )}
                  {selectedTemplate.workflows && (
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{selectedTemplate.workflows.length} Automation Workflows</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You&apos;re All Set! 🎉
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Your {selectedTemplate?.name} workspace is ready. Taking you to your dashboard...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-red-600" />
              <span className="text-gray-500">Redirecting...</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Canada&apos;s Business Operating System • 90% cheaper than Odoo • $49/month flat
          </p>
        </div>
      </div>
    </div>
  );
}
