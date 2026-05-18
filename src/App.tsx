import React, { useState, useEffect, useRef } from "react";
import { 
  Anchor, 
  ChevronRight, 
  ChevronLeft, 
  Clipboard, 
  ClipboardCheck, 
  MessageSquare, 
  Terminal, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff,
  Scroll,
  Settings,
  Ship,
  Map as MapIcon,
  Book,
  Flag,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PHASES, INITIAL_LOG } from "./constants";
import { audioService } from "./lib/audioService";
import { speechService } from "./lib/speechService";

// --- Components ---

const TerminalParser = ({ onSendToMate }: { onSendToMate: (text: string) => void }) => {
  const [input, setInput] = useState("");

  const cleanANSI = (str: string) => {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d]*)*)?\u0007/g, "");
  };

  const highlightedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const lower = line.toLowerCase();
      const isError = lower.includes("error") || lower.includes("fail") || lower.includes("not found");
      return (
        <div key={i} className={isError ? "text-red-500 font-bold" : "text-green-400"}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className="bg-black p-4 mt-6 blocky-border border-amber-900/50">
      <label className="text-xs uppercase text-amber-500 mb-2 block font-bold">Paste Terminal Output Here</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-32 bg-zinc-950 text-green-400 p-2 font-mono text-sm focus:outline-none border-none resize-none hide-scrollbar"
        placeholder="Raw terminal logs go here..."
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={() => {
            const cleaned = cleanANSI(input);
            onSendToMate(cleaned);
            setInput("");
          }}
          className="bg-amber-600 hover:bg-amber-500 text-black px-4 py-2 text-xs font-bold uppercase transition-colors flex items-center gap-2"
        >
          <MessageSquare size={14} /> Send to First Mate
        </button>
      </div>
      {input && (
        <div className="mt-4 border-t border-amber-900/30 pt-2 h-20 overflow-y-auto retro-scrollbar text-[10px]">
          {highlightedText(cleanANSI(input))}
        </div>
      )}
    </div>
  );
};

