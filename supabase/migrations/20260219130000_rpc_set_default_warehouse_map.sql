-- Atomic default-map swap for a warehouse.
-- Ensures we never leave a warehouse with zero defaults due to a partial two-step update.

CREATE OR REPLACE FUNCTION public.rpc_set_default_warehouse_map(
  p_warehouse_id UUID,
  p_map_id UUID
)
RETURNS public.warehouse_maps
LANGUAGE plpgsql
AS $$
DECLARE
  v_map public.warehouse_maps;
BEGIN
  -- Validate map belongs to the warehouse + tenant context.
  SELECT *
  INTO v_map
  FROM public.warehouse_maps wm
  WHERE wm.id = p_map_id
    AND wm.warehouse_id = p_warehouse_id
    AND wm.tenant_id = public.user_tenant_id();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Map % not found for warehouse %', p_map_id, p_warehouse_id;
  END IF;

  -- Single statement: sets exactly one default at end-of-statement.
  UPDATE public.warehouse_maps wm
  SET
    is_default = (wm.id = p_map_id),
    updated_by = auth.uid()
  WHERE wm.tenant_id = public.user_tenant_id()
    AND wm.warehouse_id = p_warehouse_id;

  SELECT *
  INTO v_map
  FROM public.warehouse_maps wm
  WHERE wm.id = p_map_id;

  RETURN v_map;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_set_default_warehouse_map(UUID, UUID) TO authenticated;

