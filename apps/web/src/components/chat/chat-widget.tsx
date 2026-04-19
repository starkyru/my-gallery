'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { UPLOAD_URL } from '@/config';
import { useAuthStore } from '@/store/auth';
import { ChatIcon } from '@/components/icons/chat-icon';
import { SendIcon } from '@/components/icons/send-icon';
import { CloseIcon } from '@/components/icons/close-icon';
import { ExpandIcon } from '@/components/icons/expand-icon';
import { CollapseIcon } from '@/components/icons/collapse-icon';

interface ChatImage {
  id: number;
  title: string;
  thumbnailPath: string;
  watermarkPath: string;
  width: number;
  height: number;
  price: number;
  artist: { name: string; slug: string };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: ChatImage[];
}

const THROTTLE_MS = 5000;

export function ChatWidget() {
  const { isAdmin } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentAt, setLastSentAt] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const now = Date.now();
    if (now - lastSentAt < THROTTLE_MS) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Please wait a few seconds before sending another message.' },
      ]);
      return;
    }

    const userMessage: Message = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setLastSentAt(now);

    try {
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.chat.send(apiMessages);
      if (debugMode && response.debug) {
        console.log('[Chat Debug] AI result:', response.debug);
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.message, images: response.images },
      ]);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      const text =
        status === 429
          ? 'Please wait a few seconds before sending another message.'
          : 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, lastSentAt, messages, debugMode]);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat assistant"
          className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gallery-accent text-gallery-black shadow-lg transition-transform hover:scale-105 active:scale-95 sm:right-6"
        >
          <ChatIcon size={24} />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed z-40 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gallery-black shadow-2xl transition-all duration-300 ${
            isExpanded
              ? 'bottom-4 right-4 top-20 w-[360px] max-w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6 sm:w-[380px]'
              : 'bottom-4 right-4 w-[360px] max-w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6 sm:w-[380px]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gallery-white">Gallery Assistant</span>
              {isAdmin() && (
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                    className="accent-gallery-accent w-3 h-3"
                  />
                  <span className="text-[10px] text-gallery-gray">debug</span>
                </label>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
                className="text-gallery-gray transition-colors hover:text-gallery-white"
              >
                {isExpanded ? <CollapseIcon size={16} /> : <ExpandIcon size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="text-gallery-gray transition-colors hover:text-gallery-white"
              >
                <CloseIcon size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className={`flex flex-col gap-3 overflow-y-auto p-4 ${
              isExpanded ? 'flex-1' : 'max-h-[400px] min-h-[200px]'
            }`}
          >
            {messages.length === 0 && (
              <p className="text-center text-sm text-gallery-gray">
                Describe what kind of image you&apos;re looking for and I&apos;ll help you find it.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gallery-accent text-gallery-black'
                      : 'border border-white/10 bg-white/5 text-gallery-white'
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.images && msg.images.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                      {msg.images.map((img) => (
                        <Link
                          key={img.id}
                          href={`/gallery/${img.id}`}
                          className="group flex gap-3 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
                        >
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                            <Image
                              src={`${UPLOAD_URL}/${img.thumbnailPath}`}
                              alt={img.title || 'Gallery image'}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col justify-center">
                            <span className="truncate text-xs font-medium text-gallery-white group-hover:text-gallery-accent">
                              {img.title || 'Untitled'}
                            </span>
                            {img.artist?.name && (
                              <span className="truncate text-xs text-gallery-gray">
                                {img.artist.name}
                              </span>
                            )}
                            {img.price > 0 && (
                              <span className="text-xs text-gallery-accent">${img.price}</span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gallery-gray">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe what you're looking for..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gallery-white placeholder:text-gallery-gray focus:border-gallery-accent focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gallery-accent text-gallery-black transition-opacity disabled:opacity-40"
              >
                <SendIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
