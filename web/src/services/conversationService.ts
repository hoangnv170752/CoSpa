/**
 * Conversation management service
 * Handles conversation CRUD operations with backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export const createConversation = async (userId: string, title?: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        title: title || 'Cuộc hội thoại'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create conversation');
    }

    const data = await response.json();
    return data.conversation_id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    const data = await response.json();
    return data.conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
};

export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }

    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

export const updateConversationTitle = async (conversationId: string, title: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      throw new Error('Failed to update conversation title');
    }

    return true;
  } catch (error) {
    console.error('Error updating conversation title:', error);
    return false;
  }
};

export const getConversationMessages = async (conversationId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`);

    if (!response.ok) {
      console.error('❌ API response not OK:', response.status);
      throw new Error('Failed to fetch conversation messages');
    }

    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return [];
  }
};
