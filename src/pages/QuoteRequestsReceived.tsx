import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  Mail, 
  Phone, 
  User, 
  Building2,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Package,
  FileText,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuoteRequest {
  id: string;
  workspace_id: string;
  machine_id: string | null;
  machine_name: string;
  machine_brand: string | null;
  machine_model: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  client_company: string | null;
  request_type: string;
  message: string;
  status: 'pending' | 'contacted' | 'quoted' | 'accepted' | 'rejected';
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500/10 text-yellow-500' },
  contacted: { label: 'Contacté', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-500' },
  quoted: { label: 'Devis envoyé', icon: FileText, color: 'bg-primary/10 text-primary' },
  accepted: { label: 'Accepté', icon: CheckCircle, color: 'bg-success/10 text-success' },
  rejected: { label: 'Refusé', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
};

const requestTypeLabels: Record<string, string> = {
  rental: 'Location',
  purchase: 'Achat',
  info: 'Information',
};

const QuoteRequestsReceived = () => {
  const { currentWorkspace } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadRequests();
    }
  }, [currentWorkspace]);

  const loadRequests = async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('workspace_id', currentWorkspace.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading quote requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } else {
      setRequests((data || []).map(r => ({ 
        ...r, 
        status: r.status as QuoteRequest['status'] 
      })));
    }
    setLoading(false);
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    const { error } = await supabase
      .from('quote_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } else {
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: newStatus as QuoteRequest['status'] } : r)
      );
      toast.success('Statut mis à jour');
    }
  };

  const startEditingNotes = (request: QuoteRequest) => {
    setEditingNotes(request.id);
    setNotesValue(request.internal_notes || '');
  };

  const saveNotes = async (requestId: string) => {
    setSavingNotes(true);
    
    const { error } = await supabase
      .from('quote_requests')
      .update({ internal_notes: notesValue || null })
      .eq('id', requestId);

    if (error) {
      console.error('Error saving notes:', error);
      toast.error('Erreur lors de la sauvegarde');
    } else {
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, internal_notes: notesValue || null } : r)
      );
      toast.success('Notes enregistrées');
      setEditingNotes(null);
    }
    
    setSavingNotes(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Demandes de devis" showBack />

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune demande</h3>
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas encore reçu de demandes de devis depuis le catalogue public.
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map(request => {
            const statusInfo = statusConfig[request.status];
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {request.machine_name}
                        {request.machine_brand && (
                          <span className="text-muted-foreground font-normal">
                            - {request.machine_brand}
                            {request.machine_model && ` ${request.machine_model}`}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(request.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {requestTypeLabels[request.request_type] || request.request_type}
                        </Badge>
                      </CardDescription>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Message */}
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm">{request.message}</p>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="font-medium text-foreground">{request.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${request.client_email}?subject=Demande de ${requestTypeLabels[request.request_type]?.toLowerCase() || 'devis'} - ${request.machine_name}`}
                        className="text-primary hover:underline"
                      >
                        {request.client_email}
                      </a>
                    </div>
                    {request.client_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${request.client_phone}`}
                          className="text-primary hover:underline"
                        >
                          {request.client_phone}
                        </a>
                      </div>
                    )}
                    {request.client_company && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{request.client_company}</span>
                      </div>
                    )}
                  </div>

                  {/* Internal Notes */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Notes internes</span>
                      {editingNotes !== request.id && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => startEditingNotes(request)}
                        >
                          Modifier
                        </Button>
                      )}
                    </div>
                    
                    {editingNotes === request.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Ajouter des notes internes..."
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => saveNotes(request.id)}
                            disabled={savingNotes}
                          >
                            {savingNotes ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Enregistrer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setEditingNotes(null)}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {request.internal_notes || 'Aucune note'}
                      </p>
                    )}
                  </div>

                  {/* Status Update */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Statut :</span>
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateStatus(request.id, value)}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="contacted">Contacté</SelectItem>
                        <SelectItem value="quoted">Devis envoyé</SelectItem>
                        <SelectItem value="accepted">Accepté</SelectItem>
                        <SelectItem value="rejected">Refusé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default QuoteRequestsReceived;
