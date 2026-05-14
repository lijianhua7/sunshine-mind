'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ai } from '@/lib/ai';
import { useAuth } from '@/components/AuthProvider';
import { saveJournalEntry } from '@/lib/entries';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '你好。我是心声回响。我在这里静静倾听，为你此刻的感受留出一个温暖的空间。今天你心里在想些什么呢？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState<{ event: string; tags: string[] } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!chatRef.current) {
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are Soul Echo, a compassionate and empathetic AI companion. Your goal is to listen deeply, reflect back inner wisdom, and provide a safe space for emotional expression. Avoid clinical advice; focus on being a supportive presence. IMPORTANT: Respond in Chinese (Simplified). \n\n【风险控制规则】\n1. 【温柔阻断】：当检测到用户有严重的负面情绪（如极度绝望、崩溃），停止深度追问。给出舒缓建议（如建议喝杯温水、休息一下），以安抚为主。\n2. 【安全底线】：如果用户明确提到伤害他人、自残或自杀倾向，你必须立即停止正常的总结与对话，表现出深深的共情，并强烈建议他们联系危机干预资源（如中国心理危机与自杀干预中心救助热线: 010-82951332）。'
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
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      const responseStream = await chatRef.current.sendMessageStream({ message: userMsg });
      setIsTyping(false);

      for await (const chunk of responseStream) {
        if (chunk.text) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'model') {
              lastMsg.text += chunk.text;
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.warn('Chat error:', error);
      toast.error(`心声回响连接失败：${error instanceof Error ? error.message : String(error)}`);
      setIsTyping(false);
    }
  };

  const handleEndChat = async () => {
    if (messages.length <= 1) return;
    setIsTyping(true);
    try {
      const historyText = messages.slice(1).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.text}`).join('\n');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `这里是一段心理倾诉当事人和AI的对话。请提取核心事件和情绪标签。
要求：
1. 核心事件（event）：一句话描述，保持中立客观，不要打分或评判。
2. 情绪标签（tags）：逗号分隔的情绪词，最多3个。
以如下JSON格式输出，不要有其他前缀或markdown符号：
{"event": "描述", "tags": ["标签1", "标签2"]}

对话记录：
${historyText}`,
      });
      const text = response.text || '{}';
      const cleanJson = text.replace(/```json/i, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson);
      setSummary(result);
    } catch (error) {
      console.warn('Summary error:', error);
      toast.error('生成总结失败，请稍后重试。');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveToDiary = async () => {
    if (!user || !summary) return;
    setIsSaving(true);
    try {
      const historyText = messages.slice(1).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.text}`).join('\n\n');
      
      const moodResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `根据以下对话内容，从“开心、沮丧、委屈、平静”中选择最贴切的一个。只输出这四个词中的一个。内容：\n${historyText}`,
      });
      const mood = (moodResponse.text || '平静').trim();

      await saveJournalEntry({
        userId: user.uid,
        content: historyText,
        mood: mood,
        summary: summary.event,
        tags: summary.tags,
        type: 'chat',
        isNegative: mood === '沮丧' || mood === '委屈'
      });

      toast.success('对话已存入日记。');
      setSummary(null);
      setMessages([{ role: 'model', text: '你好。我是心声回响。我在这里静静倾听，为你此刻的感受留出一个温暖的空间。今天你心里在想些什么呢？' }]);
    } catch (e) {
      toast.error('保存失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col items-center text-center relative">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-3">心声回响</h1>
        <p className="text-muted-foreground text-lg italic tracking-wide">“你的心知道方向。陪伴一直在这里。”</p>
        {!summary && messages.length > 1 && (
          <Button 
            variant="outline" 
            onClick={handleEndChat} 
            disabled={isTyping}
            className="md:absolute right-0 top-0 mt-4 md:mt-0 rounded-full border-border/50 hover:bg-muted/50"
          >
            结束并总结
          </Button>
        )}
      </header>

      <Card className="flex-1 border border-border/50 shadow-sm overflow-hidden flex flex-col bg-card rounded-[2rem] relative">
        {summary && (
          <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-center justify-center p-6">
            <Card className="max-w-md w-full border border-border/50 shadow-lg p-8 rounded-[2rem]">
              <h2 className="font-serif text-2xl font-medium text-foreground mb-6 text-center">对话随笔</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">核心事件</h3>
                  <p className="text-foreground leading-relaxed">{summary.event}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">情绪色彩</h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-secondary/50 text-secondary-foreground rounded-full text-sm font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Button onClick={handleSaveToDiary} disabled={isSaving} className="w-full mt-8 rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium">
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    '记入日记并回味'
                  )}
                </Button>
                <Button variant="ghost" onClick={() => setSummary(null)} className="w-full rounded-full text-muted-foreground">
                  继续聊聊
                </Button>
              </div>
            </Card>
          </div>
        )}
        <ScrollArea className="flex-1 p-6 md:p-8" ref={scrollRef}>
          <div className="space-y-8">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <Avatar className={m.role === 'model' ? 'bg-primary/20 text-primary-foreground' : 'bg-secondary/50 text-secondary-foreground ring-1 ring-border/50'}>
                  <AvatarFallback className="bg-transparent text-foreground/70">
                    {m.role === 'model' ? <Sparkles size={18} /> : <User size={18} />}
                  </AvatarFallback>
                </Avatar>
                <div className={`max-w-[80%] p-5 rounded-3xl ${
                  m.role === 'model' 
                    ? 'bg-muted/50 border border-border/50 text-foreground rounded-tl-none font-sans text-[15px]' 
                    : 'bg-foreground text-background rounded-tr-none shadow-sm'
                }`}>
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-4">
                <Avatar className="bg-primary/20 text-primary-foreground">
                  <AvatarFallback className="bg-transparent"><Sparkles size={18} className="text-foreground/70" /></AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 border border-border/50 p-5 rounded-3xl rounded-tl-none flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 md:p-6 border-t border-border/30 bg-card">
          <form className="flex gap-3 relative" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="今天有什么觉得沉重的吗？"
              className="flex-1 bg-background border-border/50 rounded-full px-6 py-6 h-auto text-base focus-visible:ring-primary/50 shadow-sm"
            />
            <Button type="submit" disabled={!input.trim() || isTyping} className="rounded-full w-14 h-14 p-0 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0">
              <Send size={20} className="ml-1" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
