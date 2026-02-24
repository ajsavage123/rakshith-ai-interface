import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, User, Bot, Sparkles, Edit3, MapPin, Stethoscope, MessageCircle, Heart, TestTube } from "lucide-react";
import InteractiveMessage from "./InteractiveMessage";
import TypingIndicator from "./TypingIndicator";
import HospitalRecommendations from "./HospitalRecommendations";
import MedicalSummaryCard from "./MedicalSummaryCard";
import { storageService, ChatSession } from "@/lib/storage";
import { useAuth } from "@/contexts/AuthContext";
import SpecialtyDisplay from "./SpecialtyDisplay";
import SpecialtyRecommendation from "./SpecialtyRecommendation";
import FlashMode from "./FlashMode";
import { cn } from '../lib/utils';
import { callAIAPI, getSelectedModel, getApiKey, AI_MODELS, AIModel } from '@/lib/aiService';

interface InteractiveOption { id: string; label: string; value: string; }
interface Message { id: number; text?: string; sender: "user" | "ai"; timestamp: Date; isInteractive?: boolean; question?: string; options?: InteractiveOption[]; selectedOption?: string; showHospitals?: boolean; summary?: string; specialty?: string; summaryType?: string; specialties?: string[]; showSpecialtyRecommendation?: boolean; }
type DynamicQuestion = { question: string; options: string[] };
const MAX_TOTAL_QUESTIONS = 10;

interface ChatAreaProps { sessionId: string; onUpdateSession: (session: ChatSession) => void; }

