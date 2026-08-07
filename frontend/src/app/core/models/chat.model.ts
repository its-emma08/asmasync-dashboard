export interface ChatParticipant {
    id: number;
    full_name: string;
    role: string;
}

export interface ChatMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    recipient_id: number;
    content: string;
    is_read: boolean;
    read_at?: string | null;
    created_at?: string | null;
}

export interface Conversation {
    id: number;
    doctor_id: number;
    patient_id: number;
    last_message_at?: string | null;
    updated_at?: string | null;
    other_participant: ChatParticipant;
    last_message?: ChatMessage | null;
    unread_count: number;
}

export interface PaginatedMessages {
    messages: ChatMessage[];
    has_more: boolean;
}
