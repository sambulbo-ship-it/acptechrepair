-- Enable realtime for all workspace tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.diagnostic_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;