const ChatArea = ({ sessionId, onUpdateSession }: ChatAreaProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [currentlyShowingInteractive, setCurrentlyShowingInteractive] = useState(false);
  const [dynamicQuestions, setDynamicQuestions] = useState<DynamicQuestion[]>([]);
  const [dynamicAnswers, setDynamicAnswers] = useState<string[]>([]);
  const [currentDynamicIndex, setCurrentDynamicIndex] = useState(0);
  const [isGeneratingDynamic, setIsGeneratingDynamic] = useState(false);
  const [allAskedQuestions, setAllAskedQuestions] = useState<string[]>([]);
  const [askedQuestionIds, setAskedQuestionIds] = useState<Set<string>>(new Set());
  const mainInputRef = useRef<HTMLInputElement>(null);
  const [inputPlaceholder, setInputPlaceholder] = useState("Describe your symptoms...");
  const [customAnswerMode, setCustomAnswerMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{ role: string, content: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showUserFallback, setShowUserFallback] = useState(false);
  const [userFallbackInput, setUserFallbackInput] = useState("");
  const [conversationStep, setConversationStep] = useState(0);
  const [currentSpecialties, setCurrentSpecialties] = useState<string[]>([]);
  const [flashMode, setFlashMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState<AIModel>(getSelectedModel());
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadAIModel = useCallback(async () => {
    const model = getSelectedModel();
    setSelectedAIModel(model);
    const apiKey = getApiKey(model);
    if (apiKey) console.log('✅ API key loaded successfully');
  }, []);

  useEffect(() => {
    loadAIModel();
    const handleStorageChange = (e: StorageEvent) => { if (e.key?.startsWith('api_key_') || e.key === 'selected_ai_model') loadAIModel(); };
    const handleCustomStorageChange = () => loadAIModel();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apiKeyUpdated', handleCustomStorageChange);
    return () => { window.removeEventListener('storage', handleStorageChange); window.removeEventListener('apiKeyUpdated', handleCustomStorageChange); };
  }, [loadAIModel]);

  const normalizeQuestion = (q: string) => q.replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();
  const areQuestionsSimilar = (q1: string, q2: string) => {
    const norm1 = normalizeQuestion(q1); const norm2 = normalizeQuestion(q2);
    if (norm1 === norm2) return true;
    if (norm1.length > 10 && norm2.length > 10 && (norm1.includes(norm2) || norm2.includes(norm1))) return true;
    return false;
  };
  const isSimilarQuestion = (newQ: string) => {
    const asked = messages.filter(m => m.isInteractive && m.question).map(m => m.question || '');
    return asked.some(q => areQuestionsSimilar(q, newQ));
  };

  const conversationFlow = [
    { question: "How long have you had these symptoms?", options: [{ id: "1", label: "Less than 24 hours", value: "less_than_24h" }, { id: "2", label: "1-3 days", value: "1_3_days" }, { id: "3", label: "4-7 days", value: "4_7_days" }, { id: "4", label: "More than a week", value: "more_than_week" }] },
    { question: "How severe are your symptoms?", options: [{ id: "1", label: "Mild", value: "mild" }, { id: "2", label: "Moderate", value: "moderate" }, { id: "3", label: "Severe", value: "severe" }] },
    { question: "What event or situation might have caused these symptoms?", options: [{ id: "1", label: "Recent illness or infection", value: "recent_illness" }, { id: "2", label: "Missed regular medication", value: "missed_medication" }, { id: "3", label: "Smoking/alcohol habit", value: "smoking_alchole_habit" }, { id: "4", label: "Food and dietary changes", value: "food_diety_changes" }] },
    { question: "Do you have any previous medical history?", options: [{ id: "1", label: "Hypertension", value: "hypertension" }, { id: "2", label: "Diabetes", value: "diabetes" }, { id: "3", label: "Thyroid disease", value: "thyroid_disease" }, { id: "4", label: "Lung diseases", value: "lung_diseases" }, { id: "5", label: "Asthma", value: "asthma" }, { id: "6", label: "No significant history", value: "none" }] }
  ];

  useEffect(() => {
    const loadSession = async () => {
      if (user && sessionId) {
        setLoading(true);
        try {
          const session = await storageService.getChatSession(sessionId, user.uid);
          const msgs = session?.messages || [];
          setMessages(msgs);
          let staticStep = 0;
          const askedStaticSet = new Set<string>();
          for (let i = 0; i < msgs.length; i++) {
            if (msgs[i].isInteractive && msgs[i].question && staticStep < conversationFlow.length) {
              const normQ = normalizeQuestion(msgs[i].question);
              if (!askedStaticSet.has(normQ)) { askedStaticSet.add(normQ); staticStep++; }
            }
          }
          setConversationStep(staticStep);
          const answers: { [key: string]: string } = {};
          msgs.forEach((msg) => { if (msg.isInteractive && msg.selectedOption && msg.question) answers[msg.question] = msg.selectedOption; });
          setUserAnswers(answers);
          const lastMsg = msgs[msgs.length - 1];
          setCurrentlyShowingInteractive(!!(lastMsg && lastMsg.isInteractive && !lastMsg.selectedOption));
        } catch (error) {
          setMessages([{ id: 1, text: "Hello! I'm Rakshith AI, your virtual medical assistant. What symptoms are you experiencing?", sender: "ai", timestamp: new Date() }]);
        } finally { setLoading(false); }
      }
    };
    loadSession();
  }, [sessionId, user]);

  const onUpdateSessionRef = useRef(onUpdateSession);
  onUpdateSessionRef.current = onUpdateSession;

  useEffect(() => {
    if (user && sessionId && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          const updatedSession: ChatSession = { id: sessionId, userId: user.uid, title: "Medical Consultation", messages, createdAt: messages[0]?.timestamp || new Date(), updatedAt: new Date() };
          onUpdateSessionRef.current(updatedSession);
        } catch (error) { console.error('Error in debounced session update:', error); }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, user, sessionId]);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const callGeminiAPI = async (prompt: string) => {
    const apiKey = getApiKey(selectedAIModel);
    if (!apiKey) return `⚠️ Missing API key for ${AI_MODELS[selectedAIModel].name}.`;
    try {
      const medicalPrompt = `You are an experienced medical professional. Based on patient info, provide assessment with these sections:\n**SUMMARY OF CASE:**\n**URGENCY LEVEL:**\n**RECOMMENDED SPECIALTY:**\n**FIRST AID RECOMMENDATIONS:**\n**ADDITIONAL INVESTIGATIONS NEEDED:**\n\nPatient Details:\n${prompt}`;
      const responseText = await callAIAPI(medicalPrompt, selectedAIModel);
      return responseText;
    } catch (error: any) { return `Error: ${error?.message || 'Unknown error'}`; }
  };

  const callGeminiForDynamicQuestions = async (answers: Record<string, string>, previousQuestions: string[]) => {
    const apiKey = getApiKey(selectedAIModel);
    if (!apiKey) return { question: "Can you provide more details about your symptoms?", options: ["Yes", "No", "Not sure", "Need to clarify"] };
    try {
      const mainComplaint = messages.find(m => m.sender === "user")?.text || "";
      const formattedAnswers = Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n');
      const questionsAsked = totalQuestionsAsked();
      const remainingQuestions = MAX_TOTAL_QUESTIONS - questionsAsked;
      const prompt = `You are a medical professional conducting assessment. Ask ONE follow-up question. Main complaint: ${mainComplaint}\nPrevious answers:\n${formattedAnswers}\nDo NOT repeat: ${previousQuestions.join('; ')}\nIf enough info, respond "ENOUGH_INFO". Otherwise:\nQuestion: [question]\n1. [opt1]\n2. [opt2]\n3. [opt3]\n4. [opt4]`;
      const text = await callAIAPI(prompt, selectedAIModel);
      if (text.trim().toUpperCase().includes('ENOUGH_INFO')) return null;
      const lines = text.split('\n').filter(line => line.trim());
      let questionLine = lines.find(line => line.toLowerCase().startsWith('question:'));
      if (!questionLine) questionLine = lines.find(line => !/^\d+\./.test(line.trim()) && line.trim().length > 10);
      let question = questionLine ? questionLine.replace(/^question:\s*/i, '').trim() : '';
      if (question.length > 110) question = question.slice(0, 110) + '...';
      let options = lines.filter(line => /^\d+\./.test(line.trim())).map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(opt => opt.length > 0);
      if (!question || options.length < 2) return { question: question || "Can you provide more details?", options: options.length >= 2 ? options : ["Yes", "No", "Not sure", "Need to clarify"] };
      return { question, options };
    } catch (error: any) { return { question: "Can you provide more details about your symptoms?", options: ["Yes", "No", "Not sure", "Need to clarify"] }; }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;
    const newHistory = [...conversationHistory, { role: 'user', content: inputValue }];
    setConversationHistory(newHistory);
    const newMessage: Message = { id: messages.length + 1, text: inputValue, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    setInputValue(""); setCurrentlyShowingInteractive(false); setIsTyping(true);
    if (conversationStep < conversationFlow.length) {
      setTimeout(() => {
        const staticQ = conversationFlow[conversationStep];
        setMessages(prev => { const newId = prev.length + 1; return [...prev, { id: newId, sender: "ai", timestamp: new Date(), isInteractive: true, question: staticQ.question, options: toInteractiveOptions(staticQ.options, newId) }]; });
        setCurrentlyShowingInteractive(true); setConversationStep(prev => prev + 1); setIsTyping(false);
      }, 500);
      return;
    }
    const aiQuestion = await getNextAIQuestion(newHistory);
    setIsTyping(false);
    if (aiQuestion) {
      setMessages(prev => { const newId = prev.length + 1; return [...prev, { id: newId, sender: "ai", timestamp: new Date(), isInteractive: true, question: aiQuestion.question, options: toInteractiveOptions(aiQuestion.options, newId) }]; });
      setCurrentlyShowingInteractive(true);
    }
  };

  const totalQuestionsAsked = (): number => messages.filter(m => m.isInteractive && m.question).length;
  const getAllAskedQuestions = (): string[] => messages.filter(m => m.isInteractive && m.question).map(m => m.question?.toLowerCase().trim() ?? '');
  const getAllUserAnswers = () => {
    const answers: { [question: string]: string } = {};
    let lastQuestion: string | null = null;
    for (const msg of messages) {
      if (msg.isInteractive && msg.question) lastQuestion = msg.question;
      else if (msg.sender === 'user' && lastQuestion) { answers[lastQuestion] = msg.text || ''; lastQuestion = null; }
    }
    return answers;
  };

  const getNextAIQuestion = async (history: { role: string, content: string }[], retryCount = 0): Promise<DynamicQuestion | null> => {
    if (totalQuestionsAsked() >= MAX_TOTAL_QUESTIONS) { proceedToSummary(userAnswers); return null; }
    const answers = getAllUserAnswers();
    const previousQuestions = getAllAskedQuestions();
    try {
      const dynamicQuestion = await callGeminiForDynamicQuestions(answers, previousQuestions);
      if (!dynamicQuestion) { proceedToSummary(answers); return null; }
      if (isSimilarQuestion(dynamicQuestion.question)) { if (retryCount >= 4) { proceedToSummary(answers); return null; } return getNextAIQuestion(history, retryCount + 1); }
      return dynamicQuestion;
    } catch (error) { proceedToSummary(answers); return null; }
  };

  const handleOptionSelect = async (option: InteractiveOption): Promise<void> => {
    if (currentlyShowingInteractive) {
      const currentMessage = messages[messages.length - 1];
      const currentQuestionId = normalizeQuestion(currentMessage.question || '');
      setAskedQuestionIds(prev => new Set([...prev, currentQuestionId]));
      const newMessages: Message[] = [...messages, { id: messages.length + 1, text: option.label, sender: "user" as const, timestamp: new Date() }];
      const finalMessages = newMessages.map(msg => msg.id === currentMessage.id ? { ...msg, selectedOption: option.value } : msg);
      setMessages(finalMessages); setCurrentlyShowingInteractive(false);
      const newAnswers = { ...userAnswers, [currentMessage.question || '']: option.value };
      setUserAnswers(newAnswers);

      if (conversationStep < conversationFlow.length) {
        let nextStep = conversationStep;
        while (nextStep < conversationFlow.length) {
          const nq = conversationFlow[nextStep];
          if (!askedQuestionIds.has(normalizeQuestion(nq.question))) break;
          nextStep++;
        }
        if (nextStep < conversationFlow.length) {
          const nextQuestion = conversationFlow[nextStep];
          setConversationStep(nextStep + 1);
          setTimeout(() => {
            setMessages(prev => { const newId = prev.length + 1; return [...prev, { id: newId, question: nextQuestion.question, sender: "ai" as const, timestamp: new Date(), isInteractive: true, options: toInteractiveOptions(nextQuestion.options, newId) }]; });
            setCurrentlyShowingInteractive(true);
          }, 500);
        } else {
          setConversationStep(conversationFlow.length);
          setIsGeneratingDynamic(true);
          try {
            const dq = await callGeminiForDynamicQuestions(newAnswers, getAllAskedQuestions());
            if (dq && dq.question && !isSimilarQuestion(dq.question)) {
              setTimeout(() => {
                setMessages(prev => { const newId = prev.length + 1; return [...prev, { id: newId, question: dq.question, sender: "ai" as const, timestamp: new Date(), isInteractive: true, options: toInteractiveOptions(dq.options, newId) }]; });
                setCurrentlyShowingInteractive(true);
              }, 500);
            } else proceedToSummary(newAnswers);
          } catch { proceedToSummary(newAnswers); } finally { setIsGeneratingDynamic(false); }
        }
      } else {
        const allAnswers = getAllUserAnswers();
        try {
          const nextDQ = await callGeminiForDynamicQuestions(allAnswers, getAllAskedQuestions());
          if (nextDQ && totalQuestionsAsked() < MAX_TOTAL_QUESTIONS && !isSimilarQuestion(nextDQ.question)) {
            setTimeout(() => {
              setMessages(prev => { const newId = prev.length + 1; return [...prev, { id: newId, question: nextDQ.question, sender: "ai" as const, timestamp: new Date(), isInteractive: true, options: toInteractiveOptions(nextDQ.options, newId) }]; });
              setCurrentlyShowingInteractive(true);
            }, 500);
          } else proceedToSummary(allAnswers);
        } catch { proceedToSummary(allAnswers); }
      }
    }
  };

  const proceedToSummary = async (finalAnswers?: Record<string, string>) => {
    setIsTyping(true); setCurrentlyShowingInteractive(false); setShowUserFallback(false); setSummaryError(null);
    const answers = finalAnswers || getAllUserAnswers();
    const mainComplaint = messages.find(m => m.sender === "user")?.text || "";
    const patientDetails = `Main Complaint: ${mainComplaint}\n\nAssessment Responses:\n${Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n\n')}`;
    try {
      const aiResponseText = await callGeminiAPI(patientDetails);
      if (aiResponseText.includes('apologize') || aiResponseText.includes('API key')) { setIsTyping(false); setSummaryError(aiResponseText); return; }
      setTimeout(() => {
        setIsTyping(false);
        const sections = parseGeminiSummarySections(aiResponseText);
        if (sections.length === 0) {
          if (aiResponseText.trim().length > 0) { setMessages(prev => [...prev, { id: prev.length + 1, text: aiResponseText, sender: "ai", timestamp: new Date(), summary: aiResponseText, summaryType: "Medical Assessment" }]); setSummaryError(null); return; }
          setSummaryError("Unable to parse the medical assessment."); return;
        }
        const groupedSections = sections.reduce<Record<string, string[]>>((acc, section) => { const type = section.type.trim(); if (!acc[type]) acc[type] = []; acc[type].push(section.content); return acc; }, {});
        const specialtySection = sections.find(s => s.type.toLowerCase().includes("specialty"));
        const specialtyText = specialtySection ? specialtySection.content.toLowerCase().trim() : "general medicine";
        const specialties = extractSpecialties(specialtyText);
        setCurrentSpecialties(specialties);
        let nextId = messages.length + 2;
        const newSectionMessages = Object.entries(groupedSections).filter(([type]) => !type.toLowerCase().includes('specialty')).map(([type, contents]) => ({ id: nextId++, text: contents.join('\n\n'), sender: "ai" as const, timestamp: new Date(), summary: contents.join('\n\n'), summaryType: type }));
        setMessages(prev => [...prev, ...newSectionMessages]); setSummaryError(null);
        setTimeout(() => { setMessages(prev => [...prev, { id: prev.length + 1, sender: "ai", timestamp: new Date(), showHospitals: true, specialty: specialties[0] || "general medicine", specialties }]); }, 2000);
      }, 1000);
    } catch { setIsTyping(false); setSummaryError("Unable to generate analysis. Please try again."); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSendMessage(); };

  const parseGeminiSummarySections = (summary: string) => {
    const sections: { type: string; content: string }[] = [];
    if (!summary?.trim()) return sections;
    const regex = /\*\*([\w\s\-]+):\*\*[\r\n]*([\s\S]*?)(?=(\*\*[\w\s\-]+:\*\*|$))/gi;
    let match;
    while ((match = regex.exec(summary))) {
      const type = match[1].trim(); const content = match[2].trim();
      if (type && content && content.length > 10) sections.push({ type, content });
    }
    if (sections.length === 0) {
      const regex2 = /\*\*([\w\s\-]+)\*\*[\r\n]*([\s\S]*?)(?=(\*\*[\w\s\-]+\*\*|$))/gi;
      while ((match = regex2.exec(summary))) {
        const type = match[1].trim(); const content = match[2].trim();
        if (type && content && content.length > 10) sections.push({ type, content });
      }
    }
    return sections;
  };

  const handleCustomStaticAnswer = async (answer: string): Promise<void> => {
    const userResponse: Message = { id: messages.length + 1, text: answer, sender: "user", timestamp: new Date() };
    setMessages(prev => [...prev, userResponse]);
    const currentQuestion = conversationFlow[conversationStep];
    if (currentQuestion) { setUserAnswers(prev => ({ ...prev, [currentQuestion.question]: answer })); }
    const nextStep = conversationStep + 1;
    setConversationStep(nextStep);
    if (nextStep < conversationFlow.length) {
      setTimeout(() => {
        const nextQ = conversationFlow[nextStep];
        setMessages(prev => [...prev, { id: prev.length + 1, sender: "ai", timestamp: new Date(), isInteractive: true, question: nextQ.question, options: toInteractiveOptions(nextQ.options, prev.length + 1) }]);
        setCurrentlyShowingInteractive(true);
      }, 1000);
    } else { proceedToSummary(userAnswers); }
  };

  const focusMainInput = (): void => { mainInputRef.current?.focus(); setInputPlaceholder("Describe here..."); setCustomAnswerMode(true); };

  function isStringArray(arr: unknown): arr is string[] { return Array.isArray(arr) && arr.length > 0 && arr.every(opt => typeof opt === 'string'); }

  const handleUserFallbackFinish = (): void => {
    setShowUserFallback(false);
    if (userFallbackInput.trim()) setMessages(prev => [...prev, { id: prev.length + 1, text: userFallbackInput, sender: "user", timestamp: new Date() }]);
    proceedToSummary(userAnswers); setUserFallbackInput("");
  };

  const extractSpecialties = (specialtyText: string): string[] => {
    const mappings: Record<string, string[]> = {
      'cardiology': ['cardiology', 'heart', 'chest pain'], 'neurology': ['neurology', 'headache', 'seizure'],
      'orthopedics': ['orthopedics', 'bone', 'joint', 'fracture'], 'gastroenterology': ['gastroenterology', 'stomach', 'abdomen'],
      'dermatology': ['dermatology', 'skin', 'rash'], 'pulmonology': ['pulmonology', 'lung', 'breathing', 'cough'],
      'endocrinology': ['endocrinology', 'diabetes', 'thyroid'], 'emergency': ['emergency', 'urgent', 'trauma'],
      'internal': ['internal medicine', 'general medicine', 'primary care']
    };
    const found: string[] = [];
    const lower = specialtyText.toLowerCase();
    for (const [spec, keywords] of Object.entries(mappings)) { if (keywords.some(k => lower.includes(k))) found.push(spec); }
    return found.length > 0 ? found : ['internal'];
  };

  function toInteractiveOptions(options: unknown, messageId?: number): InteractiveOption[] {
    if (Array.isArray(options) && typeof options[0] === 'string') return (options as string[]).map((opt, idx) => ({ id: messageId ? `${messageId}-opt-${idx}` : String(idx + 1), label: opt, value: opt.toLowerCase().replace(/\s+/g, '_') }));
    return options as InteractiveOption[];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 glass-card rounded-none border-x-0 border-t-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-2 w-full">
              <div>
                <h2 className="font-semibold text-foreground">Rakshith AI</h2>
                <p className="text-xs text-success">● Online</p>
              </div>
              <div className="flex-1" />
              <button
                className="ml-4 relative flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold text-success border border-success/30 press-scale shine-flash"
                style={{ background: 'linear-gradient(90deg, hsl(var(--background)) 0%, hsl(var(--background)) 40%, hsl(160 84% 39% / 0.15) 100%)' }}
                onClick={() => setFlashMode(true)}
              >
                <svg className="w-3 h-3 mr-1 text-success" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Flash Mode
                <span className="absolute left-0 top-0 w-full h-full pointer-events-none overflow-hidden rounded-xl"><span className="shine absolute left-[-75%] top-0 w-1/2 h-full bg-gradient-to-r from-white/30 to-transparent opacity-60 rotate-12" /></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => {
          const isUrgencyLevel = message.summaryType?.toLowerCase().includes('urgency level');
          return (
            <React.Fragment key={message.id}>
              <div className={`flex items-start space-x-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                {message.sender === "ai" && (
                  <div className="w-7 h-7 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[65vw] sm:max-w-xs lg:max-w-md rounded-2xl px-3 py-2 text-xs break-words transition-all duration-200 ${
                  message.showHospitals ? "glass-card" :
                  message.sender === "user" ? "bg-primary/10 border border-primary/20 text-foreground" :
                  "glass-card text-foreground animate-fade-in"
                }`}>
                  {message.isInteractive ? (
                    <InteractiveMessage question={message.question && message.question.length > 120 ? message.question.slice(0, 117) + '...' : message.question || ''}
                      options={isStringArray(message.options) ? (message.options as string[]).map((opt, i) => ({ id: `${message.id}-opt-${i}`, label: opt, value: opt.toLowerCase().replace(/\s+/g, '_') })) : (Array.isArray(message.options) ? message.options as InteractiveOption[] : undefined)}
                      onOptionSelect={handleOptionSelect} selectedOption={message.selectedOption} allowCustomAnswer={true} onCustomAnswer={handleCustomStaticAnswer} onFocusMainInput={focusMainInput} />
                  ) : message.showHospitals ? (
                    <HospitalRecommendations specialty={message.specialty || "general"} />
                  ) : message.summary ? (
                    <MedicalSummaryCard summary={message.text || ""} summaryType={message.summaryType} />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  )}
                  <p className="text-xs mt-2 text-muted-foreground/70">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              {isUrgencyLevel && currentSpecialties.length > 0 && idx === messages.findIndex(m => m.summaryType?.toLowerCase().includes('urgency level')) && (
                <div className="flex items-start space-x-3 justify-start mt-2">
                  <div className="w-7 h-7 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0"><Bot className="w-4 h-4 text-primary" /></div>
                  <div className="max-w-[85vw] sm:max-w-xs lg:max-w-md rounded-2xl px-3 py-3 glass-card animate-fade-in">
                    <SpecialtyRecommendation specialties={currentSpecialties} />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        {isTyping && <TypingIndicator />}
        {showUserFallback && (
          <div className="max-w-xs lg:max-w-md mx-auto glass-card p-4 mt-4 animate-fade-in">
            <p className="text-sm font-medium text-foreground mb-2">I have enough information. Add more details or press 'Finish'.</p>
            <textarea className="w-full rounded-xl border border-white/10 p-2 mb-3 text-sm bg-secondary/50 text-foreground" rows={2} placeholder="Add extra details (optional)" value={userFallbackInput} onChange={e => setUserFallbackInput(e.target.value)} disabled={isTyping} />
            <button className="w-full bg-primary text-primary-foreground rounded-xl py-2 font-semibold press-scale" onClick={handleUserFallbackFinish} disabled={isTyping}>Finish and get advice</button>
          </div>
        )}
        {summaryError && <div className="w-full max-w-lg mx-auto bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-xl mb-4 text-center">{summaryError}</div>}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 glass-card rounded-none border-x-0 border-b-0 p-4">
        <div className="flex space-x-3 items-end">
          <div className="flex-1">
            <Input ref={mainInputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder={inputPlaceholder}
              className="bg-secondary/50 border-white/10 text-foreground placeholder-muted-foreground rounded-xl px-4 py-3" disabled={isTyping} />
          </div>
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-3 press-scale">
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">Rakshith AI may provide inaccurate information if you don't provide precise details.</p>
      </div>

      {flashMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <FlashMode onExit={() => setFlashMode(false)} />
        </div>
      )}
    </div>
  );
};

export default ChatArea;
