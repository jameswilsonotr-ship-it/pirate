import React, { useState, useEffect, useRef } from "react";
import { 
  Anchor, ChevronRight, ChevronLeft, Clipboard, ClipboardCheck, 
  MessageSquare, Terminal, Volume2, VolumeX, Mic, MicOff,
  Scroll, Settings, Ship, Map as MapIcon, Book, Flag, RotateCcw,
  Share2, Camera, BrainCircuit, Radar, Music, Info, UploadCloud
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PHASES, INITIAL_LOG } from "./constants";
import { audioService } from "./lib/audioService";
import { speechService } from "./lib/speechService";

// --- Components ---
const Tooltip = ({ title, content, children }: { title: string, content: string, children: React.ReactNode }) => (
  <div className="relative group inline-block">
    {children}
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 blocky-border border-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden group-hover:block">
      <p className="text-amber-500 font-bold text-xs uppercase mb-1">{title}</p>
      <p className="text-zinc-300 text-[10px] uppercase font-mono">{content}</p>
    </div>
  </div>
);

const TerminalParser = ({ onSendToMate }: { onSendToMate: (text: string) => void }) => {
  const [input, setInput] = useState("");
  const cleanANSI = (str: string) => str.replace(/[\u001b\u009b][[()#;?]*(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d]*)*)?\u0007/g, "");
  const highlightedText = (text: string) => {
    return text.split("\n").map((line, i) => {
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
      <label className="text-xs uppercase text-amber-500 mb-2 font-bold flex items-center justify-between">
        <span>Paste Terminal Output Here</span>
      </label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full h-32 bg-zinc-950 text-green-400 p-2 font-mono text-sm focus:outline-none border-none resize-none retro-scrollbar"
        placeholder="Raw terminal logs go here..."
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-[10px] text-zinc-600 uppercase font-bold">{input.length} Chars Buffered</span>
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
  loading,
  shipStateData
}: { 
  history: any[], 
  onSendMessage: (msg: string, deepDive: boolean, encodedImage: string | null, sysContext: string | null) => void,
  loading: boolean,
  shipStateData: string
}) => {
  const [msg, setMsg] = useState("");
  const [isDeepDive, setIsDeepDive] = useState(false);
  const [imageThumb, setImageThumb] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => setImageThumb(event.target?.result as string);
            reader.readAsDataURL(blob);
          }
        }
      }
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImageThumb(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const send = (contextString: string | null = null) => {
     if (!msg.trim() && !imageThumb && !contextString) return;
     onSendMessage(msg, isDeepDive, imageThumb, contextString);
     setMsg("");
     setImageThumb(null);
     if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col h-[525px] bg-sky-950/20 blocky-border border-sky-800">
      <div className="bg-sky-900/40 p-2 flex justify-between items-center border-b-2 border-sky-800">
        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-sky-400 uppercase">
           <input type="checkbox" checked={isDeepDive} onChange={(e) => setIsDeepDive(e.target.checked)} className="hidden" />
           <div className={`w-4 h-4 blocky-border flex items-center justify-center ${isDeepDive ? 'bg-sky-500 border-sky-300' : 'bg-black border-sky-700'}`}>
              {isDeepDive && <BrainCircuit size={10} className="text-black" />}
           </div>
           Deep Dive Mode
        </label>
        <button 
          onClick={() => send(shipStateData)}
          className="flex items-center gap-1 text-[10px] font-bold text-sky-200 bg-sky-900 px-3 py-1 blocky-border border-sky-500 hover:bg-sky-800 transition-colors uppercase cursor-pointer"
        >
          <Radar size={12}/> Scan Ship State
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 retro-scrollbar space-y-4 text-sm bg-[radial-gradient(#0c4a6e_1px,transparent_1px)] [background-size:20px_20px] bg-[#020617]/50">
        {history.length === 0 && (
          <div className="text-zinc-500 text-xs italic text-center mt-10 p-4 bg-black/50 blocky-border border-zinc-800">
            Grok is watching from the rigging. Say something to the First Mate, or paste a screenshot!
          </div>
        )}
        {history.map((h, i) => (
          <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 text-sm ${h.role === 'user' ? 'bg-amber-900/80 border-amber-700 text-amber-100' : 'bg-black/90 border-sky-600 text-sky-300'} border-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] overflow-hidden`}>
              {h.role !== 'user' && <div className="font-bold text-sky-400 mb-2 border-b border-sky-800/50 pb-1 flex items-center gap-2"><span className="animate-pulse">🦜</span> Grok</div>}
              {h.parts.map((p: any, idx: number) => {
                 if (p.inlineData) {
                    return <img key={idx} src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} className="max-w-full max-h-48 mb-2 blocky-border border-amber-500/50 opacity-80" alt="HUD scan"/>
                 }
                 if (h.role === 'model') {
                    return <div key={idx} dangerouslySetInnerHTML={{ __html: p.text }} />
                 }
                 return <div key={idx} className="whitespace-pre-wrap font-mono uppercase text-xs">{p.text}</div>
              })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-black/90 border-sky-600 border-2 p-3 text-sm animate-pulse text-sky-300 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] flex items-center gap-2">
              <BrainCircuit size={16} className="animate-spin text-sky-400" /> First Mate reasoning...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t-2 border-sky-800 bg-sky-950/80 flex flex-col gap-2 relative">
        {imageThumb && (
           <div className="absolute -top-16 left-2 bg-black p-1 blocky-border border-amber-500 shadow-xl group z-10">
             <button onClick={() => setImageThumb(null)} className="absolute -top-2 -right-2 bg-red-600 rounded-full w-4 h-4 text-[10px] text-white flex items-center justify-center hover:scale-110">x</button>
             <img src={imageThumb} className="h-12 w-16 object-cover opacity-80" alt="Preview"/>
           </div>
        )}
        <div className="flex gap-2 items-center">
          <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-amber-500 hover:text-amber-300 bg-black p-2 blocky-border border-amber-900 transition-colors"
            title="Upload Screenshot"
          >
            <Camera size={16} />
          </button>
          <input
            type="text"
            value={msg}
            onPaste={handlePaste}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type or paste screenshot..."
            className="flex-1 bg-black text-sky-100 px-3 py-2 text-sm font-mono transition-all focus:outline-none focus:border-sky-500 blocky-border border-sky-900 focus:animate-pulse"
          />
          <button
            onClick={() => send()}
            className="bg-sky-600 hover:bg-sky-500 text-black font-bold p-2 transition-colors blocky-border border-sky-400"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};


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

  const currentPhase = PHASES[phaseIndex];

  const buildShipState = () => {
     let stateStr = `CURRENT PHASE: ${currentPhase.title}\nCAPTAIN'S LOG: ${log}\n\n`;
     stateStr += `DISCOVERED VARIABLES:\n${JSON.stringify(discovered, null, 2)}\n\n`;
     stateStr += `COMPLETED CHECKLISTS:\n${JSON.stringify(checks, null, 2)}`;
     return stateStr;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const sharePhaseLog = () => {
    const text = `--- ${currentPhase.title} ---\n\n${currentPhase.narrative}\n\n[PAYLOAD]:\n${currentPhase.payload}`;
    copyToClipboard(text, `share-${phaseIndex}`);
  };

  const handleSendMessage = async (msgText: string, deepDive: boolean, imageThumb: string | null = null, sysContext: string | null = null) => {
    const userParts: any[] = [];
    
    // UI placeholder for context injection to show the user it was sent
    let renderText = msgText;
    if (sysContext && !msgText && !imageThumb) renderText = "[SYSTEM ACTION - SHIP STATE SCANNED]";
    if (renderText) userParts.push({ text: renderText });

    if (imageThumb) {
       const mimeType = imageThumb.substring(5, imageThumb.indexOf(';'));
       const data = imageThumb.split(',')[1];
       userParts.push({ inlineData: { mimeType, data } });
    }

    const newHistory = [...chatHistory, { role: "user", parts: userParts }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           message: msgText || "", 
           history: chatHistory,
           deepDive,
           shipState: sysContext,
           imageData: imageThumb
        }),
      });
      const data = await response.json();
      const updatedHistory = [...newHistory, { role: "model", parts: [{ text: data.text }] }];
      setChatHistory(updatedHistory);
      
      // Parse out details for speech so it doesn't read HTML tags
      const speechText = data.text.replace(/<[^>]+>/g, '').trim();
      if (speechText) speechService.speak(speechText);
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
    if (confirm("Captain, are you sure you want to abandon ship and restart the journey? Your LocalStorage will be flushed.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-[1400px] mx-auto 2xl:max-w-[1600px]">
      <header className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-amber-950/20 p-6 blocky-border border-amber-900 border-b-8 shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-1 opacity-20 pointer-events-none">
           <svg width="200" height="100" className="text-amber-500 fill-current">
              <rect x="180" y="20" width="10" height="10" />
              <rect x="160" y="40" width="10" height="10" />
           </svg>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative">
             <Ship size={56} className="text-amber-500 animate-bounce relative z-10" />
             <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold text-amber-500 pixel-text uppercase tracking-widest">Grok's Treasure Map</h1>
            <p className="text-sm text-amber-200/80 uppercase tracking-[0.3em] font-bold mt-1">Deployment Logbook V4.0</p>
          </div>
        </div>
        
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={toggleAudio}
            className={`p-3 blocky-border flex items-center justify-center relative overflow-hidden group ${isAudioOn ? 'bg-amber-500 text-black border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-zinc-900 text-amber-600 border-zinc-700 hover:border-amber-700'}`}
            title="Compose Pirate Shanty"
          >
            {isAudioOn && <div className="absolute inset-0 bg-amber-200 opacity-20 group-hover:opacity-40 transition-opacity"></div>}
            {isAudioOn ? <Music size={24} className="animate-pulse" /> : <Music size={24} />}
          </button>
          
          {/* Enhanced Live Voice HUD */}
          <div className="relative flex items-center justify-center">
             {isParrotOn && (
                <>
                  <div className="absolute w-12 h-12 rounded-full border-2 border-green-500 animate-[ping_2s_ease-out_infinite] opacity-60 pointer-events-none z-0"></div>
                  <div className="absolute w-16 h-16 rounded-full border border-green-400/40 animate-[ping_2.5s_ease-out_infinite] opacity-40 pointer-events-none z-0"></div>
                </>
             )}
             <button 
               onClick={() => {
                 const newState = !isParrotOn;
                 setIsParrotOn(newState);
                 speechService.setParrotEnabled(newState);
               }}
               className={`p-3 blocky-border relative z-10 transition-colors ${isParrotOn ? 'bg-green-500 text-black border-green-200 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-zinc-900 text-sky-600 border-zinc-700'}`}
               title="Toggle Parrot Voice Ingestion"
             >
               {isParrotOn ? <Mic size={24} /> : <MicOff size={24} />}
             </button>
          </div>
          
          <button 
            onClick={resetProgress}
            className="p-3 blocky-border bg-red-900/40 text-red-500 border-red-900 hover:bg-red-900 hover:text-white transition-all font-bold text-xs uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
            title="Reset All Progress"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <div className="bg-zinc-900/50 p-6 blocky-border border-zinc-800 relative overflow-hidden shadow-lg">
            <div className="absolute left-0 top-0 w-2 h-full bg-gradient-to-b from-amber-500 to-transparent opacity-20"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest bg-black px-2 py-1 blocky-border border-zinc-700">
                <MapIcon size={16} /> Voyage Progress
              </h2>
              <span className="text-sm font-bold text-black tracking-widest bg-amber-500 px-3 py-1 border-2 border-amber-200 shadow-[4px_4px_0_0_#92400e]">PHASE {phaseIndex + 1} OF 7</span>
            </div>
            <div className="relative h-6 bg-black blocky-border border-zinc-700 mb-8 overflow-hidden shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] p-1">
               <motion.div 
                 className="absolute left-1 top-1 bottom-1 bg-amber-500 animate-[breathing_3s_ease-in-out_infinite]"
                 initial={{ width: 0 }}
                 animate={{ width: `calc(${((phaseIndex + 1) / 7) * 100}% - 8px)` }}
               >
                 <div className="w-full h-full bg-[linear-gradient(45deg,rgba(0,0,0,0.2)25%,transparent_25%,transparent_50%,rgba(0,0,0,0.2)50%,rgba(0,0,0,0.2)75%,transparent_75%,transparent)] [background-size:20px_20px]"></div>
               </motion.div>
               <div className="absolute inset-1 flex justify-between z-10 pointer-events-none">
                 {[...Array(7)].map((_, i) => (
                   <div key={i} className={`w-1 h-full ${i < phaseIndex ? 'bg-black/50' : 'bg-transparent border-l border-zinc-800/80'}`} />
                 ))}
               </div>
            </div>
            <div className="flex justify-between relative z-10">
              <button 
                onClick={() => setPhaseIndex(p => Math.max(0, p - 1))}
                disabled={phaseIndex === 0}
                className="flex items-center gap-2 text-xs font-bold uppercase disabled:opacity-20 hover:text-amber-400 bg-zinc-950 px-4 py-2 border-2 border-zinc-800 transition-all hover:border-amber-500 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none disabled:active:translate-y-0 disabled:shadow-none"
              >
                <ChevronLeft size={16} /> Retreat
              </button>
              <button 
                onClick={() => setPhaseIndex(p => Math.min(PHASES.length - 1, p + 1))}
                disabled={phaseIndex === PHASES.length - 1}
                className="flex items-center gap-2 text-xs font-bold uppercase disabled:opacity-20 hover:text-amber-400 bg-zinc-950 px-4 py-2 border-2 border-zinc-800 transition-all hover:border-amber-500 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none disabled:active:translate-y-0 disabled:shadow-none"
              >
                Advance <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ ease: "easeInOut", duration: 0.4 }}
              className={`p-8 blocky-border transition-shadow duration-500 overflow-hidden relative shadow-2xl ${phaseIndex === 2 ? 'breathing-border border-amber-500 bg-amber-950/20 ember-glow' : 'border-zinc-700 bg-zinc-900/40'}`}
              style={{ boxShadow: phaseIndex !== 2 ? `0 0 40px ${currentPhase.glow}` : undefined }}
            >
              {/* Decorative backgrounds handled by constant arrays/phase specifics */}

              <div className="flex justify-between items-start mb-6 relative z-10 border-b-2 border-zinc-800/50 pb-6">
                <div className="pr-8">
                  <div className="text-amber-500/80 text-xs font-bold uppercase tracking-[0.3em] mb-3">{currentPhase.title.split('–')[0]}</div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter drop-shadow-md">{currentPhase.subtitle}</h2>
                </div>
                <div className="text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] bg-black/50 p-2 blocky-border border-zinc-800">{currentPhase.emoji.split('')[0]}</div>
              </div>

              {currentPhase.badge && (
                <div className="inline-block px-4 py-2 bg-amber-500 text-black font-bold text-[10px] uppercase mb-8 tracking-[0.3em] animate-pulse border-2 border-amber-200">
                  {currentPhase.badge}
                </div>
              )}

              <p className="text-lg md:text-xl font-serif italic text-amber-100/90 mb-10 border-l-8 border-amber-600 pl-6 py-4 bg-gradient-to-r from-amber-900/50 to-transparent leading-relaxed drop-shadow-sm relative shadow-inner">
                <span className="text-6xl absolute -top-4 -left-4 text-amber-700/50 select-none font-sans">"</span>
                {currentPhase.narrative}
              </p>

              <div className="relative group mb-10">
                <div className="absolute right-3 top-3 z-10 flex gap-2">
                  <button 
                    onClick={sharePhaseLog}
                    className="p-2 bg-zinc-900 hover:bg-sky-900 transition-colors blocky-border border-zinc-600 text-sky-400 group-hover:opacity-100 opacity-30 shadow-md"
                    title="Share Voyage Log"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={() => copyToClipboard(currentPhase.payload, `code-${phaseIndex}`)}
                    className="p-2 bg-zinc-900 hover:bg-amber-900 transition-colors blocky-border border-zinc-600 text-amber-500 group-hover:opacity-100 opacity-30 shadow-md"
                  >
                    {copied === `code-${phaseIndex}` ? <ClipboardCheck size={16} /> : <Clipboard size={16} />}
                  </button>
                </div>
                <pre className="bg-[#050505] p-6 lg:p-8 font-mono text-sm lg:text-base text-amber-500/90 overflow-x-auto retro-scrollbar blocky-border border-zinc-700 leading-relaxed shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)] relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-transparent opacity-50"></div>
                  <code>{currentPhase.payload}</code>
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 font-mono">
                <div className="bg-black/60 p-5 blocky-border border-zinc-800 relative shadow-inner">
                  <h3 className="text-xs font-bold uppercase text-zinc-500 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Flag size={14} className="text-sky-500"/> Discovered Variables</span>
                    <Tooltip title="Local Variables" content="These variables are persisted locally to localStorage. Use them to string together node targets.">
                       <Info size={14} className="text-zinc-600 hover:text-amber-500 cursor-help" />
                    </Tooltip>
                  </h3>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="IP Address..."
                      className="w-full bg-zinc-950 border-b-2 border-zinc-700 pb-2 text-sm text-sky-300 outline-none focus:border-sky-500 focus:bg-black transition-colors font-mono tracking-wider px-2 pt-2" 
                      value={discovered[`v1_${phaseIndex}`] || ""}
                      onChange={(e) => setDiscovered(prev => ({ ...prev, [`v1_${phaseIndex}`]: e.target.value }))}
                    />
                    <input 
                      type="text" 
                      placeholder="Vault Seed..."
                      className="w-full bg-zinc-950 border-b-2 border-zinc-700 pb-2 text-sm text-sky-300 outline-none focus:border-sky-500 focus:bg-black transition-colors font-mono tracking-wider px-2 pt-2" 
                      value={discovered[`v2_${phaseIndex}`] || ""}
                      onChange={(e) => setDiscovered(prev => ({ ...prev, [`v2_${phaseIndex}`]: e.target.value }))}
                    />
                  </div>
                  <div className="mt-4 text-[9px] text-green-500/80 uppercase font-bold tracking-widest text-right">Telemetry Sync • {Object.values(discovered).join("").length} Chars</div>
                </div>
                
                <div className="bg-black/60 p-5 blocky-border border-zinc-800 relative shadow-inner">
                  <h3 className="text-xs font-bold uppercase text-zinc-500 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Anchor size={14} className="text-amber-500"/> Completion Checklist</span>
                    <Tooltip title="Task Completion" content="Each tick ensures the Grok node has met structural prerequisites for active deployment phase.">
                       <Info size={14} className="text-zinc-600 hover:text-amber-500 cursor-help" />
                    </Tooltip>
                  </h3>
                  <div className="space-y-3">
                    {currentPhase.checklist.map((item, i) => (
                      <label key={i} className="flex items-start gap-4 cursor-pointer group p-2 hover:bg-zinc-900 transition-colors border border-transparent hover:border-zinc-800">
                        <div className="relative mt-0.5 flex-shrink-0">
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={checks[`c_${phaseIndex}_${i}`] || false}
                            onChange={(e) => setChecks(prev => ({ ...prev, [`c_${phaseIndex}_${i}`]: e.target.checked }))}
                          />
                          <div className={`w-5 h-5 blocky-border transition-all ${checks[`c_${phaseIndex}_${i}`] ? 'bg-amber-500 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]' : 'bg-black border-zinc-600 group-hover:border-zinc-400'}`} />
                        </div>
                        <span className={`text-sm tracking-wide font-mono leading-tight ${checks[`c_${phaseIndex}_${i}`] ? 'text-amber-500/50 line-through' : 'text-zinc-300 group-hover:text-white'} transition-all`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {phaseIndex === PHASES.length - 1 && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="mt-16 p-8 md:p-12 bg-amber-500 text-black blocky-border border-yellow-200 border-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative group overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-64 h-64 opacity-5 text-black">
                     <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z"/></svg>
                  </div>
                  
                  <div className="relative z-10 text-center flex flex-col items-center">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase mb-4 tracking-tighter drop-shadow-lg text-black">Deployment Certificate</h2>
                    <p className="text-base md:text-xl font-bold opacity-100 mb-10 uppercase tracking-[0.4em] bg-black text-amber-500 px-6 py-3 inline-block shadow-lg border-2 border-amber-900">
                      Grok Sovereign Swarm Active
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left font-mono mb-12 w-full max-w-4xl mx-auto">
                       <div className="bg-black/95 text-amber-500 p-8 blocky-border shadow-[12px_12px_0_0_#b45309]">
                         <h3 className="text-zinc-500 font-bold uppercase text-xs mb-6 border-b border-zinc-800 pb-2">Swarm Telemetry</h3>
                         <div className="space-y-4">
                           <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                             <span className="uppercase text-amber-600 text-xs font-bold">Vessel</span>
                             <span className="uppercase font-bold tracking-widest text-sky-400">Grok Treasure Ship</span>
                           </div>
                           <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                             <span className="uppercase text-amber-600 text-xs font-bold">Commander Rank</span>
                             <span className="uppercase font-bold active:text-amber-200">Swarm Admiral</span>
                           </div>
                           <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                             <span className="uppercase text-amber-600 text-xs font-bold">Deployment Time</span>
                             <span className="uppercase font-bold text-green-500 animate-pulse bg-green-950/40 px-2 py-1">01:45:00 (Sim)</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="bg-black/95 text-amber-500 p-8 blocky-border shadow-[12px_12px_0_0_#0ea5e9]">
                         <h3 className="text-zinc-500 font-bold uppercase text-xs mb-6 border-b border-zinc-800 pb-2">Active Node Matrix</h3>
                         <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                               <span className="uppercase text-amber-600 text-xs font-bold">Orchestration Nodes</span>
                               <span className="uppercase font-bold text-green-500">Active [WSL2]</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                               <span className="uppercase text-amber-600 text-xs font-bold">Letta Memory</span>
                               <span className="uppercase font-bold text-sky-400">3/3 Vaults</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                               <span className="uppercase text-amber-600 text-xs font-bold">Hermes Graph</span>
                               <span className="uppercase font-bold text-amber-400">Connected</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-zinc-900 pb-2">
                               <span className="uppercase text-amber-600 text-xs font-bold">NixOS Fleet</span>
                               <span className="uppercase font-bold text-green-500">Fully Scaled</span>
                            </div>
                         </div>
                       </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-6 w-full max-w-2xl">
                      <button className="flex-1 bg-black text-amber-500 px-8 py-5 md:text-lg font-bold uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all blocky-border border-black shadow-[6px_6px_0_0_rgba(0,0,0,0.6)] active:translate-y-1 active:translate-x-1 active:shadow-none focus:outline-none focus:ring-4 focus:ring-amber-300">
                        Dashboard Mode
                      </button>
                      <button 
                        onClick={resetProgress}
                        className="flex-1 bg-red-800 text-black border-black px-8 py-5 md:text-lg font-bold uppercase tracking-widest hover:bg-red-600 transition-all blocky-border shadow-[6px_6px_0_0_#450a0a] active:translate-y-1 active:translate-x-1 active:shadow-none focus:outline-none focus:ring-4 focus:ring-red-400"
                      >
                        Redeploy / Reset Logs
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          <TerminalParser onSendToMate={(text) => handleSendMessage(`[TERMINAL OUTPUT LOG PARSED]\n${text}`, false, null, null)} />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          
          <div className="bg-zinc-900/50 p-6 blocky-border border-zinc-800 relative group overflow-hidden shadow-lg">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent opacity-50"></div>
            <h2 className="text-sm font-bold uppercase text-amber-500 flex items-center justify-between gap-2 mb-4 relative z-10 w-full border-b-2 border-zinc-800 pb-2">
              <span className="flex items-center gap-2 tracking-widest"><Book size={16} /> Captain's Log</span>
            </h2>
            <textarea
              value={log}
              onChange={(e) => setLog(e.target.value)}
              className="w-full h-48 bg-black p-4 font-mono text-[13px] text-amber-200 blocky-border border-zinc-700 resize-none focus:outline-none focus:border-amber-500 focus:bg-zinc-950 transition-all retro-scrollbar relative z-10 shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)] mt-2"
              placeholder="Chronicle your voyage observations here..."
            />
            <div className="mt-3 text-[10px] text-green-500/80 font-mono uppercase font-bold tracking-widest text-right relative z-10">
               Telemetry Synced • {log.length} Chars
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 shadow-2xl">
            <h2 className="text-sm font-bold uppercase text-sky-400 flex items-center gap-2 p-3 bg-sky-950/80 border-t-4 border-l-4 border-r-4 border-sky-800 tracking-widest">
              <MessageSquare size={16} /> Deck Chatter
            </h2>
            <GrokChat 
              history={chatHistory} 
              onSendMessage={handleSendMessage} 
              loading={chatLoading} 
              shipStateData={buildShipState()}
            />
          </div>

        </div>
      </div>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-sky-500 text-black px-8 py-4 blocky-border border-2 border-sky-200 font-bold uppercase text-sm z-50 shadow-[0_10px_30px_rgba(14,165,233,0.6)] flex items-center gap-3 drop-shadow-2xl"
          >
            <ClipboardCheck size={24} /> SQUAWK! Saved to Parchment!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
