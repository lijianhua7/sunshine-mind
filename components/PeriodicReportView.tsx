'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, CalendarRange, TrendingUp, Sparkles } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { ai, MODELS } from '../lib/ai';
import { Type } from '@google/genai';
import { format, subDays } from 'date-fns';

interface PeriodicReport {
  summary: string;
  suggestions: string[];
}

export function PeriodicReportView() {
  const { user } = useAuth();
  const [report, setReport] = useState<PeriodicReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [recordCount, setRecordCount] = useState<number | null>(null);

  useEffect(() => {
    const checkRecords = async () => {
      if (!user) return;
      const q = query(collection(db, `users/${user.uid}/records`));
      const snap = await getDocs(q);
      setRecordCount(snap.size);
    };
    checkRecords();
  }, [user]);

  const generateReport = async () => {
    if (!user || recordCount === null) return;
    setLoading(true);
    try {
      const q = query(collection(db, `users/${user.uid}/dailySummaries`));
      const snap = await getDocs(q);
      
      let contextStr = '';
      let isInitial = false;
      
      if (snap.size < 3) {
        // Less than 3 days of summaries: use raw records if needed
        isInitial = true;
        const recQ = query(collection(db, `users/${user.uid}/records`));
        const recSnap = await getDocs(recQ);
        contextStr = recSnap.docs.map(d => d.data().content).join('\n---\n');
      } else {
        contextStr = snap.docs.map(d => {
          const dt = d.data();
          return `Date: ${dt.dateId}\nEmotion: ${dt.coreEmotion}\nEvents: ${dt.keyEvents?.join(', ')}`;
        }).join('\n\n');
      }

      if (!contextStr.trim()) {
        toast.info("No records to analyze yet.");
        setLoading(false);
        return;
      }

      const promptStr = isInitial 
        ? `You are an AI therapist. The user has only recorded a few times (less than a week). Generate an "Initial Impression Report". 
           Identify their current state of mind and provide 2-3 gentle suggestions to keep journaling.
           Be very encouraging and soft-spoken.`
        : `You are an AI therapist analyzing a user's recent week of daily summaries. Generate a "Weekly Insight Report".
           Analyze emotion trends, highlight how they handled challenges (especially if you see negative emotions that they overcame),
           and provide 2-4 actionable, gentle wellness suggestions. Keep the tone warm and empowering.`;

      const response = await ai.models.generateContent({
        model: MODELS.text,
        contents: `${promptStr}\n\nData:\n${contextStr}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['summary', 'suggestions']
          }
        }
      });

      const generated = JSON.parse(response.text || '{}');
      
      await addDoc(collection(db, `users/${user.uid}/periodicReports`), {
        userId: user.uid,
        periodType: 'weekly',
        startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        summary: generated.summary || '',
        suggestions: generated.suggestions || [],
        timestamp: serverTimestamp()
      });

      setReport(generated);
      toast.success(isInitial ? 'Initial Impression generated.' : 'Weekly Insight generated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-light text-[#2D3436]">数据洞察</h2>
        <p className="text-[#636E72] mt-2">更广阔地回望你的情绪旅程。</p>
      </div>

      {!report && (
        <Card className="glass-panel p-10 text-center flex flex-col items-center">
          <div className="bg-[#A8B59B]/20 p-4 rounded-full mb-6">
            <CalendarRange className="w-8 h-8 text-[#4A5D4E]" />
          </div>
          <h3 className="text-xl text-[#2D3436] mb-2 font-medium">分析你的旅程</h3>
          {recordCount !== null && recordCount < 5 ? (
             <p className="text-[#636E72] mb-6 max-w-md">
               你才刚刚开始记录（数据积累较少）。我们可以先生成一份 <strong className="text-[#4A5D4E]">初期印象报告</strong>。继续记录以获取更深入的周报洞察。
             </p>
          ) : (
            <p className="text-[#636E72] mb-6 max-w-md">
              生成一份近期情绪趋势和专属健康建议的综合报告。
             </p>
          )}
          <Button 
            onClick={generateReport} 
            disabled={loading}
            className="rounded-full bg-white/60 hover:bg-white/80 border border-white/60 text-[#4A5D4E] px-8 h-12 shadow-sm font-medium transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
            生成报告
          </Button>
        </Card>
      )}

      {report && (
        <div className="space-y-6">
          <Card className="glass-panel p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
               <TrendingUp className="w-32 h-32 text-[#4A5D4E]" />
             </div>
             <div className="relative z-10">
               <h3 className="text-sm uppercase tracking-widest text-[#4A5D4E] font-bold mb-4 border-b border-black/5 pb-2">旅途总结</h3>
               <p className="text-[#444] leading-relaxed text-lg font-light italic">{report.summary}</p>
             </div>
          </Card>
          
          <h3 className="text-sm uppercase tracking-widest text-[#4A5D4E] font-bold mt-8 mb-4 px-2">专属建议</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.suggestions.map((sug, i) => (
              <Card key={i} className="glass-panel p-6 hover:bg-white/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="bg-white/40 text-[#4A5D4E] w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white/50">
                    {i + 1}
                  </div>
                  <p className="text-[#2D3436] text-sm leading-relaxed mt-1">{sug}</p>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={() => setReport(null)} className="rounded-full glass-panel text-[#636E72] hover:bg-white/60 hover:text-[#2D3436]">
              关闭报告
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
