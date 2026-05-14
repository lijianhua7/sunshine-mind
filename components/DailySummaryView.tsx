'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sun, Sparkles, ArrowRight, HeartPulse, Brain, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { getSummaryForDate, getEntriesForDateRange, saveDailySummary, DailySummary } from '@/lib/entries';
import { ai } from '@/lib/ai';
import { toast } from 'sonner';

type Tab = 'dashboard' | 'questionnaire' | 'diary' | 'chat' | 'reports';

export default function DailySummaryView({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  const fetchOrGenerateSummary = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    // Calculate "Yesterday" date string (YYYY-MM-DD)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    try {
      const existing = await getSummaryForDate(user.uid, dateStr);
      if (existing) {
        setSummary(existing);
      } else {
        // Fetch yesterday's entries
        const start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);
        const end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);
        
        const entries = await getEntriesForDateRange(user.uid, start, end);
        
        if (!entries || entries.length === 0) {
          setNoData(true);
        } else {
          // Generate with AI
          const entriesText = (entries as any[]).map(e => `[${e.type}] ${e.content}`).join('\n\n');
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `以下是用户在 ${dateStr} 这一天的所有心情记录和对话片段。请聚合成一份“昨日总结”。
            要求输出 JSON 格式：
            {
              "moodTags": ["标签1", "标签2", "标签3"],
              "keyEvents": [{"title": "事件1标题", "description": "简短描述内容"}, {"title": "事件2标题", "description": "内容"}],
              "doctorNote": "医生视角的肯定与安慰语，100字左右，温柔中立"
            }
            
            记录内容：
            ${entriesText}`,
          });
          
          const cleanJson = (response.text || '{}').replace(/```json/i, '').replace(/```/g, '').trim();
          const result = JSON.parse(cleanJson);
          
          const newSummary = {
            userId: user.uid,
            date: dateStr,
            moodTags: result.moodTags || [],
            keyEvents: result.keyEvents || [],
            doctorNote: result.doctorNote || '昨天是平静的一天，你在记录中留下了成长的痕迹。',
          };
          
          await saveDailySummary(newSummary);
          setSummary(newSummary as DailySummary);
        }
      }
    } catch (e: any) {
      console.error('Summary error:', e);
      // If we get a permission error or similar, show "No Data" state for now
      // rather than crashing, to respect user's "fallback" request.
      if (e.message?.includes('permission')) {
        setNoData(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrGenerateSummary();
  }, [fetchOrGenerateSummary]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-serif italic">正在为你打捞昨日的星光...</p>
      </div>
    );
  }

  if (noData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 text-center px-4">
        <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center text-muted-foreground/50">
          <Leaf size={48} strokeWidth={1} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-medium text-foreground mb-4">昨日留白</h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto italic">
            昨天似乎没有留下心情印记。没关系，每一个今天都是全新的开始。
          </p>
        </div>
        <Button onClick={() => onNavigate('questionnaire')} className="rounded-full px-10 py-6 bg-foreground text-background hover:bg-foreground/90 font-medium">
          开始记录今天
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-serif text-5xl font-medium tracking-tight text-foreground mb-3">昨日回音</h1>
          <p className="text-muted-foreground text-lg">这是你昨天留下的痕迹，每一刻都闪闪发光。</p>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        {/* 核心情绪标签 Core Emotion Tags */}
        <Card className="border border-border/50 shadow-sm p-8 bg-card rounded-[2rem] flex flex-col justify-between hover:bg-accent/5 transition-colors">
          <div>
            <h3 className="font-serif text-xl font-medium text-foreground mb-6 flex items-center gap-2">
              <HeartPulse className="text-[#D8A492]" size={20} />
              核心情感色彩
            </h3>
            <div className="flex flex-wrap gap-3">
              {(summary?.moodTags || []).map((tag, idx) => (
                <span key={idx} className="px-4 py-2 bg-secondary/30 text-secondary-foreground rounded-xl font-medium text-sm">
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-8 text-sm text-muted-foreground leading-relaxed">
              这是昨天情绪为你画下的色块，无论明暗，它们都是生命脉动的证明。
            </p>
          </div>
        </Card>

        {/* 标志性关键事件 Key Events */}
        <Card className="md:col-span-2 border border-border/50 shadow-sm p-8 bg-card rounded-[2rem] hover:bg-accent/5 transition-colors">
           <h3 className="font-serif text-xl font-medium text-foreground mb-6 flex items-center gap-2">
            <Leaf className="text-[#97A991]" size={20} />
            时光里的闪光点
          </h3>
          <div className="space-y-4">
            {(summary?.keyEvents || []).map((ev, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

       {/* 医生视角的肯定与安慰语 Doctor's Note */}
      <Card className="border border-border/50 shadow-sm overflow-hidden bg-primary/10 p-8 md:p-12 relative rounded-[2rem]">
        <Brain className="absolute -bottom-8 -right-8 text-primary/20 rotate-12" size={180} strokeWidth={1} />
        <div className="relative z-10 max-w-2xl">
          <h2 className="font-serif text-3xl font-medium mb-6 text-foreground flex items-center gap-3">
            <Sparkles className="text-primary" size={26} />
            回音小札
          </h2>
          <p className="text-xl text-foreground/80 leading-relaxed mb-8 font-serif italic border-l-4 border-primary/40 pl-6 py-2">
            “{summary?.doctorNote}”
          </p>
          <div className="flex gap-4">
             <Button onClick={() => onNavigate('questionnaire')} className="rounded-full px-8 py-6 text-base font-semibold shadow-sm hover:shadow-md transition-shadow group bg-foreground text-background hover:bg-foreground/90">
              记录此刻感受
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" onClick={() => onNavigate('chat')} className="rounded-full px-8 py-6 text-base font-semibold shadow-sm hover:bg-muted/50 border-border/50">
              聊聊今天
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
