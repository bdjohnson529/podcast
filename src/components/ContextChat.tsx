'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { ChatMessage } from '@/types';
import toast from 'react-hot-toast';

interface ContextChatProps {
  onComplete: (context: string) => void;
  onSkip: () => void;
}

export function ContextChat({ onComplete, onSkip }: ContextChatProps) {
  const { currentInput } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch('/api/context-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initialize',
            topic: currentInput.topic,
            familiarity: currentInput.familiarity,
            duration: currentInput.duration,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to initialize chat');
        }

        const { message } = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: message,
          timestamp: new Date(),
        };

        setMessages([assistantMessage]);
      } catch (error) {
        toast.error('Failed to start conversation');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isInitialized) {
      initChat();
      setIsInitialized(true);
    }
  }, [isInitialized, currentInput.topic, currentInput.familiarity, currentInput.duration]);

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/context-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'continue',
          messages: [...messages, userMessage],
          topic: currentInput.topic,
          familiarity: currentInput.familiarity,
          duration: currentInput.duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const { message, isComplete, context } = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (isComplete && context) {
        // Give user a moment to read the final message before completing
        setTimeout(() => {
          onComplete(context);
        }, 2000);
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className={index > 0 ? 'mt-2' : ''}>
        {line}
      </p>
    ));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Let&apos;s Personalize Your Learning
        </h2>
        <p className="text-gray-600">
          I&apos;d like to ask a few questions to better understand what you&apos;re looking to learn about &ldquo;{currentInput.topic}&rdquo;. This will help create a more targeted and useful podcast for you.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-sm">
                  {formatMessage(message.content)}
                </div>
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-2">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!userInput.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
          <div className="mt-2 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </p>
            <button
              onClick={onSkip}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Skip this step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
