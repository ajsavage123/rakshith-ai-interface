import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/LoginForm";
import ChatArea from "@/components/ChatArea";
import Sidebar from "@/components/Sidebar";
import OnboardingFlow from "@/components/OnboardingFlow";
import { Loader2, LogOut, MessageCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storageService, ChatSession } from "@/lib/storage";
import { generateUUID } from "@/lib/uuid";
import rakshithShield from "@/assets/rakshith360-shield.svg";

const Index = () => {
  const { user, initializing, logout } = useAuth();
  const [testState, setTestState] = useState("loading");
  const [showChat, setShowChat] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => { setTestState("mounted"); }, []);

  useEffect(() => {
    if (user && !showOnboarding && checkingOnboarding) {
      const checkOnboarding = async () => {
        setCheckingOnboarding(true);
        const completed = storageService.isOnboardingCompleted(user.uid);
        if (!completed) { setShowOnboarding(true); } else { await handleStartChat(); }
        setCheckingOnboarding(false);
      };
      checkOnboarding();
    }
  }, [user, showOnboarding, checkingOnboarding]);

  const handleOnboardingComplete = async () => {
    if (user) {
      storageService.saveOnboardingCompleted(user.uid);
      setShowOnboarding(false);
      setCheckingOnboarding(false);
      await handleStartChat();
    }
  };

  const handleStartChat = async () => {
    if (!user) return;
    setError(null);
    try {
      const newSession: ChatSession = {
        id: generateUUID(), userId: user.uid, title: "New Consultation",
        messages: [{ id: 1, text: "Hello! I'm Rakshith AI, your virtual medical assistant. I'll help you assess your symptoms and provide appropriate guidance. What symptoms are you experiencing?", sender: "ai", timestamp: new Date() }],
        createdAt: new Date(), updatedAt: new Date()
      };
      await storageService.saveChatSession(newSession);
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setShowChat(true);
    } catch (error) { setError('Failed to create chat session'); }
  };

  const handleUpdateSession = async (updatedSession: ChatSession) => {
    try {
      await storageService.saveChatSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    } catch (error) { console.error('Error updating session:', error); }
  };

  const handleSelectSession = (sessionId: string) => { setCurrentSessionId(sessionId); setShowChat(true); };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    try {
      await storageService.deleteChatSession(sessionId, user.uid);
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(remainingSessions);
      if (currentSessionId === sessionId) {
        if (remainingSessions.length > 0) { setCurrentSessionId(remainingSessions[0].id); } else { setCurrentSessionId(null); setShowChat(false); }
      }
    } catch (error) { console.error('Error deleting session:', error); }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginForm />;
  if (showOnboarding) return <OnboardingFlow onComplete={handleOnboardingComplete} />;

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showChat && currentSessionId) {
    return (
      <div className="h-screen bg-background flex transition-colors duration-300 overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} w-64`}>
          <Sidebar onClose={() => setSidebarOpen(false)} sessions={sessions} onNewChat={handleStartChat} onSelectSession={handleSelectSession} onDeleteSession={handleDeleteSession} currentSessionId={currentSessionId} />
        </div>

        <div className="flex-1 flex flex-col h-screen">
          <header className="flex-shrink-0 glass-card rounded-none border-x-0 border-t-0 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground/70 hover:text-foreground hover:bg-white/8 rounded-lg transition-all">
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                  <img src={rakshithShield} alt="Rakshith Shield" className="h-5 w-5" />
                </div>
                <span className="text-base sm:text-lg font-bold text-primary/95">Rakshith 360</span>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm text-muted-foreground/70 hidden sm:block">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground/70 hover:text-foreground hover:bg-white/8 rounded-lg transition-all press-scale">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          {error && (
            <div className="flex-shrink-0 bg-destructive/10 border-b border-destructive/20 px-4 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-destructive">{error}</span>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-destructive">×</Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <ChatArea sessionId={currentSessionId} onUpdateSession={handleUpdateSession} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Subtle ambient glows */}
      <div className="ambient-glow w-80 h-80 bg-primary/30 -top-40 -right-32" />
      <div className="ambient-glow w-72 h-72 bg-primary/20 -bottom-32 -left-36" />
      <div className="text-center text-foreground relative z-10 px-4">
        <div className="mb-8 w-24 h-24 mx-auto rounded-2xl flex items-center justify-center border border-primary/30 bg-gradient-to-br from-primary/25 to-primary/10 shadow-lg shadow-primary/10">
          <img src={rakshithShield} alt="Rakshith" className="w-14 h-14" />
        </div>
        <h1 className="text-4xl font-bold mb-3 text-balance">Welcome to Rakshith AI</h1>
        <p className="mb-2 text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">Your intelligent medical guidance assistant. Start a consultation for personalized health insights.</p>
        <p className="mb-8 text-sm text-muted-foreground/60">{user.email}</p>
        {error && <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive/90 text-sm">{error}</div>}
        <div className="space-y-3 flex flex-col items-center">
          <Button onClick={handleStartChat} disabled={loadingSessions} className="w-full max-w-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground press-scale rounded-lg py-3 font-semibold shadow-lg shadow-primary/20 transition-all duration-200">
            {loadingSessions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
            {loadingSessions ? 'Loading...' : 'Start Medical Chat'}
          </Button>
          <Button onClick={logout} variant="outline" className="w-full max-w-xs text-foreground border border-white/10 hover:bg-white/5 rounded-lg py-3 font-semibold transition-all press-scale">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
