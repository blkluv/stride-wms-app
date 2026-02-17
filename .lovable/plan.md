

## Apply RLS Policy Fix for System Roles Visibility

### What We're Doing
Adding a single RLS policy to the `roles` table so that system roles (like `admin_dev`) are visible to authenticated users in frontend queries.

### Why This Is Needed
The `admin_dev` role has `tenant_id = NULL` and `is_system = true`. The existing RLS policy on `roles` only allows rows where `tenant_id = user_tenant_id()`, which filters out system roles. This prevents the `useUsers` and `usePermissions` hooks from seeing the role in normal queries.

### Migration SQL
```sql
CREATE POLICY "roles_system_visible"
ON public.roles
FOR SELECT
TO authenticated
USING (tenant_id IS NULL AND is_system = true);
```

### Verification Steps
After applying the migration:
1. Log in and confirm the Users settings page shows "admin_dev" role next to your account
2. Navigate to `/qa` (QA Center)
3. Navigate to `/admin/stripe-ops`
4. Navigate to `/admin/pricing-ops`
5. Navigate to `/decision-ledger`
6. Confirm all pages load without "Access denied"

