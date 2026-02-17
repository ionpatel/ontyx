'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  teamService, 
  type TeamMember, 
  type TeamInvite, 
  type TeamRole 
} from '@/services/team'
import { useAuth } from './use-auth'

export function useTeam() {
  const { organizationId, userId, loading: authLoading } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeam = useCallback(async () => {
    if (!organizationId || authLoading) return
    
    setLoading(true)
    setError(null)
    
    try {
      const [membersData, invitesData] = await Promise.all([
        teamService.getMembers(organizationId),
        teamService.getInvites(organizationId),
      ])
      setMembers(membersData)
      setInvites(invitesData)
    } catch (err) {
      setError('Failed to fetch team')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [organizationId, authLoading])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const inviteMember = async (email: string, role: TeamRole): Promise<TeamInvite | null> => {
    if (!organizationId || !userId) return null
    
    try {
      const invite = await teamService.inviteMember(email, role, organizationId, userId)
      if (invite) {
        setInvites(prev => [invite, ...prev])
      }
      return invite
    } catch (err) {
      console.error('Failed to invite member:', err)
      return null
    }
  }

  const cancelInvite = async (inviteId: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await teamService.cancelInvite(inviteId, organizationId)
      if (success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId))
      }
      return success
    } catch (err) {
      console.error('Failed to cancel invite:', err)
      return false
    }
  }

  const updateRole = async (memberId: string, role: TeamRole): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await teamService.updateRole(memberId, role, organizationId)
      if (success) {
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, role } : m
        ))
      }
      return success
    } catch (err) {
      console.error('Failed to update role:', err)
      return false
    }
  }

  const removeMember = async (memberId: string): Promise<boolean> => {
    if (!organizationId) return false
    
    try {
      const success = await teamService.removeMember(memberId, organizationId)
      if (success) {
        setMembers(prev => prev.filter(m => m.id !== memberId))
      }
      return success
    } catch (err) {
      console.error('Failed to remove member:', err)
      return false
    }
  }

  // Get current user's role
  const currentMember = members.find(m => m.userId === userId)
  const currentRole = currentMember?.role || 'viewer'
  const isOwner = currentRole === 'owner'
  const isAdmin = currentRole === 'owner' || currentRole === 'admin'

  return {
    members,
    invites,
    loading: loading || authLoading,
    error,
    refetch: fetchTeam,
    inviteMember,
    cancelInvite,
    updateRole,
    removeMember,
    currentRole,
    isOwner,
    isAdmin,
  }
}
