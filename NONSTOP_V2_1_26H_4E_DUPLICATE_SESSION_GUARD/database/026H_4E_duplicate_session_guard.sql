-- NONSTOP V2.1.26H-4E
-- Duplicate Session Guard
-- Amaç:
-- 1) Aynı oyuncuya aynı maçta aynı anda ikinci açık süre session'ı açılmasını engeller.
-- 2) İlk 5 açılırken sadece match_rosters.is_starter = true olan 5 oyuncuyu açar.
-- 3) Oyuncunun açık session'ı varsa yeni session açmaz.
-- 4) Açık session kapatma fonksiyonunu güvenli hale getirir.

-- 1) Tek oyuncu session açma: açık session varsa tekrar açma
create or replace function public.nonstop_open_player_session(
  p_match_id bigint,
  p_team_id bigint,
  p_player_id bigint,
  p_quarter smallint,
  p_clock_seconds integer,
  p_game_clock character varying
)
returns void
language plpgsql
as $$
begin
  -- Eğer bu oyuncunun bu maçta açık session'ı varsa tekrar açma
  if exists (
    select 1
    from public.player_time_sessions pts
    where pts.match_id = p_match_id
      and pts.player_id = p_player_id
      and pts.end_clock_seconds is null
  ) then
    return;
  end if;

  insert into public.player_time_sessions (
    match_id,
    team_id,
    player_id,
    quarter,
    start_clock_seconds,
    start_game_clock,
    source,
    created_at
  ) values (
    p_match_id,
    p_team_id,
    p_player_id,
    p_quarter,
    p_clock_seconds,
    p_game_clock,
    'OPERATOR_WEB',
    now()
  );
end;
$$;

-- 2) İlk 5 session açma: sadece is_starter=true olanları aç
create or replace function public.nonstop_open_starter_sessions(
  p_match_id bigint,
  p_team_id bigint,
  p_quarter smallint,
  p_clock_seconds integer,
  p_game_clock character varying
)
returns void
language plpgsql
as $$
declare
  r record;
begin
  for r in
    select mr.player_id
    from public.match_rosters mr
    where mr.match_id = p_match_id
      and mr.team_id = p_team_id
      and coalesce(mr.is_starter, false) = true
    order by mr.player_id
    limit 5
  loop
    -- Oyuncunun açık session'ı varsa tekrar açma
    if not exists (
      select 1
      from public.player_time_sessions pts
      where pts.match_id = p_match_id
        and pts.player_id = r.player_id
        and pts.end_clock_seconds is null
    ) then
      insert into public.player_time_sessions (
        match_id,
        team_id,
        player_id,
        quarter,
        start_clock_seconds,
        start_game_clock,
        source,
        created_at
      ) values (
        p_match_id,
        p_team_id,
        r.player_id,
        p_quarter,
        p_clock_seconds,
        p_game_clock,
        'STARTERS',
        now()
      );
    end if;
  end loop;
end;
$$;

-- 3) Oyuncu session kapatma: sadece açık olan en son session'ı kapat
create or replace function public.nonstop_close_player_session(
  p_match_id bigint,
  p_player_id bigint,
  p_clock_seconds integer,
  p_game_clock character varying
)
returns void
language plpgsql
as $$
declare
  v_session_id bigint;
  v_start_clock integer;
  v_seconds integer;
begin
  select pts.id, pts.start_clock_seconds
  into v_session_id, v_start_clock
  from public.player_time_sessions pts
  where pts.match_id = p_match_id
    and pts.player_id = p_player_id
    and pts.end_clock_seconds is null
  order by pts.created_at desc, pts.id desc
  limit 1;

  if v_session_id is null then
    return;
  end if;

  -- Basketbol saati geri saydığı için süre = başlangıç - bitiş.
  -- Negatif çıkarsa 0'a sabitle.
  v_seconds := greatest(coalesce(v_start_clock, p_clock_seconds) - p_clock_seconds, 0);

  update public.player_time_sessions
  set
    end_clock_seconds = p_clock_seconds,
    end_game_clock = p_game_clock,
    session_seconds = v_seconds,
    closed_at = now()
  where id = v_session_id;
end;
$$;

-- 4) Maçtaki tüm açık sessionları kapatmak için yardımcı fonksiyon
create or replace function public.nonstop_close_all_open_sessions(
  p_match_id bigint,
  p_clock_seconds integer,
  p_game_clock character varying
)
returns void
language plpgsql
as $$
declare
  r record;
begin
  for r in
    select distinct pts.player_id
    from public.player_time_sessions pts
    where pts.match_id = p_match_id
      and pts.end_clock_seconds is null
  loop
    perform public.nonstop_close_player_session(
      p_match_id,
      r.player_id,
      p_clock_seconds,
      p_game_clock
    );
  end loop;
end;
$$;

-- 5) Kontrol sorguları
-- Açık kalan session var mı?
-- select player_id, count(*) as open_count
-- from public.player_time_sessions
-- where match_id = 5 and end_clock_seconds is null
-- group by player_id;

-- Oyuncu süre toplamları
-- select player_id, sum(session_seconds) as total_seconds
-- from public.player_time_sessions
-- where match_id = 5
-- group by player_id
-- order by total_seconds desc nulls last;
