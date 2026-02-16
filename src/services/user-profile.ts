import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

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
  timezone: string
  dateFormat: string
  language: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  phone?: string
  jobTitle?: string
  timezone?: string
  dateFormat?: string
  language?: string
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoProfile: UserProfile = {
  id: 'demo',
  email: 'demo@ontyx.ca',
  firstName: 'Demo',
  lastName: 'User',
  avatarUrl: undefined,
  phone: '(416) 555-0100',
  jobTitle: 'Business Owner',
  timezone: 'America/Toronto',
  dateFormat: 'YYYY-MM-DD',
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Mutable demo store
let demoProfileStore: UserProfile = { ...demoProfile }

// ============================================================================
// SERVICE
// ============================================================================

export const userProfileService = {
  /**
   * Get current user profile
   */
  async getProfile(userId?: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || !userId || userId === 'demo') {
      return demoProfileStore
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return demoProfileStore
    }

    return mapProfileFromDb(data)
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<UserProfile | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || userId === 'demo') {
      demoProfileStore = {
        ...demoProfileStore,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      return demoProfileStore
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone: updates.phone,
        job_title: updates.jobTitle,
        timezone: updates.timezone,
        date_format: updates.dateFormat,
        language: updates.language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return mapProfileFromDb(data)
  },

  /**
   * Upload avatar image
   */
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || userId === 'demo') {
      // Return a fake URL for demo
      return URL.createObjectURL(file)
    }

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

    // Update profile with new avatar URL
    await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return publicUrl
  },

  /**
   * Change password
   */
  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      return { success: false, error: 'Not configured' }
    }

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
// HELPERS
// ============================================================================

function mapProfileFromDb(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    avatarUrl: row.avatar_url,
    phone: row.phone,
    jobTitle: row.job_title,
    timezone: row.timezone || 'America/Toronto',
    dateFormat: row.date_format || 'YYYY-MM-DD',
    language: row.language || 'en',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default userProfileService
