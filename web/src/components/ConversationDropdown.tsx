import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Conversation } from '../services/conversationService';

interface ConversationDropdownProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

export const ConversationDropdown: React.FC<ConversationDropdownProps> = ({
  conversations,
  currentConversationId,
  onSelect,
  onCreate,
  onDelete,
  onUpdateTitle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  console.log('🔍 ConversationDropdown render:', { conversations, currentConversationId });

  const currentConv = conversations.find(c => c.id === currentConversationId);

  const handleEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSave = (id: string) => {
    if (editTitle.trim()) {
      onUpdateTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm"
      >
        <MessageSquare size={16} />
        <span className="hidden md:inline max-w-[150px] truncate">
          {currentConv?.title || 'Chọn cuộc hội thoại'}
        </span>
        <span className="text-xs text-slate-500">
          {currentConv ? `${currentConv.message_count}/3` : ''}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-[2000] backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[2100] overflow-y-auto transform transition-transform duration-300">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Cuộc hội thoại</h3>
              <button
                onClick={() => {
                  onCreate();
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-indigo-50 rounded text-indigo-600"
                title="Tạo cuộc hội thoại mới"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="py-1">
              {conversations.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm">
                  Chưa có cuộc hội thoại nào
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`px-3 py-2 hover:bg-slate-50 cursor-pointer border-l-2 ${
                      conv.id === currentConversationId
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-transparent'
                    }`}
                  >
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(conv.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          onClick={() => handleSave(conv.id)}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 hover:bg-red-100 rounded text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          onSelect(conv.id);
                          setIsOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate flex-1">
                            {conv.title}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(conv);
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                              title="Sửa tên"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Xóa cuộc hội thoại này?')) {
                                  onDelete(conv.id);
                                }
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Xóa"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{conv.message_count} tin nhắn</span>
                          <span>•</span>
                          <span>{new Date(conv.updated_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
