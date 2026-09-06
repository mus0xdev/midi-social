create or replace function public.protect_profile_security() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id;

  -- Client updates cannot change admin or moderation fields.
  if auth.uid() is not null and not exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) then
    new.is_admin := old.is_admin;
    new.account_status := old.account_status;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields on public.profiles;
drop trigger if exists protect_profile_security_fields on public.profiles;
create trigger protect_profile_security_fields before update on public.profiles for each row execute procedure public.protect_profile_security();

-- Apply the requested initial admin assignment after the protection fix.
update public.profiles
set is_admin = true
where id = '80bf75e2-b715-42bb-9628-a0359cfdcac6';
