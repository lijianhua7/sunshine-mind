'use client';

import { useState } from 'react';
import { ai, MODELS } from '../lib/ai';
import { Type } from '@google/genai';
import { useAuth } from './AuthProvider';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

const BASE_EMOTIONS = [
  { id: 'joy', label: '喜悦 (Joy)', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'sadness', label: '悲伤 (Sadness)', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'anxiety', label: '焦虑 (Anxiety)', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'anger', label: '愤怒 (Anger)', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { id: 'peaceful', label: '平静 (Peaceful)', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  { id: 'overwhelmed', label: '心力交瘁 (Overwhelmed)', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' }
];

interface Question {
  question: string;
  options: string[];
}

export function QuestionnaireView() {
  const { user } = useAuth();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const fetchQuestions = async (emotion: string) => {
    setSelectedEmotion(emotion);
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: MODELS.text,
        contents: `You are a gentle psychological counselor. The user is feeling '${emotion}'. Generate 3 short, empathetic multiple-choice questions (with 3-4 options each) to help them understand this feeling better. Format the response strictly as a JSON list of objects, where each object has 'question' (string) and 'options' (array of strings). Please generate the questions and options in Chinese. Example: [{"question":"今天是什么触发了你的这种感觉？","options":["工作","关系","我自己","不知道"]}]`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['question', 'options']
            }
          }
        }
      });
      
      const data = JSON.parse(response.text || '[]');
      setQuestions(data);
    } catch (error) {
      console.error(error);
      toast.error('生成问卷失败，请稍后再试。');
      setSelectedEmotion(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIndex: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: option }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (Object.keys(answers).length < questions.length) {
      toast.error('请回答所有问题以完成记录。');
      return;
    }
    
    setSubmitting(true);
    try {
      const content = questions.map((q, i) => `Q: ${q.question}\nA: ${answers[i]}`).join('\n\n');
      
      // Determine if flagged (e.g., self-harm mentioned in options, though AI shouldn't generate those normally, 
      // but we do a quick check just in case, or we analyze later)
      
      await addDoc(collection(db, `users/${user.uid}/records`), {
        userId: user.uid,
        recordType: 'questionnaire',
        content: `Base Emotion: ${selectedEmotion}\n\n${content}`,
        emotions: [selectedEmotion],
        timestamp: serverTimestamp(),
        isFlagged: false
      });
      
      setCompleted(true);
      toast.success('记录成功保存！');
    } catch (error) {
      console.error(error);
      toast.error('保存失败。');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSelectedEmotion(null);
    setQuestions([]);
    setAnswers({});
    setCompleted(false);
  };

  if (completed) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border-0 shadow-sm glass-panel">
        <div className="rounded-full bg-green-50/50 p-4 mb-4 border border-green-200/50">
          <CheckCircle2 className="w-12 h-12 text-[#4A5D4E]" />
        </div>
        <h3 className="text-xl font-medium text-[#2D3436] mb-2">感谢你的分享</h3>
        <p className="text-[#636E72] mb-6">你的回答已经被温柔地收藏在日记中。</p>
        <Button variant="outline" onClick={reset} className="rounded-full border-white/60 text-[#4A5D4E] bg-white/40 hover:bg-white/60">
          再记一篇
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-8 rounded-3xl border-0 bg-transparent shadow-none">
      <div className="glass-panel p-8">
      <AnimatePresence mode="wait">
        {!selectedEmotion ? (
          <motion.div 
            key="select"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg text-[#2D3436]">你今天最主要的情绪是？</h3>
              <p className="text-sm text-[#636E72] mt-1">选择一个感受，开始快速记录。</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {BASE_EMOTIONS.map(emo => (
                <button
                  key={emo.id}
                  onClick={() => fetchQuestions(emo.label)}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-2xl bg-white/40 border border-white/60 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-white/60",
                    emo.color.includes('text') ? emo.color.split(' ').find(c => c.startsWith('text-')) : ''
                  )}
                >
                  <span className="font-medium">{emo.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : loading ? (
          <motion.div key="loading" className="flex flex-col items-center justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Loader2 className="w-8 h-8 animate-spin text-[#4A5D4E] mb-4" />
            <p className="text-[#636E72]">正在为你生成一些温柔的探索问题...</p>
          </motion.div>
        ) : (
          <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h3 className="font-medium text-[#2D3436]">探索关于“{selectedEmotion.split(' ')[0]}”的感受</h3>
              <Button variant="ghost" size="sm" onClick={reset} className="text-[#636E72]">重新选择</Button>
            </div>
            
            <div className="space-y-8">
              {questions.map((q, i) => (
                <div key={i} className="space-y-3">
                  <p className="text-[#2D3436] font-medium">{i + 1}. {q.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt, j) => {
                      const isSelected = answers[i] === opt;
                      return (
                        <button
                          key={j}
                          onClick={() => handleSelectOption(i, opt)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-sm border transition-colors text-left backdrop-blur-sm",
                            isSelected 
                              ? "bg-white/80 text-[#4A5D4E] border-[#A8B59B] shadow-sm" 
                              : "bg-white/30 text-[#2D3436] border-transparent hover:bg-white/50"
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={submitting || Object.keys(answers).length < questions.length}
                className="rounded-full bg-white/60 border border-white/60 hover:bg-white/80 text-[#4A5D4E] px-8 shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                保存日记 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </Card>
  );
}
