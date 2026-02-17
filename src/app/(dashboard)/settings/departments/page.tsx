"use client"

import { useState } from "react"
import { 
  Building2, Plus, Search, MoreHorizontal, 
  Edit, Trash2, Loader2, ToggleLeft, ToggleRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useDepartments } from "@/hooks/use-departments"
import type { CreateDepartmentInput } from "@/services/departments"
import { useToast } from "@/components/ui/toast"

export default function DepartmentsPage() {
  const { departments, loading, createDepartment, updateDepartment, toggleActive, deleteDepartment } = useDepartments(true)
  const { success, error: showError } = useToast()

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<CreateDepartmentInput>({
    code: '',
    name: '',
    description: '',
  })

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      description: '',
    })
  }

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = 
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code?.toLowerCase().includes(search.toLowerCase()) ||
      dept.description?.toLowerCase().includes(search.toLowerCase())
    
    return matchesSearch
  })

  const handleCreate = async () => {
    if (!form.name) {
      showError('Missing Info', 'Please enter department name')
      return
    }

    setSaving(true)
    const dept = await createDepartment(form)
    setSaving(false)

    if (dept) {
      success('Department Added', `${dept.name} has been created`)
      setShowAdd(false)
      resetForm()
    } else {
      showError('Error', 'Failed to create department')
    }
  }

  const handleUpdate = async () => {
    if (!showEdit) return

    setSaving(true)
    const updated = await updateDepartment(showEdit, form)
    setSaving(false)

    if (updated) {
      success('Department Updated', 'Changes saved successfully')
      setShowEdit(null)
      resetForm()
    } else {
      showError('Error', 'Failed to update department')
    }
  }

  const handleToggle = async (id: string, name: string, currentStatus: boolean) => {
    const ok = await toggleActive(id, !currentStatus)
    if (ok) {
      success(
        currentStatus ? 'Department Deactivated' : 'Department Activated',
        `${name} is now ${currentStatus ? 'inactive' : 'active'}`
      )
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return

    const ok = await deleteDepartment(id)
    if (ok) {
      success('Deleted', `${name} has been removed`)
    } else {
      showError('Error', 'Cannot delete department with assigned employees')
    }
  }

  const openEdit = (dept: typeof departments[0]) => {
    setForm({
      code: dept.code || '',
      name: dept.name,
      description: dept.description || '',
    })
    setShowEdit(dept.id)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            Manage organizational departments
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Departments List */}
      <Card>
        <CardContent className="p-0">
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Departments</h3>
              <p className="text-muted-foreground mb-6">
                {search 
                  ? 'No departments match your search'
                  : 'Create your first department to organize employees'}
              </p>
              {!search && (
                <Button onClick={() => setShowAdd(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Department
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.map((dept) => (
                  <TableRow key={dept.id} className={cn(!dept.isActive && "opacity-60")}>
                    <TableCell className="font-mono text-sm">
                      {dept.code || '—'}
                    </TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {dept.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-xs",
                        dept.isActive 
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(dept)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(dept.id, dept.name, dept.isActive)}>
                            {dept.isActive ? (
                              <>
                                <ToggleLeft className="mr-2 h-4 w-4" /> Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="mr-2 h-4 w-4" /> Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(dept.id, dept.name)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!showEdit} onOpenChange={(open) => {
        if (!open) {
          setShowAdd(false)
          setShowEdit(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{showEdit ? 'Edit Department' : 'Add Department'}</DialogTitle>
            <DialogDescription>
              {showEdit ? 'Update department information' : 'Create a new department'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code (Optional)</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="HR"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Human Resources"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Manages employee relations, hiring, and benefits"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setShowAdd(false)
              setShowEdit(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={showEdit ? handleUpdate : handleCreate} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {showEdit ? 'Save Changes' : 'Add Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
