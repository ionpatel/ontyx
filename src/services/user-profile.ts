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

// Mutable demo store with localStorage persistence
const DEMO_PROFILE_STORAGE_KEY = 'ontyx_demo_profile'

function getDemoProfileStore(): UserProfile {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(DEMO_PROFILE_STORAGE_KEY)
      if (stored) {
        return { ...demoProfile, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Error reading demo profile from localStorage:', e)
    }
  }
  return { ...demoProfile }
}

function saveDemoProfileStore(profile: UserProfile): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(profile))
    } catch (e) {
      console.error('Error saving demo profile to localStorage:', e)
    }
  }
}

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
      return getDemoProfileStore()
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return getDemoProfileStore()
    }

    return mapProfileFromDb(data)
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UpdateProfileInput): Promise<UserProfile | null> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured() || userId === 'demo') {
      const currentProfile = getDemoProfileStore()
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      saveDemoProfileStore(updatedProfile)
      return updatedProfile
    }

    // Combine first and last name for full_name field
    let fullName: string | undefined
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const currentProfile = await this.getProfile(userId)
      const first = updates.firstName ?? currentProfile?.firstName ?? ''
      const last = updates.lastName ?? currentProfile?.lastName ?? ''
      fullName = `${first} ${last}`.trim()
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (fullName !== undefined) updateData.full_name = fullName
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.language !== undefined) updateData.locale = updates.language

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
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
      // For demo mode, convert to base64 data URL (survives page refresh)
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64Url = reader.result as string
          const currentProfile = getDemoProfileStore()
          saveDemoProfileStore({ ...currentProfile, avatarUrl: base64Url, updatedAt: new Date().toISOString() })
          resolve(base64Url)
        }
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
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
      .from('users')
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
  // Split full_name into first and last name
  const nameParts = (row.full_name || '').trim().split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  
  return {
    id: row.id,
    email: row.email,
    firstName,
    lastName,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    jobTitle: '', // Not in database, store in demo mode only
    timezone: 'America/Toronto', // Not in database, use default
    dateFormat: 'YYYY-MM-DD', // Not in database, use default
    language: row.locale || 'en',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default userProfileService
