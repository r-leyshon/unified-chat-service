"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import Link from "next/link"
import {
  Upload,
  FileText,
  Plus,
  ArrowLeft,
  Trash2,
  FolderOpen,
  X,
  Pencil,
  Copy,
  Sparkles,
} from "lucide-react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

type Project = {
  id: string
  name: string
  slug: string
  description?: string | null
  created_at: string
}
type Document = { id: string; project_id: string; name: string; file_name: string; created_at: string }

function dedupeProjectsById(projects: Project[]): Project[] {
  const seen = new Set<string>()
  return projects.filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

function upsertProjectById(projects: Project[], project: Project): Project[] {
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    const next = [...projects]
    next[idx] = project
    return next
  }
  return [...projects, project]
}

function formatUploadTime(createdAt: string): string {
  const d = new Date(createdAt)
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function LibraryPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [documentsByProject, setDocumentsByProject] = useState<Record<string, Document[]>>({})
  const [newProjectName, setNewProjectName] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingForProjectId, setUploadingForProjectId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<{
    id: string
    name: string
    content: string
  } | null>(null)
  const [editDraft, setEditDraft] = useState<string | null>(null)
  const [savingContent, setSavingContent] = useState(false)
  const [loadingContent, setLoadingContent] = useState(false)
  const [descriptionEdits, setDescriptionEdits] = useState<Record<string, string>>({})
  const [savingDescriptionProjectId, setSavingDescriptionProjectId] = useState<string | null>(null)
  const [generatingDescriptionProjectId, setGeneratingDescriptionProjectId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetProjectIdRef = useRef<string | null>(null)

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects")
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to load projects"
        throw new Error(msg)
      }
      const list = Array.isArray(data) ? dedupeProjectsById(data) : []
      setProjects(list)
      return list
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
      return []
    } finally {
      setLoading(false)
    }
  }

  const loadDocumentsForProjects = async (projectIds: string[]) => {
    const entries = await Promise.all(
      projectIds.map(async (id) => {
        const res = await fetch(`/api/documents?projectId=${encodeURIComponent(id)}`)
        const data = res.ok ? await res.json() : []
        return [id, Array.isArray(data) ? data : []] as const
      }),
    )
    setDocumentsByProject((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
  }

  useEffect(() => {
    let cancelled = false
    loadProjects().then((list) => {
      if (!cancelled && list.length > 0) loadDocumentsForProjects(list.map((p) => p.id))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newProjectName.trim()
    if (!name) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create")
      setProjects((prev) => upsertProjectById(prev, data))
      setDocumentsByProject((prev) => ({ ...prev, [data.id]: [] }))
      setNewProjectName("")
      setShowAddForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project")
    } finally {
      setCreating(false)
    }
  }

  const triggerUpload = (projectId: string) => {
    uploadTargetProjectIdRef.current = projectId
    fileInputRef.current?.click()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const projectId = uploadTargetProjectIdRef.current
    e.target.value = ""
    uploadTargetProjectIdRef.current = null
    if (!file || !projectId) return
    setUploadingForProjectId(projectId)
    setError(null)
    try {
      const formData = new FormData()
      formData.set("projectId", projectId)
      formData.set("file", file)
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setDocumentsByProject((prev) => ({
        ...prev,
        [projectId]: [{ ...data, project_id: projectId }, ...(prev[projectId] || [])],
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploadingForProjectId(null)
    }
  }

  const handleDeleteDocument = async (documentId: string, projectId: string) => {
    setDeletingDocId(documentId)
    setError(null)
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      setDocumentsByProject((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter((d) => d.id !== documentId),
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleViewDocument = async (documentId: string) => {
    setLoadingContent(true)
    setError(null)
    setEditDraft(null)
    try {
      const res = await fetch(`/api/documents/${documentId}/content`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load content")
      setViewingDocument({
        id: documentId,
        name: data.name || data.file_name || "Document",
        content: data.content ?? "",
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load content")
    } finally {
      setLoadingContent(false)
    }
  }

  const handleCopyProjectId = (projectId: string) => {
    navigator.clipboard.writeText(projectId).catch(() => {})
  }

  const handleGenerateDescription = async (projectId: string) => {
    setGeneratingDescriptionProjectId(projectId)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-description`, {
        method: "POST",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to generate description")
      const description = typeof data.description === "string" ? data.description : ""
      setDescriptionEdits((prev) => ({ ...prev, [projectId]: description }))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate description")
    } finally {
      setGeneratingDescriptionProjectId(null)
    }
  }

  const handleSaveDescription = async (projectId: string) => {
    const value = descriptionEdits[projectId] ?? projects.find((p) => p.id === projectId)?.description ?? ""
    setSavingDescriptionProjectId(projectId)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: value || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save description")
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, description: value || null } : p)),
      )
      setDescriptionEdits((prev) => {
        const next = { ...prev }
        delete next[projectId]
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save description")
    } finally {
      setSavingDescriptionProjectId(null)
    }
  }

  const handleSaveDocumentContent = async () => {
    if (!viewingDocument || editDraft === null) return
    setSavingContent(true)
    setError(null)
    try {
      const res = await fetch(`/api/documents/${viewingDocument.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editDraft }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save")
      setViewingDocument((prev) =>
        prev ? { ...prev, content: data.content ?? editDraft } : null,
      )
      setEditDraft(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSavingContent(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Delete this project and all its documents? This cannot be undone.")) return
    setDeletingProjectId(projectId)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to delete project")
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      setDocumentsByProject((prev) => {
        const next = { ...prev }
        delete next[projectId]
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete project")
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-30 bg-background/95">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-xl font-bold text-foreground">Document Library</h1>
          </div>
          <div className="flex items-center gap-2">
            {showAddForm ? (
              <form onSubmit={handleCreateProject} className="flex gap-2">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-48 h-8 text-sm"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={creating || !newProjectName.trim()}>
                  {creating ? <Spinner className="w-4 h-4" /> : "Add"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewProjectName("")
                  }}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4" />
                Add project
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          className="hidden"
          onChange={handleUpload}
        />

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12">
            <Spinner className="w-5 h-5" /> Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No projects yet.</p>
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4" />
              Add project
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-6 max-h-[calc(100vh-11rem)] overflow-y-auto pr-2">
            {projects.map((project) => {
              const docs = documentsByProject[project.id] ?? []
              const isDeleting = deletingProjectId === project.id
              const descriptionText =
                descriptionEdits[project.id] ?? project.description ?? ""
              return (
                <Card key={project.id} className="p-5 flex flex-col min-h-0 shrink-0">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-semibold text-foreground truncate flex-1" title={project.name}>
                      {project.name}
                    </h2>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => triggerUpload(project.id)}
                        disabled={uploadingForProjectId !== null}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Upload document"
                      >
                        {uploadingForProjectId === project.id ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={isDeleting}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete project"
                      >
                        {isDeleting ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {/* Project UUID (product_id) for consuming apps */}
                  <div className="mb-3 flex items-center gap-1.5">
                    <code className="text-xs text-muted-foreground truncate flex-1 min-w-0" title={project.id}>
                      {project.id}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleCopyProjectId(project.id)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Copy project ID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {/* Description with hover to see full text */}
                  <div className="mb-4">
                    <label className="block text-xs text-muted-foreground mb-1">Description</label>
                    <div className="flex gap-2 flex-wrap items-center">
                      {descriptionText ? (
                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <div className="flex-1 min-w-[200px] cursor-default">
                              <Input
                                value={descriptionText}
                                onChange={(e) =>
                                  setDescriptionEdits((prev) => ({
                                    ...prev,
                                    [project.id]: e.target.value,
                                  }))
                                }
                                placeholder="Short description for this product"
                                className="text-xs h-8 w-full"
                              />
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            className="w-full max-w-md max-h-[16rem] overflow-y-auto"
                            side="bottom"
                            align="start"
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {descriptionText}
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <Input
                          value={descriptionText}
                          onChange={(e) =>
                            setDescriptionEdits((prev) => ({
                              ...prev,
                              [project.id]: e.target.value,
                            }))
                          }
                          placeholder="Short description for this product"
                          className="text-xs h-8 flex-1 min-w-[200px]"
                        />
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        disabled={generatingDescriptionProjectId === project.id}
                        onClick={() => handleGenerateDescription(project.id)}
                        aria-label="Generate description from docs"
                      >
                        {generatingDescriptionProjectId === project.id ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-8 text-xs"
                        disabled={
                          savingDescriptionProjectId === project.id ||
                          (descriptionEdits[project.id] ?? project.description ?? "") ===
                            (project.description ?? "")
                        }
                        onClick={() => handleSaveDescription(project.id)}
                      >
                        {savingDescriptionProjectId === project.id ? (
                          <Spinner className="w-3.5 h-3.5" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    {docs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No documents. Upload a file.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {docs.map((d) => (
                          <li
                            key={d.id}
                            className="flex items-center gap-2 text-sm border-b border-border/30 last:border-0 pb-1.5 last:pb-0"
                          >
                            <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <button
                              type="button"
                              onClick={() => handleViewDocument(d.id)}
                              className="truncate flex-1 min-w-0 text-left hover:text-primary hover:underline"
                              title={`View: ${d.name || d.file_name}`}
                            >
                              {d.name || d.file_name}
                            </button>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatUploadTime(d.created_at)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleDeleteDocument(d.id, project.id)}
                              disabled={deletingDocId === d.id}
                              className="shrink-0 text-muted-foreground hover:text-destructive"
                              aria-label="Delete document"
                            >
                              {deletingDocId === d.id ? (
                                <Spinner className="w-3.5 h-3.5" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Document content viewer modal */}
      {viewingDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => {
            if (editDraft === null) setViewingDocument(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Document content"
        >
          <Card
            className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h3 className="font-semibold truncate pr-4">{viewingDocument.name}</h3>
              <div className="flex items-center gap-1 shrink-0">
                {editDraft === null ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditDraft(viewingDocument.content)}
                    aria-label="Edit document"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleSaveDocumentContent}
                      disabled={savingContent}
                    >
                      {savingContent ? <Spinner className="w-4 h-4" /> : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditDraft(null)}
                      disabled={savingContent}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditDraft(null)
                    setViewingDocument(null)
                  }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            {editDraft === null ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="p-4">
                  <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-sans">
                    {viewingDocument.content || "(No content)"}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 p-4 flex flex-col overflow-hidden">
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="min-h-[200px] w-full flex-1 p-3 text-sm font-sans rounded-md border border-input bg-background text-foreground resize-none overflow-auto"
                  placeholder="Document content..."
                  spellCheck="false"
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {loadingContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Spinner className="w-8 h-8 text-primary" />
        </div>
      )}
    </div>
  )
}
