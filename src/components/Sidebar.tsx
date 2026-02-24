import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, History, Settings, HelpCircle, Info, X, Trash2 } from "lucide-react";
import { ChatSession } from "@/lib/storage";

interface SidebarProps {
  onClose: () => void;
  sessions: ChatSession[];
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

const Sidebar = ({ onClose, sessions, onNewChat, onSelectSession, onDeleteSession, currentSessionId }: SidebarProps) => {
  const [activeItem, setActiveItem] = useState("new-chat");
  const [deleteModalSessionId, setDeleteModalSessionId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useIsMobile();

  const menuItems = [
    { id: "new-chat", label: "New Chat", icon: MessageSquarePlus },
    { id: "history", label: "Chat History", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "help", label: "Help", icon: HelpCircle },
    { id: "about", label: "About", icon: Info },
  ];

  return (
    <div className="h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-white/8 backdrop-blur-xl">
      <div className="px-6 py-5 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/40 to-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <span className="text-primary font-bold text-sm">R</span>
          </div>
          <h2 className="text-base font-semibold text-foreground">Rakshith</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-white/8 rounded-lg">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-3">
        <Button className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 text-primary-foreground transition-all duration-300 press-scale rounded-lg font-medium shadow-lg shadow-primary/20" onClick={() => { setActiveItem("new-chat"); onNewChat(); }}>
          <MessageSquarePlus className="w-4 h-4 mr-2" /> New Chat
        </Button>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto scrollbar-hide">
        <div className="mb-6">
          <div className="flex items-center mb-3 text-muted-foreground/70 font-semibold text-xs uppercase tracking-wider px-3">
            <History className="w-3.5 h-3.5 mr-2" /> History
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
            {sessions.length === 0 && <div className="text-muted-foreground/60 text-xs px-3 py-2">No chats yet</div>}
            {sessions.map(session => (
              <div key={session.id} className="flex items-center group">
                <button onClick={() => { setActiveItem("history"); onSelectSession(session.id); }}
                  className={`flex-1 text-left px-3 py-2.5 rounded-lg transition-all duration-200 text-foreground text-sm
                  ${currentSessionId === session.id 
                    ? 'bg-primary/15 border border-primary/30 font-medium shadow-md shadow-primary/5' 
                    : 'hover:bg-white/6 border border-transparent hover:border-white/8'
                  }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">
                      {(() => {
                        const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
                        if (firstUserMessage?.text) return firstUserMessage.text.slice(0, 25) + (firstUserMessage.text.length > 25 ? '...' : '');
                        return session.messages[0]?.text?.slice(0, 25) + (session.messages[0]?.text?.length > 25 ? '...' : '') || 'Chat';
                      })()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground/60 mt-1 block">
                    {session.createdAt instanceof Date ? session.createdAt.toLocaleDateString() : new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </button>
                {isMobile && (
                  <button onClick={() => setDeleteModalSessionId(session.id)} className="ml-2 p-1.5 text-muted-foreground/60 hover:text-destructive/80 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {menuItems.slice(2).map((item) => (
          <button key={item.id} onClick={() => { setActiveItem(item.id); if (item.id === 'settings') setShowSettings(true); }}
            className={`w-full flex items-center px-3 py-2.5 mb-1 rounded-lg transition-all duration-200 text-foreground text-sm
            ${activeItem === item.id ? 'bg-white/8 border border-white/12' : 'hover:bg-white/5 border border-transparent'}`}>
            <item.icon className="w-4 h-4 mr-3 text-muted-foreground/70" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-white/8 space-y-2">
        <div className="text-xs text-muted-foreground/60 font-medium">Rakshith AI v1.0</div>
      </div>

      {deleteModalSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-80">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Delete Chat</h3>
            <p className="text-muted-foreground mb-6">Are you sure you want to delete this chat?</p>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setDeleteModalSessionId(null)} className="bg-secondary text-secondary-foreground press-scale">Cancel</Button>
              <Button onClick={() => { onDeleteSession(deleteModalSessionId); setDeleteModalSessionId(null); }} className="bg-destructive text-destructive-foreground press-scale">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between"><span className="text-foreground">Dark Mode</span><input type="checkbox" className="form-checkbox h-5 w-5 text-primary" disabled checked /></div>
              <div className="flex items-center justify-between"><span className="text-foreground">Language</span><select className="rounded-lg bg-secondary border-white/10 text-foreground" disabled><option>English</option></select></div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowSettings(false)} className="bg-primary text-primary-foreground press-scale">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
