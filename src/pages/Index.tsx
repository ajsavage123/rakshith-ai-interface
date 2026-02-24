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
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden mr-2 hover:bg-white/5 text-muted-foreground">
                <Menu className="w-5 h-5" />
              </Button>
              <img src={rakshithShield} alt="Rakshith Shield" className="h-8 w-8 mr-2" />
              <span className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">RAKSHITH 360</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground hover:bg-white/5 press-scale">
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
      <div className="ambient-glow w-96 h-96 bg-primary -top-48 -right-48" />
      <div className="text-center text-foreground relative z-10">
        <h1 className="text-2xl font-bold mb-4">Welcome to Rakshith 360</h1>
        <p className="mb-2 text-muted-foreground">User: {user.email}</p>
        {error && <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">{error}</div>}
        <div className="space-y-3">
          <Button onClick={handleStartChat} disabled={loadingSessions} className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground press-scale">
            {loadingSessions ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
            {loadingSessions ? 'Loading...' : 'Start Medical Chat'}
          </Button>
          <Button onClick={logout} variant="outline" className="w-full max-w-xs text-foreground border-white/10 hover:bg-white/5 press-scale">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
