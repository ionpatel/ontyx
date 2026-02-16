'use client'

import { useState, useEffect, useCallback } from 'react'
import { contactsService, type Contact, type CreateContactInput, type ContactType } from '@/services/contacts'
import { useAuth } from './use-auth'

export function useContacts(type?: ContactType) {
  const { organizationId } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    if (!organizationId) {
      setContacts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await contactsService.getContacts(organizationId, type)
      setContacts(data)
    } catch (err) {
      setError('Failed to fetch contacts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, type])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const createContact = async (input: CreateContactInput): Promise<Contact | null> => {
    if (!organizationId) return null
    
    try {
      const contact = await contactsService.createContact(input, organizationId)
      if (contact) {
        setContacts(prev => [contact, ...prev])
      }
      return contact
    } catch (err) {
      console.error('Failed to create contact:', err)
      return null
    }
  }

  const updateContact = async (id: string, updates: Partial<CreateContactInput>): Promise<Contact | null> => {
    if (!organizationId) return null
    
    try {
      const contact = await contactsService.updateContact(id, updates, organizationId)
      if (contact) {
        setContacts(prev => prev.map(c => c.id === id ? contact : c))
      }
      return contact
    } catch (err) {
      console.error('Failed to update contact:', err)
      return null
    }
  }

  const deleteContact = async (id: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await contactsService.deleteContact(id, organizationId)
      if (success) {
        setContacts(prev => prev.filter(c => c.id !== id))
      }
      return success
    } catch (err) {
      console.error('Failed to delete contact:', err)
      return false
    }
  }

  const searchContacts = async (query: string): Promise<Contact[]> => {
    if (!organizationId) return []
    return contactsService.searchContacts(query, organizationId, type)
  }

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
  }
}

export function useCustomers() {
  return useContacts('customer')
}

export function useVendors() {
  return useContacts('vendor')
}

export function useContact(id: string | null) {
  const { organizationId } = useAuth()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !organizationId) {
      setContact(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    contactsService.getContact(id, organizationId)
      .then(data => setContact(data))
      .catch(err => {
        setError('Failed to fetch contact')
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [id, organizationId])

  return { contact, loading, error }
}
