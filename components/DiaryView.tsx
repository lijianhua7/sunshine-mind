'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { ai, MODELS } from '../lib/ai';

export function DiaryView() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;
    
    setSubmitting(true);
    try {
      // Very brief check for harmful content/extreme negativity for the requirement
      // "若用户输入涉及危害他人、自残或自杀倾向的关键词，AI 必须立即停止总结功能，并展示危机干预资源"
      // We can do a quick classification
      const safetyCheckResponse = await ai.models.generateContent({
        model: MODELS.text,
        contents: `Analyze the following diary entry for severe self-harm, suicide, or harm to others. Reply ONLY with "SAFE" or "DANGER". \n\nEntry: ${content}`,
      });
      
      const safetyResult = safetyCheckResponse.text?.trim().toUpperCase() || 'SAFE';
      
      if (safetyResult.includes('DANGER')) {
        toast.error('If you are experiencing a crisis, please reach out for help immediately. You are not alone.', {
          description: 'Emergency Contact: 911 (US) / 110 (CN) or Local Crisis Hotline.',
          duration: 10000,
        });
        
        await addDoc(collection(db, `users/${user.uid}/records`), {
          userId: user.uid,
          recordType: 'diary',
          content: content,
          emotions: ['Crisis'],
          timestamp: serverTimestamp(),
          isFlagged: true
        });
        
        setCompleted(true);
        return;
      }
    
      await addDoc(collection(db, `users/${user.uid}/records`), {
        userId: user.uid,
        recordType: 'diary',
        content,
        emotions: [], // Leave empty, to be analyzed in daily summary
        timestamp: serverTimestamp(),
        isFlagged: false
      });
      
      setCompleted(true);
      toast.success('Your diary has been saved securely.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save diary.');
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
        <h3 className="text-xl font-serif text-[#4A4A4A] mb-2">Saved to your private vault</h3>
        <p className="text-[#7A7A7A] mb-6">Your thoughts are safe here. They will be included in your daily summary.</p>
        <Button variant="outline" onClick={() => { setCompleted(false); setContent(''); }} className="rounded-full border-[#EBE6E0] text-[#7A7A7A]">
          Write Again
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8 rounded-3xl border-0 bg-transparent shadow-none flex flex-col gap-4">
      <div className="glass-panel p-6 flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-lg text-[#2D3436] font-medium">心情日记</h3>
        <p className="text-sm text-[#636E72]">让文字自然流淌，没有条条框框，没有评判。</p>
      </div>
      
      <Textarea 
        placeholder="亲爱的日记，今天我感觉到..."
        className="min-h-[250px] resize-none border-white/60 rounded-2xl bg-white/40 p-4 text-[#2D3436] focus-visible:ring-[#A8B59B] placeholder:text-[#2D3436]/40 backdrop-blur-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      
      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleSubmit} 
          disabled={!content.trim() || submitting}
          className="rounded-full bg-white/60 border border-white/60 hover:bg-white/80 text-[#4A5D4E] px-8 shadow-sm"
        >
          {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          封存记录
        </Button>
      </div>
      </div>
    </Card>
  );
}
