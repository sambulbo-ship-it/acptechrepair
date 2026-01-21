-- Table for AI conversation history per user
CREATE TABLE public.ai_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    machine_id UUID,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for AI messages within conversations
CREATE TABLE public.ai_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    web_search_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for repair service providers (companies that offer repair services)
CREATE TABLE public.repair_service_providers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL,
    is_visible BOOLEAN NOT NULL DEFAULT false,
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    website TEXT,
    description TEXT,
    supported_brands TEXT[] DEFAULT '{}',
    supported_categories TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID
);

-- Table for repair requests from external clients
CREATE TABLE public.repair_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID NOT NULL REFERENCES public.repair_service_providers(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    brand TEXT NOT NULL,
    model TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'completed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

-- RLS for ai_conversations - users can only access their own
CREATE POLICY "Users can view their own conversations"
ON public.ai_conversations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
ON public.ai_conversations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own conversations"
ON public.ai_conversations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations"
ON public.ai_conversations FOR DELETE
USING (user_id = auth.uid());

-- RLS for ai_messages - via conversation ownership
CREATE POLICY "Users can view messages in their conversations"
ON public.ai_messages FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations"
ON public.ai_messages FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their conversations"
ON public.ai_messages FOR DELETE
USING (EXISTS (
    SELECT 1 FROM public.ai_conversations
    WHERE ai_conversations.id = ai_messages.conversation_id
    AND ai_conversations.user_id = auth.uid()
));

-- RLS for repair_service_providers
-- Anyone can view visible providers (for the public "where to repair" feature)
CREATE POLICY "Anyone can view visible providers"
ON public.repair_service_providers FOR SELECT
USING (is_visible = true);

-- Workspace admins can manage their own provider profile
CREATE POLICY "Workspace admins can manage their provider"
ON public.repair_service_providers FOR ALL
USING (is_workspace_admin(auth.uid(), workspace_id));

-- RLS for repair_requests
-- Providers can view requests sent to them
CREATE POLICY "Providers can view their requests"
ON public.repair_requests FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.repair_service_providers
    WHERE repair_service_providers.id = repair_requests.provider_id
    AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)
));

-- Anyone can create a repair request (public facing feature)
CREATE POLICY "Anyone can create repair requests"
ON public.repair_requests FOR INSERT
WITH CHECK (true);

-- Providers can update requests sent to them
CREATE POLICY "Providers can update their requests"
ON public.repair_requests FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.repair_service_providers
    WHERE repair_service_providers.id = repair_requests.provider_id
    AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)
));

-- Triggers for updated_at
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_service_providers_updated_at
BEFORE UPDATE ON public.repair_service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_requests_updated_at
BEFORE UPDATE ON public.repair_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();