const GrokChat = ({ 
  history, 
  onSendMessage, 
  loading 
}: { 
  history: any[], 
  onSendMessage: (msg: string) => void,
  loading: boolean 
}) => {
  const [msg, setMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="flex flex-col h-[400px] bg-sky-950/20 blocky-border border-sky-800">
      <div className="flex-1 overflow-y-auto p-4 retro-scrollbar space-y-4">
        {history.length === 0 && (
          <div className="text-zinc-500 text-xs italic text-center mt-10">
            Grok is watching from the rigging. Say something to the First Mate!
          </div>
        )}
        {history.map((h, i) => (
          <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 text-sm ${h.role === 'user' ? 'bg-amber-900/40 border-amber-800 text-amber-100' : 'bg-sky-900/40 border-sky-800 text-sky-100'} border-2`}>
              {h.role !== 'user' && <span className="font-bold text-sky-400">🦜 Grok: </span>}
              {h.parts[0].text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-sky-900/40 border-sky-800 border-2 p-3 text-sm animate-pulse text-sky-300">
              🦜 Grok is thinking... *SQUAWK*
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="p-2 border-t-4 border-sky-800 bg-sky-900/20 flex gap-2">
        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (onSendMessage(msg), setMsg(""))}
          placeholder="Ask Grok for help..."
          className="flex-1 bg-black text-sky-100 px-3 py-2 text-sm focus:outline-none font-mono"
        />
        <button
          onClick={() => { onSendMessage(msg); setMsg(""); }}
          className="bg-sky-600 hover:bg-sky-500 text-white p-2 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [phaseIndex, setPhaseIndex] = useState(() => Number(localStorage.getItem("grok_phase") || 0));
  const [log, setLog] = useState(() => localStorage.getItem("grok_log") || INITIAL_LOG);
  const [discovered, setDiscovered] = useState<{ [key: string]: string }>(() => JSON.parse(localStorage.getItem("grok_vars") || "{}"));
  const [checks, setChecks] = useState<{ [key: string]: boolean }>(() => JSON.parse(localStorage.getItem("grok_checks") || "{}"));
  
  const [chatHistory, setChatHistory] = useState<any[]>(() => JSON.parse(localStorage.getItem("grok_chat") || "[]"));
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isParrotOn, setIsParrotOn] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("grok_phase", phaseIndex.toString());
    localStorage.setItem("grok_log", log);
    localStorage.setItem("grok_vars", JSON.stringify(discovered));
    localStorage.setItem("grok_checks", JSON.stringify(checks));
    localStorage.setItem("grok_chat", JSON.stringify(chatHistory));
  }, [phaseIndex, log, discovered, checks, chatHistory]);

  useEffect(() => {
    // Initial greet
    setTimeout(() => {
      speechService.greet();
    }, 1000);
  }, []);

  const currentPhase = PHASES[phaseIndex];

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendMessage = async (msg: string) => {
    if (!msg.trim()) return;
    const newHistory = [...chatHistory, { role: "user", parts: [{ text: msg }] }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: chatHistory }),
      });
      const data = await response.json();
      const updatedHistory = [...newHistory, { role: "model", parts: [{ text: data.text }] }];
      setChatHistory(updatedHistory);
      speechService.speak(data.text);
    } catch (error) {
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleAudio = () => {
    const playing = audioService.toggle();
    setIsAudioOn(playing);
  };

  const resetProgress = () => {
    if (confirm("Captain, are you sure you want to abandon ship and restart the journey?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-amber-950/20 p-6 blocky-border border-amber-900">
        <div className="flex items-center gap-4">
          <Ship size={48} className="text-amber-500 animate-bounce" />
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-amber-500 pixel-text uppercase">Grok's Treasure Map</h1>
            <p className="text-xs text-amber-200/60 uppercase tracking-widest font-bold">Deployment Logbook V3.0</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={toggleAudio}
            className={`p-3 blocky-border ${isAudioOn ? 'bg-amber-600 text-black border-amber-400' : 'bg-zinc-900 text-amber-600 border-zinc-800'} transition-all`}
            title="Toggle Chiptune Theme"
          >
            {isAudioOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
          <button 
            onClick={() => {
              const newState = !isParrotOn;
              setIsParrotOn(newState);
              speechService.setParrotEnabled(newState);
            }}
            className={`p-3 blocky-border ${isParrotOn ? 'bg-sky-600 text-white border-sky-400' : 'bg-zinc-900 text-sky-600 border-zinc-800'} transition-all`}
            title="Toggle Parrot Voice"
          >
            {isParrotOn ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          <button 
            onClick={resetProgress}
            className="p-3 blocky-border bg-red-900/40 text-red-500 border-red-900 hover:bg-red-900/60 transition-all font-bold text-xs uppercase"
            title="Reset All Progress"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Progress & Phase */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Progress Timeline */}
          <div className="bg-zinc-900/50 p-6 blocky-border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold uppercase text-zinc-500 flex items-center gap-2">
                <MapIcon size={16} /> Voyage Progress
              </h2>
              <span className="text-xs font-bold text-amber-500">PHASE {phaseIndex + 1} OF 7</span>
            </div>
            <div className="relative h-4 bg-black blocky-border border-zinc-700 mb-8 overflow-hidden">
               <motion.div 
                 className="absolute left-0 top-0 h-full bg-amber-500"
                 initial={{ width: 0 }}
                 animate={{ width: `${((phaseIndex + 1) / 7) * 100}%` }}
               />
               <div className="absolute inset-0 flex justify-between px-2">
                 {[...Array(7)].map((_, i) => (
                   <div key={i} className={`w-1 h-full ${i < phaseIndex ? 'bg-amber-900' : 'bg-zinc-800'}`} />
                 ))}
               </div>
            </div>
            <div className="flex justify-between">
              <button 
                onClick={() => setPhaseIndex(p => Math.max(0, p - 1))}
                disabled={phaseIndex === 0}
                className="flex items-center gap-2 text-xs font-bold uppercase disabled:opacity-30 hover:text-amber-500 transition-colors"
              >
                <ChevronLeft size={16} /> Retreat
              </button>
              <button 
                onClick={() => setPhaseIndex(p => Math.min(PHASES.length - 1, p + 1))}
                disabled={phaseIndex === PHASES.length - 1}
                className="flex items-center gap-2 text-xs font-bold uppercase disabled:opacity-30 hover:text-amber-500 transition-colors"
              >
                Advance <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Current Phase Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`p-8 blocky-border transition-shadow duration-500 ${currentPhase.id === 3 ? 'breathing-border ember-glow border-amber-500 bg-amber-950/10' : 'border-zinc-700 bg-zinc-900/30'}`}
              style={{ boxShadow: currentPhase.id !== 3 ? `0 0 20px ${currentPhase.glow}` : undefined }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-amber-500 text-xs font-bold uppercase tracking-tighter mb-1">{currentPhase.subtitle}</div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white uppercase">{currentPhase.title}</h2>
                </div>
                <div className="text-5xl">{currentPhase.emoji}</div>
              </div>

              {currentPhase.badge && (
                <div className="inline-block px-3 py-1 bg-amber-500 text-black font-bold text-[10px] uppercase mb-6 tracking-widest animate-pulse">
                  {currentPhase.badge}
                </div>
              )}

              <p className="text-amber-100/80 italic mb-8 border-l-4 border-amber-600 pl-4 py-2 bg-amber-900/10">
                "{currentPhase.narrative}"
              </p>

              {/* Code Payload */}
              <div className="relative group">
                <div className="absolute right-2 top-2 z-10">
                  <button 
                    onClick={() => copyToClipboard(currentPhase.payload, `code-${phaseIndex}`)}
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 transition-colors blocky-border border-zinc-600 text-amber-500"
                  >
                    {copied === `code-${phaseIndex}` ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                  </button>
                </div>
                <pre className="bg-black p-6 font-mono text-sm text-amber-500/90 overflow-x-auto retro-scrollbar blocky-border border-zinc-800 leading-relaxed">
                  {currentPhase.payload}
                </pre>
              </div>

              {/* Discovery Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div>
                  <h3 className="text-xs font-bold uppercase text-zinc-500 mb-3 flex items-center gap-2 italic">
                    <Flag size={14} /> Discovered Variables
                  </h3>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="IP Address..."
                      className="w-full bg-black/50 border-2 border-zinc-800 p-2 text-xs text-amber-200 outline-none focus:border-amber-700" 
                      value={discovered[`v1_${phaseIndex}`] || ""}
                      onChange={(e) => setDiscovered(prev => ({ ...prev, [`v1_${phaseIndex}`]: e.target.value }))}
                    />
                    <input 
                      type="text" 
                      placeholder="Vault Seed..."
                      className="w-full bg-black/50 border-2 border-zinc-800 p-2 text-xs text-amber-200 outline-none focus:border-amber-700" 
                      value={discovered[`v2_${phaseIndex}`] || ""}
                      onChange={(e) => setDiscovered(prev => ({ ...prev, [`v2_${phaseIndex}`]: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-zinc-500 mb-3 flex items-center gap-2 italic">
                    <Anchor size={14} /> Completion Checklist
                  </h3>
                  <div className="space-y-2">
                    {currentPhase.checklist.map((item, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={checks[`c_${phaseIndex}_${i}`] || false}
                            onChange={(e) => setChecks(prev => ({ ...prev, [`c_${phaseIndex}_${i}`]: e.target.checked }))}
                          />
                          <div className={`w-5 h-5 blocky-border ${checks[`c_${phaseIndex}_${i}`] ? 'bg-amber-500 border-amber-300' : 'bg-black border-zinc-700 group-hover:border-zinc-500'}`} />
                        </div>
                        <span className={`text-xs ${checks[`c_${phaseIndex}_${i}`] ? 'text-amber-200 line-through opacity-50' : 'text-zinc-300'} transition-all`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {phaseIndex === PHASES.length - 1 && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-12 p-8 bg-amber-500 text-black blocky-border border-yellow-200 text-center"
                >
                  <h2 className="text-3xl font-bold uppercase mb-2">Voyage Complete!</h2>
                  <p className="text-sm font-bold opacity-80 mb-6 uppercase">The Grok Sovereign Swarm is Active.</p>
                  <button className="bg-black text-amber-500 px-8 py-3 font-bold uppercase hover:bg-zinc-900 transition-all blocky-border border-amber-600 mx-auto">
                    Switch to Dashboard Mode
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <TerminalParser onSendToMate={handleSendMessage} />
        </div>

        {/* Right Column: Captain's Log & Grok Chat */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Captain's Log */}
          <div className="bg-zinc-900/50 p-6 blocky-border border-zinc-800">
            <h2 className="text-sm font-bold uppercase text-zinc-500 flex items-center gap-2 mb-4">
              <Book size={16} /> Captain's Log
            </h2>
            <textarea
              value={log}
              onChange={(e) => setLog(e.target.value)}
              className="w-full h-48 bg-black/40 text-amber-200/80 p-4 font-mono text-sm blocky-border border-amber-900/30 resize-none focus:outline-none retro-scrollbar"
              placeholder="Write your observation here, Captain..."
            />
          </div>

          {/* First Mate Chat */}
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold uppercase text-sky-500 flex items-center gap-2">
              <MessageSquare size={16} /> Speak to First Mate
            </h2>
            <GrokChat 
              history={chatHistory} 
              onSendMessage={handleSendMessage} 
              loading={chatLoading} 
            />
          </div>

          {/* Map visualization */}
          <div className="bg-zinc-900/50 p-6 blocky-border border-zinc-800 hidden md:block">
             <h2 className="text-sm font-bold uppercase text-zinc-500 flex items-center gap-2 mb-6">
              <Scroll size={16} /> Sea Chart
            </h2>
            <div className="relative aspect-video bg-sky-950/20 blocky-border border-sky-900 overflow-hidden">
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
               
               {/* Decorative dots for path */}
               <svg className="absolute inset-0 w-full h-full">
                 <path 
                   d="M 20 150 Q 80 50 150 120 T 300 80" 
                   fill="none" 
                   stroke="rgba(14, 165, 233, 0.2)" 
                   strokeWidth="4" 
                   strokeDasharray="8 8" 
                 />
               </svg>

               {PHASES.map((p, i) => (
                 <div 
                   key={p.id}
                   className={`absolute w-6 h-6 flex items-center justify-center text-[10px] blocky-border transition-all duration-700
                     ${i < phaseIndex ? 'bg-amber-500 border-amber-300 text-black' : i === phaseIndex ? 'bg-sky-500 border-sky-300 text-white animate-pulse' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}
                   `}
                   style={{ 
                     left: `${15 + (i * 12)}%`, 
                     top: `${40 + (Math.sin(i) * 30)}%` 
                   }}
                 >
                   {i < phaseIndex ? '✓' : i + 1}
                 </div>
               ))}

               {/* Ship Icon (Animated) */}
               <motion.div 
                 className="absolute text-2xl z-10"
                 animate={{ 
                   left: `${15 + (phaseIndex * 12)}%`, 
                   top: `${40 + (Math.sin(phaseIndex) * 30) - 25}%` 
                 }}
                 transition={{ type: "spring", stiffness: 50 }}
               >
                 ⛵
               </motion.div>
            </div>
            <div className="mt-4 flex justify-between items-center text-[10px] text-zinc-600 font-bold uppercase">
              <span>Start</span>
              <span className="text-amber-600">The Swarm Target</span>
              <span>Horizon</span>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 w-full text-center border-t-4 border-zinc-900 pt-8 pb-12">
        <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-[0.2em] mb-4">
          Built with Grok Build Architecture • Sovereign Swarm Active • Edge AI Ops
        </p>
        <div className="flex justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all">
          <span className="text-xs">NixOS</span>
          <span className="text-xs">Ansible</span>
          <span className="text-xs">Proxmox</span>
          <span className="text-xs">Ollama</span>
        </div>
      </footer>

      {/* Toast Notification for Copy */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-3 blocky-border border-amber-300 font-bold uppercase text-xs z-50 shadow-2xl"
          >
            SQUAWK! Code Copied to Parchment!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
