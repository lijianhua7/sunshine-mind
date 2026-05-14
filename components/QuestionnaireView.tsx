'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Frown, Meh, Send, CloudRain, Sun, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

import { ai } from '@/lib/ai';
import { saveJournalEntry } from '@/lib/entries';
import { useAuth } from '@/components/AuthProvider';

export default function QuestionnaireView() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [history, setHistory] = useState<{ question: string, answer: string }[]>([]);
  const [questionCount, setQuestionCount] = useState(0);

  const moods = [
    { icon: Sun, label: '开心', value: '开心', color: 'text-[#D8A492] bg-[#F4C9B8]/20' },
    { icon: CloudRain, label: '沮丧', value: '沮丧', color: 'text-[#809689] bg-[#E5ECE9]/50' },
    { icon: Frown, label: '委屈', value: '委屈', color: 'text-[#A8A4CE] bg-[#A8A4CE]/10' },
    { icon: Wind, label: '平静', value: '平静', color: 'text-[#97A991] bg-[#97A991]/10' },
  ];

  const handleMoodSelect = async (val: string) => {
    setMood(val);
    setStep(2);
    setIsGenerating(true);
    setQuestionCount(1);
    setHistory([]);
    toast.success('你的真实感受已被妥善珍藏。正在为你生成引导性问题...');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `用户此刻的情绪是“${val}”。请生成第1个具有引导性的问题，以及3-4个供用户点击选择的简短回答选项。
        要求：
        1. 语气温和、具备同理心。
        2. 问题要简短，引导用户思考情绪原因。
        3. 负面情绪（沮丧、委屈）下，问题要轻柔，不要给压力。
        4. 输出格式必须是 JSON：{"question": "问题内容", "options": ["选项1", "选项2", "选项3"]}
        5. 不要包含任何 Markdown 格式或额外文字。`,
      });
      const data = JSON.parse(response.text || '{}');
      setCurrentQuestion(data.question);
      setOptions(data.options);
    } catch (e) {
      console.error('AI error:', e);
      setCurrentQuestion('你觉得自己现在最需要什么？');
      setOptions(['一段安静的时间', '一个温暖的拥抱', '一个可以倾诉的人', '一次彻底的放松']);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    if (!currentQuestion) return;
    
    const newHistory = [...history, { question: currentQuestion, answer }];
    setHistory(newHistory);
    
    if (questionCount >= 5) {
      setStep(3);
      generateFinalSummary(newHistory);
      return;
    }

    setIsGenerating(true);
    setQuestionCount(prev => prev + 1);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `用户情绪：${mood}。
        之前对话记录：${JSON.stringify(newHistory)}。
        请生成第 ${questionCount + 1} 个具有引导性的深入问题，以及3-4个供用户点击选择的简短回答选项。
        要求：
        1. 基于之前的回答进一步深入。
        2. 语气持续温和，不评判。
        3. 总问题数为5，这是第 ${questionCount + 1} 个。
        4. 输出格式必须是 JSON：{"question": "问题内容", "options": ["选项1", "选项2", "选项3"]}
        5. 不要包含任何 Markdown 格式。`,
      });
      const data = JSON.parse(response.text || '{}');
      setCurrentQuestion(data.question);
      setOptions(data.options);
    } catch (e) {
      setCurrentQuestion('你觉得这种感觉在告诉你什么？');
      setOptions(['我需要休息', '我感到被忽视了', '我需要改变一些事情', '我只是需要被看见']);
    } finally {
      setIsGenerating(false);
    }
  };

  const [finalSummary, setFinalSummary] = useState('');
  const generateFinalSummary = async (h: { question: string, answer: string }[]) => {
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `基于用户的情绪记录：
        情绪：${mood}
        详细对话：${JSON.stringify(h)}
        请给出一份医生视角的肯定与安慰语。
        要求：
        1. 字数在100字左右。
        2. 语气包含同理心、医生的稳重、以及对未来的正向引导。
        3. 严禁说教。
        4. 如果有极度负面情绪，请温和建议用户休息，并提供舒缓建议。
        5. 对话中提到的核心事件请简要带过。`,
      });
      setFinalSummary(response.text || '');
    } catch (e) {
      setFinalSummary('接纳这种感觉，你的世界一直被温柔地托举着。所有的情绪都是你的一部分，它们值得被看见。');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToDiary = async () => {
    if (!user || !mood) return;
    setIsSaving(true);
    try {
      const content = history.map(h => `问：${h.question}\n答：${h.answer}`).join('\n\n');
      await saveJournalEntry({
        userId: user.uid,
        content: content,
        mood: mood,
        summary: finalSummary,
        type: 'questionnaire',
        isNegative: mood === '沮丧' || mood === '委屈'
      });
      toast.success('已存入你的情感日记。');
      setStep(1);
      setMood(null);
      setHistory([]);
      setQuestionCount(0);
    } catch (e) {
      toast.error('保存失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-12">
      <header className="mb-12 text-center md:text-left">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-3">每日静心</h1>
        <p className="text-muted-foreground text-lg italic">花一点时间，感受你内心的天气。</p>
      </header>

      <div className="grid gap-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border border-border/50 shadow-sm bg-card rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-muted/30 p-8 pb-6">
                  <CardTitle className="font-serif text-2xl font-medium">此刻，你的心感觉如何？</CardTitle>
                  <CardDescription className="text-base mt-2">选择最能反映你当下内心风景的状态。</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {moods.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => handleMoodSelect(m.value)}
                        className={`p-8 rounded-[2rem] flex flex-col items-center gap-4 transition-all duration-300 border border-transparent ${
                          mood === m.value 
                            ? 'ring-2 ring-primary shadow-sm border-border' 
                            : 'hover:bg-muted/50 hover:border-border/50 hover:-translate-y-1'
                        } ${m.color}`}
                      >
                        <m.icon size={40} strokeWidth={1.5} />
                        <span className="font-serif font-medium text-lg">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border border-border/50 shadow-sm bg-card rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">引导探索 {questionCount} / 5</span>
                  </div>
                  <CardTitle className="font-serif text-2xl font-medium flex items-center gap-2">
                    {isGenerating ? '正在深入倾听...' : currentQuestion}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8 pt-0">
                  {isGenerating ? (
                    <div className="flex justify-center p-12">
                      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {options.map((opt, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleAnswerSelect(opt)}
                          className="p-4 text-left rounded-2xl border bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all text-foreground/80"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border border-border/50 shadow-sm bg-card rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="font-serif text-2xl font-medium">心灵的回响</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8 pt-0">
                  {isGenerating ? (
                    <div className="flex justify-center p-12">
                      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <div className="p-8 bg-secondary/20 rounded-[2rem] border border-secondary/30 text-secondary-foreground leading-relaxed font-serif text-xl italic whitespace-pre-wrap">
                        {finalSummary}
                      </div>
                      
                      <div className="flex justify-end gap-4">
                        <Button variant="ghost" onClick={() => { setStep(1); setMood(null); }} className="rounded-full px-6">重新记录</Button>
                        <Button onClick={saveToDiary} disabled={isSaving} className="rounded-full px-8 bg-foreground text-background hover:bg-foreground/90 gap-2 font-medium">
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Send size={16} />
                          )}
                          记入情感日记
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

