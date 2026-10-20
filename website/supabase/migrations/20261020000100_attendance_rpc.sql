-- Marking a box writes two things: the mark itself, and the record of what it
-- replaced. Doing that as two calls from the server would leave a window
-- where the mark is saved but the history is not, so the change goes through
-- a function and one transaction instead.

-- One box.
create or replace function public.set_attendance(
  p_course       text,
  p_session_date date,
  p_matric       text,
  p_fill         numeric,
  p_excused      boolean,
  p_marked_by    text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_fill    numeric;
  v_old_excused boolean;
begin
  -- What was there before, if anything.
  select a.fill, a.excused
    into v_old_fill, v_old_excused
    from public.attendance a
   where a.course = p_course
     and a.session_date = p_session_date
     and a.matric = p_matric;

  insert into public.attendance
    (course, session_date, matric, fill, excused, marked_by, marked_at)
  values
    (p_course, p_session_date, p_matric, p_fill, p_excused, p_marked_by, now())
  on conflict (course, session_date, matric) do update
    set fill      = excluded.fill,
        excused   = excluded.excused,
        marked_by = excluded.marked_by,
        marked_at = now();

  insert into public.attendance_log
    (course, session_date, matric, old_fill, old_excused, new_fill, new_excused, changed_by)
  values
    (p_course, p_session_date, p_matric, v_old_fill, v_old_excused, p_fill, p_excused, p_marked_by);
end;
$$;

-- A whole column at once, for "everyone present" and "clear this session".
create or replace function public.set_attendance_bulk(
  p_course       text,
  p_session_date date,
  p_matric       text[],
  p_fill         numeric,
  p_excused      boolean,
  p_marked_by    text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_fill    numeric;
  v_old_excused boolean;
  v_matric      text;
begin
  foreach v_matric in array p_matric loop
    select a.fill, a.excused
      into v_old_fill, v_old_excused
      from public.attendance a
     where a.course = p_course
       and a.session_date = p_session_date
       and a.matric = v_matric;

    insert into public.attendance
      (course, session_date, matric, fill, excused, marked_by, marked_at)
    values
      (p_course, p_session_date, v_matric, p_fill, p_excused, p_marked_by, now())
    on conflict (course, session_date, matric) do update
      set fill      = excluded.fill,
          excused   = excluded.excused,
          marked_by = excluded.marked_by,
          marked_at = now();

    insert into public.attendance_log
      (course, session_date, matric, old_fill, old_excused, new_fill, new_excused, changed_by)
    values
      (p_course, p_session_date, v_matric, v_old_fill, v_old_excused, p_fill, p_excused, p_marked_by);
  end loop;
end;
$$;

-- The default grant for a new function is EXECUTE to PUBLIC, which would let
-- the anon key call these directly. Only the service role may mark attendance.
revoke execute on function public.set_attendance(text, date, text, numeric, boolean, text)
  from public, anon, authenticated;
revoke execute on function public.set_attendance_bulk(text, date, text[], numeric, boolean, text)
  from public, anon, authenticated;

grant execute on function public.set_attendance(text, date, text, numeric, boolean, text)
  to service_role;
grant execute on function public.set_attendance_bulk(text, date, text[], numeric, boolean, text)
  to service_role;
