import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Globe, Database, Trash2, Loader2, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAIDiagnostic } from '@/hooks/useAIDiagnostic';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface AIDiagnosticChatProps {
  machineCategory?: string;
  machineBrand?: string;
  machineModel?: string;
  machineName?: string;
}

const AIDiagnosticChat: React.FC<AIDiagnosticChatProps> = ({
  machineCategory,
  machineBrand,
  machineModel,
  machineName,
}) => {
  const { language } = useLanguage();
  const [input, setInput] = useState('');
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = useAIDiagnostic({
    machineCategory,
    machineBrand,
    machineModel,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message, enableWebSearch);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const t = {
    title: language === 'fr' ? 'Assistant IA Diagnostic' : 'AI Diagnostic Assistant',
    placeholder: language === 'fr' 
      ? 'Décrivez le problème ou posez une question...' 
      : 'Describe the problem or ask a question...',
    webSearch: language === 'fr' ? 'Recherche web' : 'Web search',
    localSearch: language === 'fr' ? 'Historique réparations' : 'Repair history',
    send: language === 'fr' ? 'Envoyer' : 'Send',
    clear: language === 'fr' ? 'Effacer' : 'Clear',
    context: language === 'fr' ? 'Contexte:' : 'Context:',
    privacyNotice: language === 'fr' 
      ? 'Les données sont anonymisées. Aucune information d\'entreprise n\'est partagée.' 
      : 'Data is anonymized. No company information is shared.',
    noWebSearchNote: language === 'fr'
      ? 'Par défaut, l\'IA recherche dans l\'historique des réparations anonymisé. Activez la recherche web pour des informations supplémentaires.'
      : 'By default, AI searches in anonymized repair history. Enable web search for additional information.',
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            {t.title}
          </CardTitle>
          {messages.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearMessages}
              className="h-8 px-2"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t.clear}
            </Button>
          )}
        </div>
        
        {(machineBrand || machineModel) && (
          <p className="text-sm text-muted-foreground">
            {t.context} {machineName || `${machineBrand || ''} ${machineModel || ''}`}
          </p>
        )}

        <Alert className="mt-2 bg-primary/5 border-primary/20">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-xs text-muted-foreground">
            {t.privacyNotice}
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pb-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Database className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground max-w-[250px]">
                {t.noWebSearchNote}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="text-sm text-muted-foreground">...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <Database className={cn(
                "h-4 w-4 transition-colors",
                !enableWebSearch ? "text-primary" : "text-muted-foreground"
              )} />
              <Label htmlFor="web-search" className="text-xs text-muted-foreground">
                {t.localSearch}
              </Label>
            </div>
            
            <Switch
              id="web-search"
              checked={enableWebSearch}
              onCheckedChange={setEnableWebSearch}
            />
            
            <div className="flex items-center gap-2">
              <Label htmlFor="web-search" className="text-xs text-muted-foreground">
                {t.webSearch}
              </Label>
              <Globe className={cn(
                "h-4 w-4 transition-colors",
                enableWebSearch ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
          </div>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.placeholder}
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIDiagnosticChat;
