import { createClient } from '@/lib/supabase/client'

export interface Department {
  id: string
  organizationId: string
  code?: string
  name: string
  description?: string
  parentId?: string
  managerId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDepartmentInput {
  code?: string
  name: string
  description?: string
  parentId?: string
  managerId?: string
}

export const departmentsService = {
  async getDepartments(organizationId: string, includeInactive = false): Promise<Department[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('departments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')
    
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching departments:', error)
      return []
    }
    
    return (data || []).map(mapFromDb)
  },
  
  async createDepartment(input: CreateDepartmentInput, organizationId: string): Promise<Department | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('departments')
      .insert({
        organization_id: organizationId,
        code: input.code,
        name: input.name,
        description: input.description,
        parent_id: input.parentId,
        manager_id: input.managerId,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating department:', error)
      return null
    }
    
    return mapFromDb(data)
  },
  
  async updateDepartment(id: string, input: Partial<CreateDepartmentInput>, organizationId: string): Promise<Department | null> {
    const supabase = createClient()
    
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    
    if (input.code !== undefined) updates.code = input.code
    if (input.name !== undefined) updates.name = input.name
    if (input.description !== undefined) updates.description = input.description
    if (input.parentId !== undefined) updates.parent_id = input.parentId
    if (input.managerId !== undefined) updates.manager_id = input.managerId
    
    const { data, error } = await supabase
      .from('departments')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating department:', error)
      return null
    }
    
    return mapFromDb(data)
  },
  
  async toggleActive(id: string, isActive: boolean, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('departments')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error toggling department:', error)
      return false
    }
    
    return true
  },
  
  async deleteDepartment(id: string, organizationId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)
    
    if (error) {
      console.error('Error deleting department:', error)
      return false
    }
    
    return true
  },
}

function mapFromDb(row: any): Department {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    description: row.description,
    parentId: row.parent_id,
    managerId: row.manager_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export default departmentsService
