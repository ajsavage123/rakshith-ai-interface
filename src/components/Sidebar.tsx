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
    <div className="h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-white/5">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Rakshith AI</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-white/5">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 press-scale rounded-xl" onClick={() => { setActiveItem("new-chat"); onNewChat(); }}>
          <MessageSquarePlus className="w-4 h-4 mr-2" /> New Chat
        </Button>
      </div>

      <nav className="flex-1 px-2 overflow-y-auto">
        <div className="mb-4">
          <div className="flex items-center mb-2 text-muted-foreground font-semibold text-xs uppercase tracking-wider px-2">
            <History className="w-4 h-4 mr-2" /> Chat History
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
            {sessions.length === 0 && <div className="text-muted-foreground text-xs px-2 py-1">No previous chats</div>}
            {sessions.map(session => (
              <div key={session.id} className="flex items-center group">
                <button onClick={() => { setActiveItem("history"); onSelectSession(session.id); }}
                  className={`flex-1 text-left px-3 py-2 rounded-xl transition-all duration-200 hover:bg-white/5 text-foreground text-sm ${currentSessionId === session.id ? 'bg-white/10 font-medium' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="truncate">
                      {(() => {
                        const firstUserMessage = session.messages.find(msg => msg.sender === 'user');
                        if (firstUserMessage?.text) return firstUserMessage.text.slice(0, 30) + (firstUserMessage.text.length > 30 ? '...' : '');
                        return session.messages[0]?.text?.slice(0, 30) + (session.messages[0]?.text?.length > 30 ? '...' : '') || 'Chat';
                      })()}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {session.createdAt instanceof Date ? session.createdAt.toLocaleDateString() : new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                {isMobile && (
                  <button onClick={() => setDeleteModalSessionId(session.id)} className="ml-2 p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {menuItems.slice(2).map((item) => (
          <button key={item.id} onClick={() => { setActiveItem(item.id); if (item.id === 'settings') setShowSettings(true); }}
            className={`w-full flex items-center px-3 py-2 mb-1 rounded-xl transition-all duration-200 hover:bg-white/5 ${activeItem === item.id ? 'bg-white/10' : ''} text-foreground`}>
            <item.icon className="w-4 h-4 mr-3 text-muted-foreground" />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="text-xs text-muted-foreground">Rakshith AI v1.0</div>
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
