import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  phone?: string
  jobTitle?: string
  department?: string
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
  jobTitle?: string
  department?: string
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  notificationsEnabled?: boolean
}

// ============================================================================
// SERVICE
// ============================================================================

export const userProfileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return mapProfileFromDb(data)
  },

  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<UserProfile | null> {
    const supabase = createClient()

    // Map fields to database columns
    const dbUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    
    // Combine firstName + lastName into full_name
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const currentProfile = await this.getProfile(userId)
      const firstName = updates.firstName ?? currentProfile?.firstName ?? ''
      const lastName = updates.lastName ?? currentProfile?.lastName ?? ''
      dbUpdates.full_name = `${firstName} ${lastName}`.trim()
    }
    
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme
    if (updates.language !== undefined) dbUpdates.locale = updates.language
    if (updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return mapProfileFromDb(data)
  },

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const supabase = createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update user's avatar_url
    await supabase
      .from('users')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return publicUrl
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  },
}

// ============================================================================
// MAPPER
// ============================================================================

function mapProfileFromDb(row: any): UserProfile {
  // Parse full_name into firstName/lastName
  const nameParts = (row.full_name || '').split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  return {
    id: row.id,
    email: row.email,
    firstName,
    lastName,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    jobTitle: row.job_title,
    department: row.department,
    theme: row.theme || 'system',
    language: row.locale || 'en-CA',
    timezone: row.timezone || 'America/Toronto',
    notificationsEnabled: row.notifications_enabled ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default userProfileService
