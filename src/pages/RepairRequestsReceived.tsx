import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  Mail, 
  Phone, 
  User, 
  Wrench,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare
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

interface RepairRequest {
  id: string;
  provider_id: string;
  client_email: string;
  client_name: string | null;
  client_phone: string | null;
  brand: string;
  model: string | null;
  description: string;
  status: 'pending' | 'contacted' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  pending: { label: 'En attente', icon: Clock, color: 'bg-yellow-500/10 text-yellow-500' },
  contacted: { label: 'Contacté', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-500' },
  in_progress: { label: 'En cours', icon: Wrench, color: 'bg-primary/10 text-primary' },
  completed: { label: 'Terminé', icon: CheckCircle, color: 'bg-success/10 text-success' },
  rejected: { label: 'Refusé', icon: XCircle, color: 'bg-destructive/10 text-destructive' },
};

const RepairRequestsReceived = () => {
  const { currentWorkspace } = useAuth();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (currentWorkspace) {
      loadRequests();
    }
  }, [currentWorkspace]);

  const loadRequests = async () => {
    if (!currentWorkspace) return;

    setLoading(true);
    
    // First, get the provider ID for this workspace
    const { data: providerData, error: providerError } = await supabase
      .from('repair_service_providers')
      .select('id')
      .eq('workspace_id', currentWorkspace.id)
      .maybeSingle();

    if (providerError || !providerData) {
      setLoading(false);
      return;
    }

    setProviderId(providerData.id);

    // Then fetch requests for this provider
    const { data, error } = await supabase
      .from('repair_requests')
      .select('*')
      .eq('provider_id', providerData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } else {
      setRequests((data || []).map(r => ({ ...r, status: r.status as RepairRequest['status'] })));
    }
    setLoading(false);
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    const { error } = await supabase
      .from('repair_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } else {
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: newStatus as RepairRequest['status'] } : r)
      );
      toast.success('Statut mis à jour');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Demandes reçues" showBack />

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !providerId ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Service non configuré</h3>
              <p className="text-sm text-muted-foreground">
                Configurez d'abord votre service de réparation dans les paramètres.
              </p>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune demande</h3>
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas encore reçu de demandes de réparation.
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
                        <Wrench className="w-4 h-4" />
                        {request.brand}
                        {request.model && <span className="text-muted-foreground font-normal">- {request.model}</span>}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(request.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                      </CardDescription>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description */}
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm">{request.description}</p>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-2 text-sm">
                    {request.client_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{request.client_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={`mailto:${request.client_email}?subject=Demande de réparation - ${request.brand}${request.model ? ` ${request.model}` : ''}`}
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
                  </div>

                  {/* Status Update */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Statut :</span>
                    <Select
                      value={request.status}
                      onValueChange={(value) => updateStatus(request.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="contacted">Contacté</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
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

export default RepairRequestsReceived;