"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Users, UserPlus, Mail, Shield, Loader2,
  MoreHorizontal, Trash2, ArrowLeft, Clock,
  Crown, ShieldCheck, User, Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTeam } from "@/hooks/use-team"
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type TeamRole } from "@/services/team"
import { useToast } from "@/components/ui/toast"

const roleIcons: Record<TeamRole, any> = {
  owner: Crown,
  admin: ShieldCheck,
  member: User,
  viewer: Eye,
}

const roleColors: Record<TeamRole, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-blue-100 text-blue-700',
  member: 'bg-slate-100 text-slate-700',
  viewer: 'bg-gray-100 text-gray-600',
}

export default function TeamSettingsPage() {
  const { 
    members, 
    invites, 
    loading, 
    inviteMember, 
    cancelInvite, 
    updateRole, 
    removeMember,
    isAdmin,
    isOwner 
  } = useTeam()
  const { success, error: showError } = useToast()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('member')
  const [saving, setSaving] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showError('Missing Email', 'Please enter an email address')
      return
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      showError('Invalid Email', 'Please enter a valid email address')
      return
    }

    // Check if already a member
    if (members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase())) {
      showError('Already a Member', 'This person is already on the team')
      return
    }

    // Check if already invited
    if (invites.some(i => i.email.toLowerCase() === inviteEmail.toLowerCase())) {
      showError('Already Invited', 'This person already has a pending invite')
      return
    }

    setSaving(true)
    const invite = await inviteMember(inviteEmail, inviteRole)
    setSaving(false)

    if (invite) {
      success('Invite Sent', `Invitation sent to ${inviteEmail}`)
      setShowInvite(false)
      setInviteEmail('')
      setInviteRole('member')
    } else {
      showError('Error', 'Failed to send invitation')
    }
  }

  const handleCancelInvite = async (id: string, email: string) => {
    if (!confirm(`Cancel invitation to ${email}?`)) return
    
    const ok = await cancelInvite(id)
    if (ok) {
      success('Cancelled', 'Invitation has been cancelled')
    }
  }

  const handleUpdateRole = async (memberId: string, role: TeamRole) => {
    const ok = await updateRole(memberId, role)
    if (ok) {
      success('Role Updated', `Role changed to ${ROLE_LABELS[role]}`)
    }
  }

  const handleRemove = async (memberId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return
    
    const ok = await removeMember(memberId)
    if (ok) {
      success('Removed', `${name} has been removed from the team`)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || '??'
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground">
              Manage team members and permissions
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        )}
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({members.length})
          </CardTitle>
          <CardDescription>
            People with access to this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role]
                const canEdit = isOwner || (isAdmin && member.role !== 'owner')
                const canRemove = member.role !== 'owner' && canEdit
                
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={member.avatarUrl} />
                          <AvatarFallback>
                            {getInitials(member.fullName, member.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.fullName || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {canEdit && member.role !== 'owner' ? (
                        <Select
                          value={member.role}
                          onValueChange={(v) => handleUpdateRole(member.id, v as TeamRole)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {isOwner && <SelectItem value="admin">Admin</SelectItem>}
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn("flex items-center gap-1 w-fit", roleColors[member.role])}>
                          <RoleIcon className="h-3 w-3" />
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.acceptedAt ? formatDate(member.acceptedAt) : formatDate(member.createdAt)}
                    </TableCell>
                    <TableCell>
                      {canRemove && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleRemove(member.id, member.fullName || member.email)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invitations ({invites.length})
            </CardTitle>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {invite.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[invite.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invite.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invite.expiresAt)}
                    </TableCell>
                    <TableCell>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleCancelInvite(invite.id, invite.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {(Object.keys(ROLE_LABELS) as TeamRole[]).map((role) => {
              const Icon = roleIcons[role]
              return (
                <div key={role} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={cn("p-2 rounded-lg", roleColors[role])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">{ROLE_LABELS[role]}</h4>
                    <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isOwner && (
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Admin
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ROLE_DESCRIPTIONS[inviteRole]}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
