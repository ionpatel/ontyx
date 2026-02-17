import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface TeamMember {
  id: string
  organizationId: string
  userId: string
  role: TeamRole
  
  // User details
  email: string
  fullName?: string
  avatarUrl?: string
  
  // Invite
  invitedAt: string
  invitedBy?: string
  acceptedAt?: string
  
  // Status
  status: 'pending' | 'active' | 'inactive'
  
  createdAt: string
  updatedAt: string
}

export interface TeamInvite {
  id: string
  organizationId: string
  email: string
  role: TeamRole
  invitedBy: string
  invitedByName?: string
  token: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  createdAt: string
}

export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
}

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  owner: 'Full access. Can manage billing and delete organization.',
  admin: 'Full access except billing and organization deletion.',
  member: 'Can create and edit records, run reports.',
  viewer: 'Read-only access to dashboards and reports.',
}

// ============================================================================
// SERVICE
// ============================================================================

export const teamService = {
  /**
   * Get all team members
   */
  async getMembers(organizationId: string): Promise<TeamMember[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user:users(id, email, full_name, avatar_url)
      `)
      .eq('organization_id', organizationId)
      .order('role')
      .order('created_at')
    
    if (error) {
      console.error('Error fetching team members:', error)
      return []
    }
    
    return (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      role: row.role || 'member',
      email: row.user?.email || row.invited_email || '',
      fullName: row.user?.full_name,
      avatarUrl: row.user?.avatar_url,
      invitedAt: row.invited_at || row.created_at,
      invitedBy: row.invited_by,
      acceptedAt: row.accepted_at,
      status: row.user ? 'active' : 'pending',
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    }))
  },
  
  /**
   * Get pending invites
   */
  async getInvites(organizationId: string): Promise<TeamInvite[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('team_invites')
      .select(`
        *,
        inviter:users!invited_by(full_name)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching invites:', error)
      return []
    }
    
    return (data || []).map(row => ({
      id: row.id,
      organizationId: row.organization_id,
      email: row.email,
      role: row.role || 'member',
      invitedBy: row.invited_by,
      invitedByName: row.inviter?.full_name,
      token: row.token,
      expiresAt: row.expires_at,
      status: row.status,
      createdAt: row.created_at,
    }))
  },
  
  /**
   * Invite a new team member
   */
  async inviteMember(
    email: string, 
    role: TeamRole, 
    organizationId: string,
    invitedBy: string
  ): Promise<TeamInvite | null> {
    const supabase = createClient()
    
    // Generate invite token
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    
    const { data, error } = await supabase
      .from('team_invites')
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        invited_by: invitedBy,
        token,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating invite:', error)
      return null
    }
    
    return {
      id: data.id,
      organizationId: data.organization_id,
      email: data.email,
      role: data.role,
      invitedBy: data.invited_by,
      token: data.token,
      expiresAt: data.expires_at,
      status: data.status,
      createdAt: data.created_at,
    }
  },
  
  /**
   * Cancel an invite
   */
  async cancelInvite(inviteId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('team_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error cancelling invite:', error)
      return false
    }
    
    return true
  },
  
  /**
   * Update member role
   */
  async updateRole(memberId: string, role: TeamRole, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('organization_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error updating role:', error)
      return false
    }
    
    return true
  },
  
  /**
   * Remove member from team
   */
  async removeMember(memberId: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .neq('role', 'owner') // Cannot remove owner
    
    if (error) {
      console.error('Error removing member:', error)
      return false
    }
    
    return true
  },
  
  /**
   * Accept an invite (called by invited user)
   */
  async acceptInvite(token: string, userId: string): Promise<{ organizationId: string } | null> {
    const supabase = createClient()
    
    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (inviteError || !invite) {
      console.error('Invalid or expired invite')
      return null
    }
    
    // Add user to organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invite.organization_id,
        user_id: userId,
        role: invite.role,
        invited_by: invite.invited_by,
        accepted_at: new Date().toISOString(),
      })
    
    if (memberError) {
      console.error('Error adding member:', memberError)
      return null
    }
    
    // Update invite status
    await supabase
      .from('team_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)
    
    return { organizationId: invite.organization_id }
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default teamService
