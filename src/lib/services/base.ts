// ============================================================
// Base Service — Supabase CRUD helpers
// ============================================================

import { createClient } from '@/lib/supabase/client'
import type { ServiceResponse, PaginatedResult } from '@/types/common'

const supabase = createClient()

export interface QueryOptions {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDir?: 'asc' | 'desc'
  search?: string
  searchFields?: string[]
  filters?: Record<string, any>
}

export async function getAll<T>(
  table: string,
  options: QueryOptions = {}
): Promise<PaginatedResult<T>> {
  const {
    page = 1,
    pageSize = 25,
    orderBy = 'created_at',
    orderDir = 'desc',
    search,
    searchFields = ['name'],
    filters = {},
  } = options

  let query = supabase.from(table).select('*', { count: 'exact' })

  // Apply filters
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    }
  }

  // Apply search
  if (search && searchFields.length > 0) {
    const searchConditions = searchFields
      .map(field => `${field}.ilike.%${search}%`)
      .join(',')
    query = query.or(searchConditions)
  }

  // Ordering
  query = query.order(orderBy, { ascending: orderDir === 'asc' })

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error(`Error fetching ${table}:`, error)
    return { data: [], count: 0, page, pageSize, totalPages: 0 }
  }

  const total = count || 0

  return {
    data: (data as T[]) || [],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getById<T>(
  table: string,
  id: string
): Promise<ServiceResponse<T>> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: data as T, error: null, success: true }
}

export async function create<T>(
  table: string,
  record: Partial<T>
): Promise<ServiceResponse<T>> {
  const { data, error } = await supabase
    .from(table)
    .insert(record as any)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: data as T, error: null, success: true }
}

export async function update<T>(
  table: string,
  id: string,
  updates: Partial<T>
): Promise<ServiceResponse<T>> {
  const { data, error } = await supabase
    .from(table)
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: data as T, error: null, success: true }
}

export async function remove(
  table: string,
  id: string
): Promise<ServiceResponse<null>> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: null, error: null, success: true }
}

export async function upsert<T>(
  table: string,
  record: Partial<T>,
  conflictColumn: string = 'id'
): Promise<ServiceResponse<T>> {
  const { data, error } = await supabase
    .from(table)
    .upsert(record as any, { onConflict: conflictColumn })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message, success: false }
  }

  return { data: data as T, error: null, success: true }
}

export async function count(
  table: string,
  filters: Record<string, any> = {}
): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true })

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      query = query.eq(key, value)
    }
  }

  const { count: total } = await query
  return total || 0
}

export { supabase }
