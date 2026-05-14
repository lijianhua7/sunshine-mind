'use client';

import { useState } from 'react';
import { PenLine, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ai } from '@/lib/ai';
import { useAuth } from '@/components/AuthProvider';
import { saveJournalEntry, getUserEntries } from '@/lib/entries';

export default function DiaryView() {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [detectedMood, setDetectedMood] = useState('');

  const fetchHistory = async () => {
    if (!user) return;
    const entries = await getUserEntries(user.uid, 20);
    setHistory(entries || []);
  };

  const handleSave = async () => {
    if (!content.trim() || !user) {
      console.warn('[DiaryView] Save aborted: content is empty or user is null', { hasContent: !!content.trim(), userId: user?.uid });
      return;
    }
    setIsSaving(true);
    console.log('[DiaryView] Attempting to save entry for user:', user.uid);
    
    try {
      // Analyze before saving if not already done
      let finalSummary = aiSummary;
      let finalMood = detectedMood;
      
      if (!finalSummary) {
        console.log('[DiaryView] Generating AI summary before save...');
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `这是用户的一篇私密日记：\n${content}\n请进行深度分析并给出医生视角的反馈。包含核心情绪和安慰语。输出字数控制在100字左右。`,
        });
        finalSummary = response.text || '';
        
        const moodResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `根据日记内容，从“开心、沮丧、委屈、平静”中选择最贴切的一个。只输出这四个词中的一个。内容：\n${content}`,
        });
        finalMood = (moodResponse.text || '平静').trim();
      }

      const entryId = await saveJournalEntry({
        userId: user.uid,
        content: content,
        mood: finalMood,
        summary: finalSummary,
        type: 'diary',
        isNegative: finalMood === '沮丧' || finalMood === '委屈'
      });
      
      console.log('[DiaryView] Save successful, entry ID:', entryId);
      toast.success('你的思绪已被温柔地收拢。');
      setContent('');
      setAiSummary('');
      setDetectedMood('');
    } catch (e: any) {
      console.error('[DiaryView] Save failed error:', e);
      // Fallback: Save to local storage for recovery
      try {
        const fallbackId = `diary_fallback_${Date.now()}`;
        localStorage.setItem(fallbackId, JSON.stringify({
          content,
          date: new Date().toISOString(),
          synced: false
        }));
        toast.error('由于网络或权限原因，日记已暂存在本地浏览器中。');
      } catch (localErr) {
        toast.error('保存失败，请复制内容后稍后重试。');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSummarize = async () => {
    if (content.length < 5) {
      toast.info('再多写几笔吧，让我能更好地触达你的心弦。');
      return;
    }
    setIsSummarizing(true);
    console.log('[DiaryView] Requesting AI summary...');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `这是用户的一篇私密日记：\n${content}\n请进行深度分析并给出医生视角的反馈。包含核心情绪和安慰语。输出字数控制在100字左右。`,
      });
      setAiSummary(response.text || '');
      
      const moodResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `根据日记内容，从“开心、沮丧、委屈、平静”中选择最贴切的一个。只输出这四个词中的一个。内容：\n${content}`,
      });
      setDetectedMood((moodResponse.text || '平静').trim());
      console.log('[DiaryView] AI Summary ready');
    } catch (e) {
      console.error('[DiaryView] AI Summary failed:', e);
      toast.error('解析思绪时遇到了一点小麻烦，请稍后再试。');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-center md:text-left">
        <div>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-3">灵魂日记</h1>
          <p className="text-muted-foreground text-lg italic tracking-wide">倾吐你的心声。这个安静的空间能容纳一切。</p>
        </div>
        <Button 
          variant="ghost" 
          className="rounded-full gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 px-4 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowHistory(true);
            fetchHistory();
          }}
        >
          <History size={16} />
          <span>过往篇章</span>
        </Button>
      </header>

      <Card className="flex-1 border border-border/50 shadow-sm overflow-hidden flex flex-col bg-card rounded-[2rem] min-h-[50vh]">
        <CardContent className="p-0 flex-1 relative flex flex-col">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天你的内心涌现了什么？不必在意结构或语法，只需要跟随心意书写..."
            className="flex-1 w-full border-none focus-visible:ring-0 resize-none p-8 md:p-12 font-serif text-xl leading-relaxed placeholder:text-muted-foreground/50 bg-transparent text-foreground min-h-[300px]"
          />
        </CardContent>
        <div className="p-8 md:px-12 border-t border-border/30 flex justify-between items-center bg-muted/20">
          <div className="text-sm text-muted-foreground font-mono bg-muted/50 px-4 py-1.5 rounded-full whitespace-nowrap border border-border/50">
            {content.length} 个字
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="rounded-full gap-2 border-border/50 hover:bg-muted/50 text-foreground shadow-sm px-6 h-10 active:scale-95 transition-transform"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSummarize();
              }}
              disabled={isSummarizing || content.length < 5}
            >
              {isSummarizing ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Sparkles size={16} className="text-primary" />
              )}
              温柔小结
            </Button>
            <Button 
              className="rounded-full px-8 shadow-sm bg-foreground text-background hover:bg-foreground/90 font-medium h-10 active:scale-95 transition-transform" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }} 
              disabled={!content.trim() || isSaving}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <PenLine size={16} className="mr-2" />
              )}
              合上日记
            </Button>
          </div>
        </div>
      </Card>

      {aiSummary && (
        <Card className="border border-secondary/50 shadow-sm bg-secondary/10 rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="bg-secondary/20 p-6 pb-4">
            <CardTitle className="font-serif text-xl flex items-center gap-3 text-secondary-foreground">
              <Sparkles size={20} className="text-primary" />
              柔软的回音 ({detectedMood})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:px-8 text-foreground/80 leading-relaxed font-serif text-lg italic whitespace-pre-wrap">
            {aiSummary}
          </CardContent>
        </Card>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-[2rem] shadow-2xl border-border/50">
            <CardHeader className="border-b border-border/30 p-6 flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-2xl">过往篇章</CardTitle>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowHistory(false)}>关闭</Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic font-serif">
                  笔墨尚未落下，期待你的第一篇记录。
                </div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="group flex flex-col space-y-3 p-4 rounded-2xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono text-muted-foreground">
                        {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : '刚刚'}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-secondary/30 text-xs font-medium text-secondary-foreground">
                        {entry.mood}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed line-clamp-3 font-serif">
                      {entry.content}
                    </p>
                    {entry.summary && (
                      <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 italic text-sm text-primary/80">
                        {entry.summary}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
