
-- Restrict all remaining policies to authenticated role to eliminate anonymous access warnings

-- ai_conversations
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can create their own conversations" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.ai_conversations;
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ai_messages
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can create messages in their conversations" ON public.ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can delete messages in their conversations" ON public.ai_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.ai_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM ai_conversations WHERE ai_conversations.id = ai_messages.conversation_id AND ai_conversations.user_id = auth.uid()));

-- app_admins
DROP POLICY IF EXISTS "Only app admins can manage admins" ON public.app_admins;
CREATE POLICY "Only app admins can manage admins" ON public.app_admins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM app_admins a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "Only app admins can view admin list" ON public.app_admins;
CREATE POLICY "Only app admins can view admin list" ON public.app_admins FOR SELECT TO authenticated USING (is_app_admin(auth.uid()));

-- diagnostic_entries
DROP POLICY IF EXISTS "Members can create entries for machines in their workspace" ON public.diagnostic_entries;
CREATE POLICY "Members can create entries for machines in their workspace" ON public.diagnostic_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM machines m WHERE m.id = diagnostic_entries.machine_id AND is_workspace_member(auth.uid(), m.workspace_id)));

DROP POLICY IF EXISTS "Members can delete entries they created or admins" ON public.diagnostic_entries;
CREATE POLICY "Members can delete entries they created or admins" ON public.diagnostic_entries FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM machines m WHERE m.id = diagnostic_entries.machine_id AND is_workspace_admin(auth.uid(), m.workspace_id)));

DROP POLICY IF EXISTS "Members can update entries they created" ON public.diagnostic_entries;
CREATE POLICY "Members can update entries they created" ON public.diagnostic_entries FOR UPDATE TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Members can view entries for machines in their workspace" ON public.diagnostic_entries;
CREATE POLICY "Members can view entries for machines in their workspace" ON public.diagnostic_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM machines m WHERE m.id = diagnostic_entries.machine_id AND is_workspace_member(auth.uid(), m.workspace_id)));

-- external_repairs
DROP POLICY IF EXISTS "Admins can delete external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Admins can delete external repairs in their workspace" ON public.external_repairs FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Members can create external repairs in their workspace" ON public.external_repairs FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Members can update external repairs in their workspace" ON public.external_repairs FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view external repairs in their workspace" ON public.external_repairs;
CREATE POLICY "Members can view external repairs in their workspace" ON public.external_repairs FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- knowledge_entries
DROP POLICY IF EXISTS "Admins can delete knowledge entries in their workspace" ON public.knowledge_entries;
CREATE POLICY "Admins can delete knowledge entries in their workspace" ON public.knowledge_entries FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Members can create knowledge entries in their workspace" ON public.knowledge_entries;
CREATE POLICY "Members can create knowledge entries in their workspace" ON public.knowledge_entries FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id) AND user_id = auth.uid());

DROP POLICY IF EXISTS "Members can update their own knowledge entries" ON public.knowledge_entries;
CREATE POLICY "Members can update their own knowledge entries" ON public.knowledge_entries FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can view knowledge entries in their workspace" ON public.knowledge_entries;
CREATE POLICY "Members can view knowledge entries in their workspace" ON public.knowledge_entries FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- maintenance_schedules
DROP POLICY IF EXISTS "Admins can delete maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Admins can delete maintenance schedules in their workspace" ON public.maintenance_schedules FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "App admins can manage all maintenance schedules" ON public.maintenance_schedules;
CREATE POLICY "App admins can manage all maintenance schedules" ON public.maintenance_schedules FOR ALL TO authenticated USING (is_app_admin(auth.uid()));

DROP POLICY IF EXISTS "Members can create maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Members can create maintenance schedules in their workspace" ON public.maintenance_schedules FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Members can update maintenance schedules in their workspace" ON public.maintenance_schedules FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view maintenance schedules in their workspace" ON public.maintenance_schedules;
CREATE POLICY "Members can view maintenance schedules in their workspace" ON public.maintenance_schedules FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- notification_preferences
DROP POLICY IF EXISTS "Users can create their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can create their own notification preferences" ON public.notification_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Users can delete their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can delete their own notification preferences" ON public.notification_preferences FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());

-- pending_sync
DROP POLICY IF EXISTS "Users can create pending sync with validated workspace" ON public.pending_sync;
CREATE POLICY "Users can create pending sync with validated workspace" ON public.pending_sync FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_workspace_member(auth.uid(), workspace_id) AND ((data->>'workspace_id') IS NULL OR ((data->>'workspace_id')::uuid = workspace_id)));

DROP POLICY IF EXISTS "Users can delete their pending sync" ON public.pending_sync;
CREATE POLICY "Users can delete their pending sync" ON public.pending_sync FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their pending sync" ON public.pending_sync;
CREATE POLICY "Users can update their pending sync" ON public.pending_sync FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their pending sync" ON public.pending_sync;
CREATE POLICY "Users can view their pending sync" ON public.pending_sync FOR SELECT TO authenticated USING (user_id = auth.uid());

-- quote_requests
DROP POLICY IF EXISTS "Admins can delete quote requests in their workspace" ON public.quote_requests;
CREATE POLICY "Admins can delete quote requests in their workspace" ON public.quote_requests FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can update quote requests in their workspace" ON public.quote_requests;
CREATE POLICY "Admins can update quote requests in their workspace" ON public.quote_requests FOR UPDATE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can view quote requests in their workspace" ON public.quote_requests;
CREATE POLICY "Admins can view quote requests in their workspace" ON public.quote_requests FOR SELECT TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

