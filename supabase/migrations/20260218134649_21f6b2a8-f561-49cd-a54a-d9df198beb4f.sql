
-- Allow anonymous read access to rental_sale_config for public catalog
CREATE POLICY "Public can view available rental/sale items"
ON public.rental_sale_config
FOR SELECT
TO anon
USING (
  available_for_rental = true OR available_for_sale = true
);

-- Allow anonymous read access to machines for public catalog (only operational, only safe fields via view)
CREATE POLICY "Public can view operational machines"
ON public.machines
FOR SELECT
TO anon
USING (status = 'operational');

-- Allow anonymous read access to workspaces basic info
CREATE POLICY "Public can view workspace info"
ON public.workspaces
FOR SELECT
TO anon
USING (true);

-- Allow anonymous read access to repair_service_providers for contact info
CREATE POLICY "Public can view visible repair providers"
ON public.repair_service_providers
FOR SELECT
TO anon
USING (is_visible = true);
