'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Info, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { getUserEntries } from '@/lib/entries';
import { ai } from '@/lib/ai';

export default function PeriodicReportView() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const data = await getUserEntries(user.uid, 50);
        setEntries(data || []);
      } catch (e: any) {
        console.error(e);
        // Fallback to empty if permissions fail
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const generateReport = async () => {
    if (entries.length < 3) return;
    setIsGenerating(true);
    try {
      const entriesText = entries.map(e => `[${e.type}] ${e.content} (Mood: ${e.mood})`).join('\n\n');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `这里是用户近期（最多50条）的心情记录。请生成一份周期性成长报告。
        要求输出 JSON 格式：
        {
          "awarenessScore": 90, // 百分比
          "trend": "平稳/上升/波动",
          "trendDesc": "一两句话描述趋势",
          "reflectionCount": 10, // 基于数据
          "topEvents": [{"title": "事件名", "count": 5, "mood": "心情词"}], // 最多3个
          "growthLetter": "AI月度成长信，医生视角，同理心，150字左右"
        }
        
        记录内容：
        ${entriesText}`,
      });
      
      const cleanJson = (response.text || '{}').replace(/```json/i, '').replace(/```/g, '').trim();
      setReport(JSON.parse(cleanJson));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground font-serif italic">正在为你编织成长画卷...</p>
      </div>
    );
  }

  if (entries.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Info size={48} className="text-muted-foreground/30 mb-6" />
        <h2 className="font-serif text-3xl font-medium mb-4">记录还不够多</h2>
        <p className="text-muted-foreground max-w-sm mx-auto italic mb-8">
          数据积累不足，建议再记录 {3 - entries.length} 天，以便我能为你提供更深度的周期性洞察。
        </p>
      </div>
    );
  }

  const displayReport = report || {
    awarenessScore: 85,
    trend: '正在探索',
    trendDesc: '你的记录正在帮助我们更好地理解你的情感轨迹。',
    reflectionCount: entries.length,
    topEvents: [],
    growthLetter: '记录心情就像在沙漠中挖掘泉水。每一篇日记都是你对自己的一次诚实投射。继续保持这份觉察，你会发现内心深处从未察觉的力量。'
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-3">心灵洞察</h1>
          <p className="text-muted-foreground text-lg italic">长期的情感轨迹与个人成长记录。</p>
        </div>
        {!report && (
          <Button onClick={generateReport} disabled={isGenerating} className="rounded-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
            {isGenerating ? '分析中...' : '生成最新分析'}
          </Button>
        )}
      </header>

      <div className="grid md:grid-cols-3 gap-6 text-center">
        <Card className="border border-border/50 shadow-sm p-8 bg-card rounded-[2rem] hover:bg-accent/10 transition-colors">
          <div className="font-serif text-5xl font-medium text-foreground mb-2 text-[#809689]">{displayReport.awarenessScore}%</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">自我觉察度</div>
        </Card>
        <Card className="border border-border/50 shadow-sm p-8 bg-card rounded-[2rem] hover:bg-accent/10 transition-colors">
          <div className="font-serif text-4xl font-medium text-foreground mb-2 mt-2 text-[#D8A492]">{displayReport.trend}</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-5">情绪趋势</div>
          <div className="text-xs text-[#D8A492]/80 mt-2 font-medium">{displayReport.trendDesc}</div>
        </Card>
        <Card className="border border-border/50 shadow-sm p-8 bg-card rounded-[2rem] hover:bg-accent/10 transition-colors">
          <div className="font-serif text-5xl font-medium text-foreground mb-2 text-[#A8A4CE]">{displayReport.reflectionCount}</div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">记录总数</div>
          <div className="text-xs text-[#A8A4CE]/80 mt-2 font-medium">完成的心灵对话</div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border border-border/50 shadow-sm min-h-[300px] flex items-center justify-center bg-card rounded-[2rem] p-12 overflow-hidden relative">
          <TrendingUp size={200} className="absolute -bottom-10 -left-10 text-primary/5 -rotate-12" strokeWidth={1} />
          <div className="text-center max-w-sm relative z-10">
            <BarChart3 size={64} className="mx-auto text-muted-foreground/30 mb-6" strokeWidth={1} />
            <h3 className="font-serif text-2xl font-medium text-foreground mb-3">成长轨迹</h3>
            <p className="text-muted-foreground text-base italic">每一个起伏都是生命的韵律。</p>
          </div>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card rounded-[2rem] p-8 md:p-10">
          <h3 className="font-serif text-2xl font-medium text-foreground mb-6">高频事件回顾</h3>
          <div className="space-y-6">
            {displayReport.topEvents.length > 0 ? displayReport.topEvents.map((ev: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center text-foreground font-medium text-lg">{idx + 1}</div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{ev.title}</p>
                    <p className="text-muted-foreground text-xs">出现 {ev.count} 次</p>
                  </div>
                </div>
                <span className="text-primary text-sm font-medium px-3 py-1 bg-primary/10 rounded-full">{ev.mood}</span>
              </div>
            )) : (
              <p className="text-muted-foreground italic text-center py-12">点击生成分析以查看高频事件</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-secondary text-secondary-foreground p-8 md:p-12 rounded-[2rem]">
        <div className="flex gap-6 items-start flex-col md:flex-row">
          <div className="p-4 bg-background/20 rounded-full shrink-0">
            <Sparkles size={24} className="text-foreground" />
          </div>
          <div>
            <h3 className="font-serif text-2xl font-medium mb-4">AI 成长回信</h3>
            <p className="leading-relaxed max-w-4xl font-serif text-xl italic whitespace-pre-wrap">
              &quot;{displayReport.growthLetter}&quot;
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
