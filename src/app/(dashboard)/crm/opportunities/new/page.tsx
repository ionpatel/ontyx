'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useCreateOpportunity, usePipelineStages } from '@/hooks/use-crm'
import { useContacts } from '@/hooks/use-contacts'
import { useToast } from '@/components/ui/toast'

export default function NewOpportunityPage() {
  const router = useRouter()
  const toast = useToast()
  const { data: contacts = [] } = useContacts()
  const { data: stages = [] } = usePipelineStages()
  const createMutation = useCreateOpportunity()
  
  // Filter to customers only
  const customers = contacts.filter(c => c.is_customer)
  
  const [name, setName] = useState('')
  const [contactId, setContactId] = useState('')
  const [stageId, setStageId] = useState('')
  const [amount, setAmount] = useState('')
  const [expectedClose, setExpectedClose] = useState('')
  const [description, setDescription] = useState('')
  
  // Set default stage to first non-won/lost stage
  const defaultStage = stages.find(s => !s.is_won && !s.is_lost)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Please enter an opportunity name')
      return
    }
    
    try {
      const opp = await createMutation.mutateAsync({
        name: name.trim(),
        contact_id: contactId || undefined,
        stage_id: stageId || defaultStage?.id,
        amount: amount ? parseFloat(amount) : undefined,
        expected_close: expectedClose || undefined,
        description: description || undefined
      })
      
      toast.success('Opportunity created')
      router.push(`/crm/opportunities/${opp.id}`)
    } catch (error) {
      toast.error('Failed to create opportunity')
    }
  }
  
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/crm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Opportunity</h1>
          <p className="text-muted-foreground">
            Add a new deal to your pipeline
          </p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Opportunity Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Acme Corp - Enterprise Plan"
                  required
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact</Label>
                  <Select value={contactId} onValueChange={setContactId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No contact</SelectItem>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={stageId || defaultStage?.id || ''} onValueChange={setStageId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.filter(s => !s.is_won && !s.is_lost).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.probability}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Deal Value (CAD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10000.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedClose">Expected Close Date</Label>
                  <Input
                    id="expectedClose"
                    type="date"
                    value={expectedClose}
                    onChange={(e) => setExpectedClose(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deal details, requirements, etc."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending}>
              <Target className="mr-2 h-4 w-4" />
              {createMutation.isPending ? 'Creating...' : 'Create Opportunity'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/crm">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
