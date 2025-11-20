import { useState } from 'react'
import { useNotes, useCreateNote } from '@/hooks/useNotes'
import { formatDate } from '@/lib/utils'
import { Plus, BookOpen } from 'lucide-react'

export default function NotesPage() {
  const { data: notes, isLoading } = useNotes()
  const createNote = useCreateNote()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteSymbol, setNewNoteSymbol] = useState('')

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return

    try {
      await createNote.mutateAsync({
        content: newNoteContent,
        symbol: newNoteSymbol || undefined,
        tags: ['日记'],
      })
      setNewNoteContent('')
      setNewNoteSymbol('')
      setShowAddModal(false)
    } catch (error) {
      alert('创建笔记失败')
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">投资笔记</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>写笔记</span>
        </button>
      </div>

      {!notes || notes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">还没有笔记</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  {note.symbol && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mb-2">
                      {note.symbol}
                    </span>
                  )}
                  <p className="text-sm text-gray-600">{formatDate(note.created_at)}</p>
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-2">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* 添加笔记 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">写投资笔记</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  关联股票（可选）
                </label>
                <input
                  type="text"
                  value={newNoteSymbol}
                  onChange={(e) => setNewNoteSymbol(e.target.value)}
                  placeholder="如: AAPL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  笔记内容
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="记录你的投资想法..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateNote}
                disabled={createNote.isPending || !newNoteContent.trim()}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {createNote.isPending ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

