'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, chatClient } from '../lib/chat-client';
import { Button } from '@/shared/ui/Button';
import styles from './ChatBox.module.css';

interface ChatBoxProps {
  userId: string;
  username: string;
  channel?: 'global' | 'game' | 'whisper';
}

export function ChatBox({ userId, username, channel = 'global' }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to chat
    chatClient.connect(userId, username);
    setIsConnected(true);

    // Setup message handler
    chatClient.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Cleanup
    return () => {
      chatClient.disconnect();
      setIsConnected(false);
    };
  }, [userId, username]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    chatClient.sendMessage(inputValue, channel);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.chatBox}>
      <div className={styles.header}>
        <span className={styles.title}>
          {channel === 'global' ? '🌍 Global Chat' : '🎮 Game Chat'}
        </span>
        <span className={styles.status}>
          {isConnected ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.userId === userId ? styles.own : ''
            }`}
          >
            <span className={styles.username}>{msg.username}</span>
            <span className={styles.text}>{msg.message}</span>
            <span className={styles.timestamp}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.input}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className={styles.textInput}
        />
        <Button onClick={handleSend} disabled={!inputValue.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
