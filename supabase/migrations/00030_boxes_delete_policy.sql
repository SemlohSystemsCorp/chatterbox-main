-- Allow box owners to delete their boxes
create policy "Box owners can delete their box"
  on public.boxes for delete
  using (owner_id = auth.uid());
