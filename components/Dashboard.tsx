'use client';

import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { LogOut, Sun, Calendar, LayoutDashboard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionnaireView } from './QuestionnaireView';
import { DiaryView } from './DiaryView';
import { ChatView } from './ChatView';
import { DailySummaryView } from './DailySummaryView';
import { PeriodicReportView } from './PeriodicReportView';
import { useState } from 'react';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<'input' | 'periodic'>('input');

  return (
    <div className="min-h-screen relative">
      <header className="sticky top-0 z-50 glass-panel !rounded-none !border-t-0 !border-x-0 !border-b !border-[var(--color-glass-border)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4 px-6">
          <div className="flex items-center gap-2 text-deep-sage">
            <span className="font-medium text-2xl tracking-tight flex items-center gap-2"><Sun className="h-6 w-6" /> Soul Echo</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white/30 backdrop-blur-md rounded-full p-1 border border-white/40 shadow-sm transition-all hover:bg-white/40">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={`rounded-full px-4 text-xs ${activeView === 'input' ? 'glass-panel !rounded-full shadow-sm' : 'hover:bg-black/5'}`}
                 onClick={() => setActiveView('input')}
               >
                 <LayoutDashboard className="w-4 h-4 mr-1.5" />
                 今日记录
               </Button>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className={`rounded-full px-4 text-xs ${activeView === 'periodic' ? 'glass-panel !rounded-full shadow-sm' : 'hover:bg-black/5'}`}
                 onClick={() => setActiveView('periodic')}
               >
                 <Calendar className="w-4 h-4 mr-1.5" />
                 定期洞察
               </Button>
            </div>
            
            <div className="flex items-center gap-2 pl-4 border-l border-[var(--color-glass-border)]">
              <span className="text-sm text-[#636E72] hidden sm:inline-block font-medium">
                {user?.displayName || '朋友'}
              </span>
              <Button variant="ghost" size="icon" onClick={logout} className="rounded-full text-[#636E72] hover:bg-white/40">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6 relative z-10">
        {activeView === 'input' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-3xl font-light text-[#2D3436] mb-4">此刻，你的心情如何？</h2>
              
              <Tabs defaultValue="questionnaire" className="w-full">
                <TabsList className="flex w-full items-stretch bg-white/40 backdrop-blur-md rounded-[20px] p-1.5 mb-6 border border-white/50 shadow-sm min-h-[52px]">
                  <TabsTrigger value="questionnaire" className="flex-1 rounded-2xl py-2.5 data-[state=active]:bg-white/90 data-[state=active]:text-[#4A5D4E] data-[state=active]:shadow-sm text-[#636E72] font-medium transition-all">
                    问卷引导
                  </TabsTrigger>
                  <TabsTrigger value="diary" className="flex-1 rounded-2xl py-2.5 data-[state=active]:bg-white/90 data-[state=active]:text-[#4A5D4E] data-[state=active]:shadow-sm text-[#636E72] font-medium transition-all">
                    心情日记
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex-1 rounded-2xl py-2.5 data-[state=active]:bg-white/90 data-[state=active]:text-[#4A5D4E] data-[state=active]:shadow-sm text-[#636E72] font-medium transition-all">
                    即时倾诉
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="questionnaire" className="mt-0 outline-none">
                  <QuestionnaireView />
                </TabsContent>
                <TabsContent value="diary" className="mt-0 outline-none">
                  <DiaryView />
                </TabsContent>
                <TabsContent value="chat" className="mt-0 outline-none">
                  <ChatView />
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="lg:col-span-1">
              <DailySummaryView />
            </div>
          </div>
        ) : (
          <PeriodicReportView />
        )}
      </main>
    </div>
  );
}
