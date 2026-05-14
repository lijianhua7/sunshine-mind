'use client';
import { motion } from 'framer-motion';
import { Sun, Heart, Sparkles, MessageCircle, Feather } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans overflow-hidden selection:bg-primary/20 text-foreground">
      <header className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center shadow-sm">
            <Sun className="w-5 h-5" />
          </div>
          <span className="text-xl font-serif font-medium tracking-tight text-foreground">晴空心语</span>
        </div>
        <Button onClick={signIn} variant="outline" className="rounded-full px-6 border-border text-foreground hover:bg-muted font-medium">
          登 录
        </Button>
      </header>

      <main className="container mx-auto px-6 pt-24 pb-32 relative">
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-secondary/30 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-card border border-border shadow-sm text-foreground rounded-full text-sm font-medium mb-8">
              <Feather size={14} className="text-primary" />
              温柔的 AI 心灵疗愈
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-medium text-foreground mb-8 leading-tight">
              为你心中的光，<br className="hidden md:block"/>
              <span className="text-primary italic">安放一处静谧空间</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-2xl mx-auto">
              晴空心语 倾听你的每一次情绪起伏。通过温暖的 AI 对话与记录，帮你找回内心的平静与力量。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={signIn} size="lg" className="rounded-full px-8 py-6 text-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all bg-foreground text-background">
                开启心灵之旅
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="mt-40 grid md:grid-cols-3 gap-8 relative z-10">
          {[
            { icon: Heart, title: "深深的共情", desc: "我们的 AI 被赋予了温柔的倾听能力，带着深深的同理心与好奇，陪伴你的每一种情绪。", color: "bg-[#F4C9B8]/30 text-[#A66D5B]" },
            { icon: MessageCircle, title: "灵魂的镜子", desc: "通过正念问卷与引导式的反思日记，在安静的文字中重新认识真实的自己。", color: "bg-[#97A991]/20 text-[#4C5E47]" },
            { icon: Sparkles, title: "每日的慰藉", desc: "接受为你量身定制的温柔洞察，点亮前行的路，让每一天都多一点温暖。", color: "bg-[#E2C8A4]/30 text-[#8B7354]" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: "easeOut" }}
              className="p-10 bg-card/50 backdrop-blur-md border border-border/50 rounded-[2.5rem] shadow-sm hover:bg-card transition-colors"
            >
              <div className={`w-14 h-14 ${feature.color} rounded-full flex items-center justify-center mb-8`}>
                <feature.icon size={26} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-2xl font-medium text-foreground mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="container mx-auto px-6 py-12 border-t border-border/50 text-center text-muted-foreground text-sm">
        &copy; {new Date().getFullYear()} 晴空心语。你的心灵之旅是私密而神圣的。
      </footer>
    </div>
  );
}
