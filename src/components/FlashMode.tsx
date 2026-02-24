import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HospitalRecommendations from "./HospitalRecommendations";
import { X, Send, Zap } from "lucide-react";
import MedicalSummaryCard from "./MedicalSummaryCard";
import { callAIAPI, getSelectedModel } from "@/lib/aiService";

interface FlashModeProps { onExit: () => void; }

const callGeminiAPI = async (prompt: string) => {
  try {
    const selectedModel = getSelectedModel();
    const medicalPrompt = `You are an emergency medical professional. Provide:\n**SUMMARY OF CASE:**\n**URGENCY LEVEL:**\n**RECOMMENDED SPECIALTY:**\n**FIRST AID RECOMMENDATIONS:**\n**ADDITIONAL INVESTIGATIONS NEEDED:**\n\nUser's Emergency Input: ${prompt}`;
    return await callAIAPI(medicalPrompt, selectedModel);
  } catch (error: any) {
    if (error?.message?.includes('API key')) return "Please configure your API key.";
    return "Error processing request. Please try again.";
  }
};

const extractSpecialty = (summary: string): string => {
  const match = summary.match(/\*\*RECOMMENDED SPECIALTY:\*\*[\r\n]*([\s\S]*?)(?=\*\*|$)/i);
  if (match) return match[1].split(/[\n\r]/)[0].trim().split(/,|\band\b/)[0] || "general medicine";
  return "general medicine";
};

const parseGeminiSummarySections = (summary: string) => {
  const sections: { type: string; content: string }[] = [];
  const regex = /\*\*([\w \-]+):\*\*[\r\n]*([\s\S]*?)(?=(\*\*[\w \-]+:\*\*|$))/gi;
  let match;
  while ((match = regex.exec(summary))) { const type = match[1].trim(); const content = match[2].trim(); sections.push({ type, content }); }
  return sections;
};

const FLASH_HINTS = ["Please describe your complaints briefly", "Include: duration", "Include: severity", "Include: medical history"];

const FlashMode: React.FC<FlashModeProps> = ({ onExit }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState("");
  const [hintIdx, setHintIdx] = useState(0);
  const [typingIndex, setTypingIndex] = useState(0);
  const [typingForward, setTypingForward] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (input.length > 0) { setPlaceholder(""); return; }
    let timeout: NodeJS.Timeout;
    const currentHint = FLASH_HINTS[hintIdx];
    if (typingForward) {
      if (typingIndex < currentHint.length) timeout = setTimeout(() => { setPlaceholder(currentHint.slice(0, typingIndex + 1)); setTypingIndex(typingIndex + 1); }, 30);
      else timeout = setTimeout(() => setTypingForward(false), 1200);
    } else {
      if (typingIndex > 0) timeout = setTimeout(() => { setPlaceholder(currentHint.slice(0, typingIndex - 1)); setTypingIndex(typingIndex - 1); }, 10);
      else timeout = setTimeout(() => { setHintIdx((hintIdx + 1) % FLASH_HINTS.length); setTypingForward(true); }, 500);
    }
    return () => clearTimeout(timeout);
  }, [typingIndex, typingForward, hintIdx, input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setSummary(null); setSpecialty(null); setSummaryError(null);
    try {
      const aiSummary = await callGeminiAPI(input.trim());
      setSummary(aiSummary); setSpecialty(extractSpecialty(aiSummary));
    } catch { setSummaryError("Unable to generate analysis."); }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-3 sm:p-4">
      <Card className="w-full max-w-[95vw] sm:max-w-lg glass-card border-success/20 rounded-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl shadow-success/10">
        <CardContent className="p-6 sm:p-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-success/30 to-success/10 rounded-xl flex items-center justify-center border border-success/25">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <span className="text-lg font-bold text-foreground">Flash Mode</span>
            </div>
            <Button size="icon" variant="ghost" onClick={onExit} className="text-muted-foreground/70 hover:text-destructive/80 hover:bg-white/8 h-8 w-8 press-scale rounded-lg transition-all">
              <X className="w-4 h-4" />
            </Button>
          </div>
          {!summary && (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input type="text" className="rounded-lg border border-white/8 px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-success/40 focus:border-transparent bg-white/5 text-foreground placeholder:text-muted-foreground/60 placeholder:italic transition-all duration-200" placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)} disabled={loading} autoFocus />
                <Button type="submit" className="bg-gradient-to-r from-success to-success/90 hover:from-success/95 hover:to-success/85 text-success-foreground font-semibold flex items-center gap-2 justify-center py-3 rounded-lg press-scale transition-all shadow-lg shadow-success/20" disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" /> Analyze Now
                </Button>
              </form>
              <div className="mt-4 text-xs text-center text-yellow-400/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 font-medium">Flash Mode provides quick analysis. Consult healthcare professionals for critical situations.</div>
            </>
          )}
          {summary && !loading && (
            <>
              <div className="w-full mb-4 p-4 rounded-lg bg-success/8 border border-success/25 text-sm text-foreground/90"><span className="font-semibold text-success">Your input: </span> {input}</div>
              <div className="w-full mb-4 text-xs text-center text-yellow-400/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2.5 font-medium">Flash Mode provides quick analysis. Consult healthcare professionals for critical situations.</div>
            </>
          )}
        </CardContent>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-1 sm:px-2">
          {summaryError && <div className="w-full bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-4 text-center text-sm">{summaryError}</div>}
          {loading && <div className="flex flex-col items-center justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-success mb-3"></div><span className="text-sm text-success">Analyzing emergency input...</span></div>}
          {summary && !loading && (
            <div className="mt-2 w-full flex flex-col items-center space-y-3">
              {parseGeminiSummarySections(summary).map((section, idx) => (<div key={idx} className="w-full"><MedicalSummaryCard summary={section.content} summaryType={section.type} /></div>))}
              <div className="w-full"><HospitalRecommendations specialty={specialty || "general medicine"} summary={summary || ""} /></div>
              <Button className="mt-4 w-full bg-success hover:bg-success/90 text-success-foreground font-semibold rounded-xl press-scale" onClick={onExit}>Exit Flash Mode</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FlashMode;
