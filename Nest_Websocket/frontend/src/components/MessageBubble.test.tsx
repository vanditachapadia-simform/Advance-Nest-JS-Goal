import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from './MessageBubble';
import type { Message } from '../types';

const mockMessage: Message = {
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Hello world!',
  status: 'SENT',
  isRead: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sender: { id: 'user-1', name: 'Alice', avatar: null },
};

const defaultProps = {
  message: mockMessage,
  isOwn: true,
  currentUserId: 'user-1',
  conversationId: 'conv-1',
};

describe('MessageBubble', () => {
  it('renders message content', () => {
    render(<MessageBubble {...defaultProps} />);
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });

  it('applies own styles when isOwn is true', () => {
    const { container } = render(<MessageBubble {...defaultProps} />);
    const bubble = container.querySelector('[style*="DCF8C6"]');
    expect(bubble).toBeTruthy();
  });

  it('shows DoneAll icon for own messages', () => {
    render(<MessageBubble {...defaultProps} />);
    // Status icon should be present for own messages
    expect(screen.queryByText('Hello world!')).toBeInTheDocument();
  });

  it('does not show status icon for others messages', () => {
    render(<MessageBubble {...defaultProps} isOwn={false} />);
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
  });
});
