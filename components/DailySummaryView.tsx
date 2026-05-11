'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { ai, MODELS } from '../lib/ai';
import { Type } from '@google/genai';
import { format, startOfDay, endOfDay } from 'date-fns';

interface DailySummary {
  coreEmotion: string;
  keyEvents: string[];
  doctorMessage: string;
}

export function DailySummaryView() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  const fetchTodayData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const today = new Date();
      const dateId = format(today, 'yyyy-MM-dd');
      
      // Check if summary exists
      const sumQ = query(
        collection(db, `users/${user.uid}/dailySummaries`),
        where('dateId', '==', dateId)
      );
      const sumSnap = await getDocs(sumQ);
      if (!sumSnap.empty) {
        const data = sumSnap.docs[0].data() as DailySummary;
        setSummary(data);
      }
      
      // Get record count
      const start = startOfDay(today);
      const end = endOfDay(today);
      const recQ = query(
        collection(db, `users/${user.uid}/records`),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );
      const recSnap = await getDocs(recQ);
      setRecordCount(recSnap.size);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTodayData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generateSummary = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const today = new Date();
      const dateId = format(today, 'yyyy-MM-dd');
      const start = startOfDay(today);
      const end = endOfDay(today);
      
      const recQ = query(
        collection(db, `users/${user.uid}/records`),
        where('timestamp', '>=', start),
        where('timestamp', '<=', end)
      );
      const recSnap = await getDocs(recQ);
      
      if (recSnap.empty) {
        toast.info('No records found for today to summarize.');
        setGenerating(false);
        return;
      }

      const allNotes = recSnap.docs.map(d => d.data().content).join('\n---\n');

      const response = await ai.models.generateContent({
        model: MODELS.text,
        contents: `You are an empathetic psychologist analyzing a user's diary entries from today.
        Identify their core emotion. Extract up to 3 key events. Write a comforting, doctor-like message affirming their feelings.
        If they had mixed feelings (e.g., very happy then very sad), acknowledge the fluctuation gently.
        Never be preachy. Keep it warm and supportive.
        
        Entries:
        ${allNotes}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              coreEmotion: { type: Type.STRING },
              keyEvents: { type: Type.ARRAY, items: { type: Type.STRING } },
              doctorMessage: { type: Type.STRING }
            },
            required: ['coreEmotion', 'keyEvents', 'doctorMessage']
          }
        }
      });

      const generated = JSON.parse(response.text || '{}');

      await addDoc(collection(db, `users/${user.uid}/dailySummaries`), {
        userId: user.uid,
        dateId,
        coreEmotion: generated.coreEmotion || 'Calm',
        keyEvents: generated.keyEvents || [],
        doctorMessage: generated.doctorMessage || 'You did great today.',
        timestamp: serverTimestamp()
      });

      setSummary(generated);
      toast.success('Daily summary generated.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate summary.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 rounded-3xl border-0 shadow-sm bg-white flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#E8A359]" />
      </Card>
    );
  }

  return (
    <Card className="p-8 rounded-3xl border-0 bg-transparent shadow-none overflow-hidden relative">
      <div className="glass-panel p-6 h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="w-24 h-24 text-[#4A5D4E]" />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-sm uppercase tracking-widest text-deep-sage font-bold mb-1 border-b border-black/5 pb-2">今日洞察 · Insight</h3>
        <p className="text-sm text-[#636E72] mb-6 mt-2">{format(new Date(), 'yyyy年MM月dd日')}</p>

        {summary ? (
          <div className="space-y-6">
            <div className="bg-white/30 rounded-2xl p-4 border border-white/40">
              <div className="inline-block px-3 py-1 bg-[#EBF5ED] text-[#4A5D4E] rounded-full text-xs font-semibold mb-3">
                核心情绪：{summary.coreEmotion}
              </div>
              
              <ul className="space-y-2">
                {summary.keyEvents.map((evt, i) => (
                  <li key={i} className="text-sm text-[#2D3436] flex items-start">
                    <span className="mr-2 mt-1 w-1.5 h-1.5 rounded-full bg-[#A8B59B] shrink-0" />
                    <span>{evt}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white/40 p-4 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm">
              <p className="text-sm text-[#444] leading-relaxed italic">&quot;{summary.doctorMessage}&quot;</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
            <div className="bg-white/30 p-3 rounded-full border border-white/50">
              <AlertCircle className="w-6 h-6 text-[#A8B59B]" />
            </div>
            <div>
              <p className="text-[#2D3436] font-medium">暂无总结</p>
              <p className="text-sm text-[#636E72] mt-1 text-balance">
                你今天有 {recordCount} 条记录。
              </p>
            </div>
            <Button 
              onClick={generateSummary} 
              disabled={generating || recordCount === 0}
              className="mt-2 rounded-full glass-panel shadow-sm text-[#2D3436] hover:bg-white/60"
            >
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-[#A8B59B]" />}
              立即生成
            </Button>
          </div>
        )}
      </div>
      </div>
    </Card>
  );
}
