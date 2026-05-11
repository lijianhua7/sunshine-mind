'use client';

import { useAuth } from './AuthProvider';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { Button } from './ui/button';

export function LandingPage() {
  const { login } = useAuth();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden selection:bg-[#fff0db]">
      {/* Background Leaves from Frosted Glass Theme */}
      <div className="leaf" style={{ width: '120px', height: '80px', top: '-20px', left: '10%', transform: 'rotate(15deg)' }}></div>
      <div className="leaf" style={{ width: '150px', height: '100px', bottom: '50px', right: '5%', transform: 'rotate(-25deg)', opacity: 0.1 }}></div>
      <div className="leaf" style={{ width: '60px', height: '40px', top: '150px', left: '40%', transform: 'rotate(-10deg)' }}></div>

      <motion.div 
        className="z-10 flex flex-col items-center text-center space-y-8 max-w-2xl px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <div className="space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block rounded-full glass-panel px-4 py-1.5 text-sm font-medium text-[#4A5D4E]"
          >
            你的 AI 情绪伴侣
          </motion.div>
          <h1 className="text-5xl font-light leading-tight tracking-tight text-[#2D3436] sm:text-6xl md:text-7xl">
            Soul <span className="text-[#A8B59B]">Echo</span>
          </h1>
          <p className="mx-auto max-w-lg text-lg font-light text-[#636E72] md:text-xl">
            为你提供一个温暖的安全空间，倾诉心声，梳理情绪，找到每日的平静。
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <Button 
            onClick={login}
            size="lg"
            className="rounded-full bg-white/60 hover:bg-white/80 border border-white/60 text-[#4A5D4E] font-medium px-8 py-6 text-lg shadow-sm transition-all hover:scale-105 hover:shadow-md backdrop-blur-md"
          >
            <LogIn className="mr-2 h-5 w-5" />
            开始心灵旅程
          </Button>
          <p className="mt-4 text-sm text-black/40">使用 Google 账号安全登录</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
