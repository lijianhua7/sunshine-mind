'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Loader2, CheckCircle2, Send, Bot, User as UserIcon } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { ai, MODELS } from '../lib/ai';
import { ScrollArea } from './ui/scroll-area';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export function ChatView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi there. I am here to listen. How was your day?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = ai.chats.create({
        model: MODELS.text,
        config: {
          systemInstruction: "You are a warm, empathetic friend and a psychological counselor. Do not give medical advice, but do offer comfort. Keep replies concise, gentle, and conversational. Never be preachy. If the user mentions extreme harm, gently suggest they seek professional crisis help.",
        }
      });
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !chatRef.current) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    
    try {
      const result = await chatRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: result.text || '...' }]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndChat = async () => {
    if (!user || messages.length <= 1) return;
    
    setSubmitting(true);
    try {
      const transcript = messages.map(m => `${m.role === 'model' ? 'AI' : 'User'}: ${m.text}`).join('\n');
      
      await addDoc(collection(db, `users/${user.uid}/records`), {
        userId: user.uid,
        recordType: 'chat',
        content: transcript,
        emotions: [],
        timestamp: serverTimestamp(),
        isFlagged: false
      });
      
      setCompleted(true);
      toast.success('Chat transcript saved.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save chat.');
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-0 shadow-sm bg-white">
        <div className="rounded-full bg-green-50 p-4 mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-xl font-serif text-[#4A4A4A] mb-2">Chat completed</h3>
        <p className="text-[#7A7A7A] mb-6">I hope you feel a little better now. Have a peaceful day.</p>
        <Button variant="outline" onClick={() => { 
          setCompleted(false); 
          setMessages([{ role: 'model', text: 'Hi again. I am here whenever you need me.' }]); 
          chatRef.current = null; // Re-init on next effect
        }} className="rounded-full border-[#EBE6E0] text-[#7A7A7A]">
          Start New Chat
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px] rounded-3xl border-0 bg-transparent shadow-none overflow-hidden p-8">
      <div className="glass-panel flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-black/5 bg-white/20">
        <div className="flex items-center gap-2">
          <div className="bg-[#A8B59B] p-1.5 rounded-full">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-[#2D3436]">Soul Echo AI</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleEndChat} disabled={messages.length <= 1 || submitting} className="text-[#636E72] text-xs hover:bg-white/40">
          {submitting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
          结束并保存
        </Button>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm backdrop-blur-sm ${
                msg.role === 'user' 
                  ? 'bg-white/80 text-[#4A5D4E] border border-white/60 rounded-tr-sm shadow-sm' 
                  : 'bg-white/40 text-[#2D3436] border border-white/30 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/40 border border-white/30 text-[#2D3436] rounded-tl-sm flex items-center space-x-1 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-[#4A5D4E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#4A5D4E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#4A5D4E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-black/5 bg-white/20 backdrop-blur-md">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
          <Input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            placeholder="输入一条消息..." 
            className="rounded-full bg-white/50 border-white/60 focus-visible:ring-[#A8B59B] text-[#2D3436] placeholder:text-[#2D3436]/50"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="rounded-full bg-white/60 border border-white/60 hover:bg-white/80 text-[#4A5D4E] shadow-sm">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
      </div>
    </Card>
  );
}