-- scan_history
DROP POLICY IF EXISTS "Admins can delete scan history in their workspace" ON public.scan_history;
CREATE POLICY "Admins can delete scan history in their workspace" ON public.scan_history FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create scan history in their workspace" ON public.scan_history;
CREATE POLICY "Members can create scan history in their workspace" ON public.scan_history FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view scan history in their workspace" ON public.scan_history;
CREATE POLICY "Members can view scan history in their workspace" ON public.scan_history FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- spare_parts
DROP POLICY IF EXISTS "Admins can delete spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Admins can delete spare parts in their workspace" ON public.spare_parts FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Members can create spare parts in their workspace" ON public.spare_parts FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Members can update spare parts in their workspace" ON public.spare_parts FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view spare parts in their workspace" ON public.spare_parts;
CREATE POLICY "Members can view spare parts in their workspace" ON public.spare_parts FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- team_members
DROP POLICY IF EXISTS "Admins can delete team members in their workspace" ON public.team_members;
CREATE POLICY "Admins can delete team members in their workspace" ON public.team_members FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can add team members to their workspace" ON public.team_members;
CREATE POLICY "Members can add team members to their workspace" ON public.team_members FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update team members in their workspace" ON public.team_members;
CREATE POLICY "Members can update team members in their workspace" ON public.team_members FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view team in their workspace" ON public.team_members;
CREATE POLICY "Members can view team in their workspace" ON public.team_members FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- workspace_brands
DROP POLICY IF EXISTS "Members can create brands in their workspace" ON public.workspace_brands;
CREATE POLICY "Members can create brands in their workspace" ON public.workspace_brands FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can delete their own brands" ON public.workspace_brands;
CREATE POLICY "Members can delete their own brands" ON public.workspace_brands FOR DELETE TO authenticated USING (created_by = auth.uid() OR is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view brands in their workspace" ON public.workspace_brands;
CREATE POLICY "Members can view brands in their workspace" ON public.workspace_brands FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- workspace_members
DROP POLICY IF EXISTS "Admins can remove members from their workspace" ON public.workspace_members;
CREATE POLICY "Admins can remove members from their workspace" ON public.workspace_members FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update members in their workspace" ON public.workspace_members;
CREATE POLICY "Admins can update members in their workspace" ON public.workspace_members FOR UPDATE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view other members in their workspace" ON public.workspace_members;
CREATE POLICY "Members can view other members in their workspace" ON public.workspace_members FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Users can join workspace with invite code" ON public.workspace_members;
CREATE POLICY "Users can join workspace with invite code" ON public.workspace_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- workspace_settings
DROP POLICY IF EXISTS "Admins can insert settings for their workspace" ON public.workspace_settings;
CREATE POLICY "Admins can insert settings for their workspace" ON public.workspace_settings FOR INSERT TO authenticated WITH CHECK (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Admins can update settings in their workspace" ON public.workspace_settings;
CREATE POLICY "Admins can update settings in their workspace" ON public.workspace_settings FOR UPDATE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view settings in their workspace" ON public.workspace_settings;
CREATE POLICY "Members can view settings in their workspace" ON public.workspace_settings FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- repair_requests
DROP POLICY IF EXISTS "Only workspace members can view repair requests" ON public.repair_requests;
CREATE POLICY "Only workspace members can view repair requests" ON public.repair_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers rsp WHERE rsp.id = repair_requests.provider_id AND is_workspace_member(auth.uid(), rsp.workspace_id)));

DROP POLICY IF EXISTS "Providers can update their requests" ON public.repair_requests;
CREATE POLICY "Providers can update their requests" ON public.repair_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers WHERE repair_service_providers.id = repair_requests.provider_id AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)));

DROP POLICY IF EXISTS "Providers can view their requests" ON public.repair_requests;
CREATE POLICY "Providers can view their requests" ON public.repair_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers WHERE repair_service_providers.id = repair_requests.provider_id AND is_workspace_member(auth.uid(), repair_service_providers.workspace_id)));

DROP POLICY IF EXISTS "Workspace admins can delete repair requests" ON public.repair_requests;
CREATE POLICY "Workspace admins can delete repair requests" ON public.repair_requests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM repair_service_providers rsp WHERE rsp.id = repair_requests.provider_id AND is_workspace_admin(auth.uid(), rsp.workspace_id)));

-- repair_locations
DROP POLICY IF EXISTS "Admins can delete repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Admins can delete repair locations in their workspace" ON public.repair_locations FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Members can create repair locations in their workspace" ON public.repair_locations FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Members can update repair locations in their workspace" ON public.repair_locations FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view repair locations in their workspace" ON public.repair_locations;
CREATE POLICY "Members can view repair locations in their workspace" ON public.repair_locations FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

-- rental_transactions
DROP POLICY IF EXISTS "Admins can delete transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Admins can delete transactions in their workspace" ON public.rental_transactions FOR DELETE TO authenticated USING (is_workspace_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can create transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Members can create transactions in their workspace" ON public.rental_transactions FOR INSERT TO authenticated WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can update transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Members can update transactions in their workspace" ON public.rental_transactions FOR UPDATE TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Members can view transactions in their workspace" ON public.rental_transactions;
CREATE POLICY "Members can view transactions in their workspace" ON public.rental_transactions FOR SELECT TO authenticated USING (is_workspace_member(auth.uid(), workspace_id));
