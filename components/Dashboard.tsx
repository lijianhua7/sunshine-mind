'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  BookOpen, 
  MessageSquare, 
  LayoutDashboard, 
  LogOut, 
  Sun,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import QuestionnaireView from './QuestionnaireView';
import DiaryView from './DiaryView';
import ChatView from './ChatView';
import DailySummaryView from './DailySummaryView';
import PeriodicReportView from './PeriodicReportView';

type Tab = 'dashboard' | 'questionnaire' | 'diary' | 'chat' | 'reports';

export default function Dashboard() {
  const { user, logOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'dashboard', label: '心情主页', icon: LayoutDashboard },
    { id: 'questionnaire', label: '静心问卷', icon: ClipboardList },
    { id: 'diary', label: '灵魂日记', icon: BookOpen },
    { id: 'chat', label: '心声回响', icon: MessageSquare },
    { id: 'reports', label: '心灵洞察', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
      {/* Floating Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center p-4 py-6 pointer-events-none">
        <motion.nav 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex items-center gap-2 p-2 rounded-full border border-border/50 backdrop-blur-md bg-card/80 shadow-sm transition-all duration-300 pointer-events-auto ${scrolled ? 'shadow-md opacity-95' : ''}`}
        >
          <div className="pl-4 pr-6 flex items-center gap-2 border-r border-border/50">
            <Sun className="text-primary w-5 h-5 flex-shrink-0" />
            <span className="font-serif font-medium hidden md:block">晴空心语</span>
          </div>

          <div className="flex gap-1 px-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon size={16} />
                  <span className="hidden sm:inline-block">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pl-2 border-l border-border/50 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 pointer-events-none ring-2 ring-background">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button onClick={logOut} variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </motion.nav>
      </header>

      {/* Main Content Area */}
      <main className="pt-32 pb-16 px-4 md:px-8 max-w-6xl mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            {activeTab === 'dashboard' && <DailySummaryView onNavigate={setActiveTab} />}
            {activeTab === 'questionnaire' && <QuestionnaireView />}
            {activeTab === 'diary' && <DiaryView />}
            {activeTab === 'chat' && <ChatView />}
            {activeTab === 'reports' && <PeriodicReportView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
