import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  Loader2, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Globe, 
  Database,
  ChevronRight,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  web_search_enabled: boolean;
  created_at: string;
}

const AIAssistant = () => {
  const { t } = useLanguage();
  const { user, currentWorkspace } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (user && currentWorkspace) {
      loadConversations();
    }
  }, [user, currentWorkspace]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!currentWorkspace) return;
    
    setLoadingConversations(true);
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
    } else {
      setConversations(data || []);
    }
    setLoadingConversations(false);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
    } else {
      setMessages((data || []).map(m => ({ ...m, role: m.role as 'user' | 'assistant' })));
    }
  };

  const createNewConversation = async () => {
    if (!user || !currentWorkspace) return null;

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: user.id,
        workspace_id: currentWorkspace.id,
        title: 'Nouvelle conversation',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast.error('Erreur lors de la création de la conversation');
      return null;
    }

    setConversations(prev => [data, ...prev]);
    setCurrentConversation(data);
    setMessages([]);
    setHistoryOpen(false);
    return data;
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Erreur lors de la suppression');
    } else {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
      toast.success('Conversation supprimée');
    }
  };

  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId);

    setConversations(prev => 
      prev.map(c => c.id === conversationId ? { ...c, title } : c)
    );
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => prev ? { ...prev, title } : null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let conversation = currentConversation;
    const isNewConversation = !conversation;

    // Create new conversation if needed
    if (!conversation) {
      conversation = await createNewConversation();
      if (!conversation) return;
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      web_search_enabled: webSearchEnabled,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // Save user message to DB
      const { data: savedUserMsg, error: userMsgError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'user',
          content: userMessage,
          web_search_enabled: webSearchEnabled,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      // Update with real ID
      setMessages(prev => prev.map(m => 
        m.id === tempUserMessage.id ? { ...savedUserMsg, role: savedUserMsg.role as 'user' | 'assistant' } : m
      ));

      // Update title if first message
      if (isNewConversation) {
        updateConversationTitle(conversation.id, userMessage);
      }

      // Call AI endpoint
      const response = await supabase.functions.invoke('ai-diagnostic', {
        body: {
          message: userMessage,
          enableWebSearch: webSearchEnabled,
        },
      });

      if (response.error) throw response.error;

      const aiContent = response.data?.response || 'Désolé, je n\'ai pas pu générer une réponse.';

      // Save AI message to DB
      const { data: savedAiMsg, error: aiMsgError } = await supabase
        .from('ai_messages')
        .insert({
          conversation_id: conversation.id,
          role: 'assistant',
          content: aiContent,
          web_search_enabled: webSearchEnabled,
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      setMessages(prev => [...prev, { ...savedAiMsg, role: savedAiMsg.role as 'user' | 'assistant' }]);

      // Update conversation updated_at
      await supabase
        .from('ai_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Assistant IA" showBack />
      
      {/* History Sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-3 right-4 z-20">
            <History className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Historique</SheetTitle>
            <SheetDescription>
              Vos conversations précédentes
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            <Button 
              onClick={createNewConversation} 
              className="w-full gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Nouvelle conversation
            </Button>
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 pr-4">
                {loadingConversations ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucune conversation
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <div 
                      key={conv.id}
                      className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                        currentConversation?.id === conv.id 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      onClick={() => {
                        setCurrentConversation(conv);
                        setHistoryOpen(false);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conv.title || 'Sans titre'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(conv.updated_at), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteConversation(conv.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Assistant IA</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Posez vos questions sur les pannes et réparations. 
                L'IA recherche dans l'historique anonymisé des réparations.
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="w-4 h-4" />
                <span>Recherche dans les réparations par défaut</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-foreground rounded-bl-md'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <Bot className="w-3 h-3" />
                        <span>Assistant</span>
                        {message.web_search_enabled && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Globe className="w-3 h-3" />
                            Web
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary p-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Réflexion...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border p-4 bg-background">
          <div className="flex items-center gap-2 mb-3">
            <Switch
              id="web-search"
              checked={webSearchEnabled}
              onCheckedChange={setWebSearchEnabled}
            />
            <Label htmlFor="web-search" className="text-sm flex items-center gap-2">
              {webSearchEnabled ? (
                <>
                  <Globe className="w-4 h-4 text-blue-400" />
                  Recherche web activée
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-muted-foreground" />
                  Recherche dans les réparations uniquement
                </>
              )}
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Décrivez votre problème..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={loading || !input.trim()}
              size="icon"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AIAssistant;