import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useChatStore } from './store/chat.store';
import { useUserStore } from './store/user.store';
import { socketService } from './socket/socket.service';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatLayout from './layouts/ChatLayout';
import ProtectedRoute from './routes/ProtectedRoute';

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { addMessage, setTyping, markConversationRead, addOrUpdateConversation, addReaction, removeReaction } = useChatStore();
  const { setUserOnline, setUserOffline } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubs = [
      socketService.onMessageReceived((msg) => addMessage(msg)),
      socketService.onMessageSent((msg) => addMessage(msg)),
      socketService.onTyping(({ userId, conversationId, isTyping }) => {
        if (userId !== user?.id) {
          setTyping(conversationId, userId, isTyping);
        }
      }),
      socketService.onUserOnline(({ userId }) => setUserOnline(userId)),
      socketService.onUserOffline(({ userId, lastSeen }) =>
        setUserOffline(userId, lastSeen as unknown as string),
      ),
      socketService.onMessageRead(({ conversationId }) =>
        markConversationRead(conversationId),
      ),
      socketService.onConversationUpdated((data) => {
        // conversation_updated carries { conversationId, lastMessage } not a full Conversation;
        // addMessage already updates the conversation list, so nothing to do here.
        if (data?.id) addOrUpdateConversation(data);
      }),
      socketService.onReactionAdded(({ messageId, reaction }) =>
        addReaction(messageId, reaction),
      ),
      socketService.onReactionRemoved(({ messageId, userId, emoji }) =>
        removeReaction(messageId, userId, emoji),
      ),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [isAuthenticated, user?.id]);

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
