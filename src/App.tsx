import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Volume2, MapPin, Users, Activity, TrendingUp } from 'lucide-react';
import { generateCommentary, CommentaryBall, MatchNarration } from './services/geminiService';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [matchData, setMatchData] = useState<MatchNarration | null>(null);
  const [displayedBalls, setDisplayedBalls] = useState<CommentaryBall[]>([]);
  const [currentScore, setCurrentScore] = useState({ runs: 0, wickets: 0 });
  const [matchStarted, setMatchStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const speak = (text: string, onEnd?: () => void) => {
    if (isMuted || !window.speechSynthesis) {
      onEnd?.();
      return;
    }
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1; // Slightly faster for commentary feel
    utterance.pitch = 1.0;
    
    // Attempt to find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    // Prioritize Hindi (hi-IN) for Rajasthani feel, then Indian English
    const preferredVoice = voices.find(v => v.lang === 'hi-IN') || 
                           voices.find(v => v.lang === 'en-IN') ||
                           voices.find(v => v.lang.includes('hi')) ||
                           voices.find(v => v.lang.includes('IN'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      // Adjust pitch/rate slightly if it's a Hindi voice to sound more like a commentator
      if (preferredVoice.lang.includes('hi')) {
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
      }
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  };

  const startMatch = async (matchType: string = "fictional T20") => {
    setLoading(true);
    // Ensure any stuck audio is cleared when force-starting a new match
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    try {
      const data = await generateCommentary(matchType);
      setMatchData(data);
      setDisplayedBalls([]);
      setCurrentScore({ runs: 0, wickets: 0 });
      setMatchStarted(true);
      
      // Speak initial summary
      if (data.summary) {
        speak(data.summary);
      }
    } catch (error) {
      console.error("Error starting match:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Pre-fetch voices for SpeechSynthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  useEffect(() => {
    if (matchStarted && matchData && !isSpeaking && displayedBalls.length < matchData.overs.length) {
      const nextIdx = displayedBalls.length;
      
      // We use a small delay between balls even if speech is fast
      const timer = setTimeout(() => {
        const nextBall = matchData.overs[nextIdx];
        
        // Update UI
        setDisplayedBalls(prev => [...prev, nextBall]);
        setCurrentScore(prev => ({
          runs: prev.runs + nextBall.runs,
          wickets: prev.wickets + (nextBall.isWicket ? 1 : 0)
        }));
        
        // Narrate the ball
        speak(nextBall.commentary);
      }, 1000); 
      
      return () => clearTimeout(timer);
    }
  }, [matchStarted, matchData, displayedBalls, isMuted, isSpeaking]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedBalls]);

  const getEventStyle = (event: string) => {
    switch (event) {
      case 'six': return 'text-rajasthan-red font-bold text-xl drop-shadow-[0_0_8px_rgba(227,27,35,0.5)]';
      case 'four': return 'text-amber-400 font-bold';
      case 'wicket': return 'text-red-500 font-bold animate-pulse';
      default: return 'text-zinc-300';
    }
  };

  return (
    <div className="min-h-screen bg-desert-night flex flex-col items-center overflow-hidden selection:bg-gold selection:text-black">
      {/* Hero Section */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full relative h-[30vh] flex flex-col items-center justify-center overflow-hidden border-b border-ochre/30"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=2000" 
            alt="Cricket Stadium"
            className="w-full h-full object-cover opacity-30 sepia hover:sepia-0 transition-all duration-1000"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-desert-night via-desert-night/20 to-transparent"></div>
        </div>

        <div className="z-10 text-center px-4">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="inline-block px-3 py-1 mb-2 border border-rajasthan-red/30 rounded-full bg-rajasthan-red/10"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-rajasthan-red">Chaupal Edition</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-decorative italic font-light tracking-tight text-white mb-2">
            Rajasthani <span className="text-rajasthan-red">Cricket</span>
          </h1>
          <p className="text-orange-100/60 text-sm md:text-base max-w-lg mx-auto font-light leading-relaxed">
            Hinglish & Marwari commentary mixed with the grit of desert cricket.
          </p>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        
        {/* Left Panel: Scoreboard & Controls */}
        <div className="lg:col-span-5 space-y-6">
          <motion.div 
            layout
            className="bg-orange-950/30 border border-ochre/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl overflow-hidden relative"
          >
            <div className="absolute -right-4 -top-4 opacity-5 rotate-12 text-gold">
               <Trophy size={160} />
            </div>

            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-[10px] uppercase font-semibold tracking-widest text-orange-200/40 mb-1">Current Match</h2>
                <p className="font-medium text-lg text-orange-50">
                  {matchData ? `${matchData.teamA} v ${matchData.teamB}` : 'Awaiting Match...'}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-orange-200/40 text-xs justify-end mb-1">
                   <MapPin size={12} />
                   <span>{matchData?.venue || 'Unknown Grounds'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-[10px] uppercase font-bold tracking-tighter text-rajasthan-red mb-2">SCOREBOARD</span>
              <div className="flex items-baseline gap-2">
                <motion.span 
                  key={`runs-${currentScore.runs}`}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-7xl font-light tracking-tighter font-mono text-white"
                >
                  {currentScore.runs}
                </motion.span>
                <span className="text-4xl text-orange-200/20 font-light">/</span>
                <motion.span 
                  key={`wickets-${currentScore.wickets}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-5xl font-mono text-rajasthan-red"
                >
                  {currentScore.wickets}
                </motion.span>
              </div>
              <div className="text-orange-200/30 text-sm mt-2 font-mono">
                Overs: {displayedBalls.length > 0 ? (Math.floor((displayedBalls.length - 1) / 6) + '.' + ((displayedBalls.length - 1) % 6 + 1)) : '0.0'} / 5.0
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 border-t border-ochre/20 pt-6">
               <div className="text-center">
                 <p className="text-[9px] text-orange-200/40 uppercase tracking-widest mb-1">RR</p>
                 <p className="font-mono text-sm text-gold">{(currentScore.runs / Math.max(1, displayedBalls.length / 6)).toFixed(2)}</p>
               </div>
               <div className="text-center border-x border-ochre/20">
                 <p className="text-[9px] text-orange-200/40 uppercase tracking-widest mb-1">Extras</p>
                 <p className="font-mono text-sm text-gold">3</p>
               </div>
               <div className="text-center">
                 <p className="text-[9px] text-orange-200/40 uppercase tracking-widest mb-1">Dot %</p>
                 <p className="font-mono text-sm text-gold">{((displayedBalls.filter(b => b.runs === 0).length / Math.max(1, displayedBalls.length)) * 100).toFixed(0)}%</p>
               </div>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="flex flex-col gap-3">
             <button
                onClick={() => startMatch()}
                disabled={loading}
                className="w-full rajasthan-gradient hover:brightness-110 active:scale-[0.98] transition-all py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-semibold text-zinc-950 shadow-lg shadow-rajasthan-red/10 disabled:opacity-50 disabled:pointer-events-none"
             >
                {loading ? (
                   <Activity className="animate-spin" />
                ) : (
                   <Play size={20} fill="currentColor" />
                )}
                {matchStarted ? 'Restart Match' : 'Start 5-Over Phase'}
             </button>

             <button
                onClick={() => startMatch("Last IPL 2026 Match")}
                disabled={loading}
                className="w-full border border-rajasthan-red/50 hover:bg-rajasthan-red/10 active:scale-[0.98] transition-all py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-semibold text-rajasthan-red shadow-lg disabled:opacity-50 disabled:pointer-events-none"
             >
                <Trophy size={20} />
                IPL 2026 Season Special
             </button>
             
             <button
                onClick={() => startMatch("RR_VS_GT")}
                disabled={loading}
                className="w-full border border-rajasthan-red/30 hover:bg-rajasthan-red/5 active:scale-[0.98] transition-all py-3 px-6 rounded-xl flex items-center justify-center gap-3 font-medium text-rajasthan-red text-sm disabled:opacity-50 disabled:pointer-events-none"
             >
                <Trophy size={16} />
                RR vs GT: Marwari Special
             </button>
             
             <button
                onClick={() => startMatch("2008_FINAL")}
                disabled={loading}
                className="w-full border border-orange-200/10 hover:bg-orange-200/5 active:scale-[0.98] transition-all py-3 px-6 rounded-xl flex items-center justify-center gap-3 font-medium text-orange-200/40 text-sm disabled:opacity-50 disabled:pointer-events-none"
             >
                <RotateCcw size={16} />
                Load Classic 2008 Finals
             </button>
             
             {!matchStarted && (
               <div className="text-center">
                 <p className="text-[10px] text-zinc-600 italic">Generate a fresh 5-over match with AI commentary</p>
               </div>
             )}
          </div>

          {/* Player Stats / Insights Mock */}
          <AnimatePresence>
            {matchStarted && matchData && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-rajasthan-red" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Commentator's Summary</h3>
                </div>
                <p className="text-zinc-400 text-sm font-light italic leading-relaxed">
                  "{matchData.summary}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Commentary Feed */}
        <div className="lg:col-span-1 flex items-center justify-center pointer-events-none">
           <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-ochre/20 to-transparent hidden lg:block"></div>
        </div>

        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-100/70">Live Commentary</h3>
             </div>
             <div className="flex items-center gap-2 text-orange-200/40">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-1.5 rounded-lg transition-colors hover:bg-orange-950/40 ${!isMuted ? 'text-rajasthan-red' : 'text-orange-900'}`}
                  title={isMuted ? "Unmute Narration" : "Mute Narration"}
                >
                   {isMuted ? <Volume2 size={16} className="opacity-40" /> : <Volume2 size={16} />}
                </button>
                <div className="flex items-center gap-1 ml-2">
                   <span className="w-2 h-2 rounded-full bg-rajasthan-red animate-pulse"></span>
                   <span className="text-[10px] uppercase font-bold tracking-tighter">On-Air</span>
                </div>
             </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-4 commentary-scroll pr-2 min-h-[400px] max-h-[60vh] lg:max-h-[70vh]"
          >
            <AnimatePresence initial={false}>
              {displayedBalls.length === 0 && !loading && (
                <div key="empty-state" className="h-full flex flex-col items-center justify-center opacity-20">
                   <p className="font-decorative italic text-2xl text-orange-100">Baithe kyun ho, match shuru karo!</p>
                </div>
              )}
              {displayedBalls.map((ball, idx) => (
                <motion.div
                  key={`${ball.over}-${ball.ball}-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="bg-orange-950/20 border-l-2 border-clay p-4 rounded-r-xl relative overflow-hidden group hover:bg-orange-950/40 transition-colors"
                >
                  <div className="absolute right-4 top-4 opacity-5 text-4xl font-mono text-gold pointer-events-none">
                     {ball.over}.{ball.ball}
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center border text-xs font-mono mb-1 ${
                          ball.event === 'six' ? 'border-rajasthan-red bg-rajasthan-red/20 text-white' :
                          ball.event === 'four' ? 'border-amber-400 bg-amber-400/10 text-white' :
                          ball.event === 'wicket' ? 'border-red-500 bg-red-500/20 text-red-500' :
                          'border-ochre/30 bg-orange-950/40 text-orange-100'
                       }`}>
                          {ball.isWicket ? 'W' : ball.runs}
                       </div>
                       <span className="text-[9px] text-orange-200/30 font-mono">{ball.over}.{ball.ball}</span>
                    </div>
                    <div className="flex-1">
                       <p className="text-orange-50 text-sm leading-relaxed mb-2 font-medium">
                          {ball.commentary}
                       </p>
                       <div className="flex items-center gap-3">
                          <span className={`text-[10px] uppercase font-bold tracking-widest ${getEventStyle(ball.event)}`}>
                             {ball.event}
                          </span>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {displayedBalls.length > 0 && displayedBalls.length === matchData?.overs.length && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="text-center py-10 opacity-30"
               >
                 <Users className="mx-auto mb-2" size={24} />
                 <p className="font-decorative italic text-xl">The sun sets over the dunes. Khel khatam sa!</p>
               </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Decoration */}
      <footer className="w-full py-4 text-center border-t border-orange-900/20 mt-auto bg-orange-950/10">
        <p className="text-[9px] text-orange-200/40 uppercase tracking-[0.4em]">Khamma Ghani Sa Cricket Edition — Powered by Gemini</p>
      </footer>
    </div>
  );
}
