--
-- PostgreSQL database dump
--

\restrict h94Q3AsFz2dofSdBTjWM4dqgxHoEDiRkHHJ1cUHaLcM9xxPHfJhjI8kxC2IEB7o

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-01-10 16:25:48

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 929 (class 1247 OID 17736)
-- Name: collection_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collection_type AS ENUM (
    'EP',
    'Album',
    'Single'
);


--
-- TOC entry 252 (class 1255 OID 17821)
-- Name: check_band_member_limit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_band_member_limit(band_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM band_members WHERE band_id = band_id
  ) >= 10 THEN
    RAISE EXCEPTION 'Band member limit reached';
  END IF;
END;
$$;


--
-- TOC entry 254 (class 1255 OID 17823)
-- Name: check_band_tag_limit(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_band_tag_limit(p_band_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM tags
    WHERE band_id = p_band_id
  ) >= 10 THEN
    RAISE EXCEPTION 'Maximum tags per band reached';
  END IF;
END;
$$;


--
-- TOC entry 255 (class 1255 OID 17824)
-- Name: check_song_tag_limit(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_song_tag_limit(p_song_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM song_tags
    WHERE song_id = p_song_id
  ) >= 3 THEN
    RAISE EXCEPTION 'Maximum tags per song reached';
  END IF;
END;
$$;


--
-- TOC entry 253 (class 1255 OID 17822)
-- Name: check_user_bands_limit(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_bands_limit(user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM band_members WHERE user_id = user_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum bands per user reached';
  END IF;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16569)
-- Name: band_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.band_members (
    band_member_id integer NOT NULL,
    user_id integer,
    band_id integer
);


--
-- TOC entry 218 (class 1259 OID 16572)
-- Name: band_members_band_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.band_members_band_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 218
-- Name: band_members_band_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.band_members_band_member_id_seq OWNED BY public.band_members.band_member_id;


--
-- TOC entry 219 (class 1259 OID 16573)
-- Name: bands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bands (
    band_id integer NOT NULL,
    name character varying(128) NOT NULL,
    invite_code character varying(12),
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 220 (class 1259 OID 16577)
-- Name: bands_band_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bands_band_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 220
-- Name: bands_band_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bands_band_id_seq OWNED BY public.bands.band_id;


--
-- TOC entry 249 (class 1259 OID 17754)
-- Name: collection_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collection_songs (
    id integer NOT NULL,
    collection_id integer,
    song_id integer,
    "position" smallint NOT NULL,
    CONSTRAINT collection_songs_position_check CHECK (("position" > 0))
);


--
-- TOC entry 248 (class 1259 OID 17753)
-- Name: collection_songs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.collection_songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 248
-- Name: collection_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.collection_songs_id_seq OWNED BY public.collection_songs.id;


--
-- TOC entry 247 (class 1259 OID 17744)
-- Name: collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.collections (
    collection_id integer NOT NULL,
    band_id integer NOT NULL,
    title character varying(255) NOT NULL,
    type public.collection_type,
    release_date date,
    cover_url text,
    created_by integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 246 (class 1259 OID 17743)
-- Name: collections_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.collections_collection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 246
-- Name: collections_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.collections_collection_id_seq OWNED BY public.collections.collection_id;


--
-- TOC entry 251 (class 1259 OID 17801)
-- Name: event_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_songs (
    event_song_id integer NOT NULL,
    event_id integer NOT NULL,
    song_id integer NOT NULL
);


--
-- TOC entry 250 (class 1259 OID 17800)
-- Name: event_songs_event_song_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_songs_event_song_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 250
-- Name: event_songs_event_song_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_songs_event_song_id_seq OWNED BY public.event_songs.event_song_id;


--
-- TOC entry 221 (class 1259 OID 16578)
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(20),
    date_time timestamp without time zone NOT NULL,
    description text,
    band_id integer NOT NULL,
    place character varying(255),
    length interval,
    CONSTRAINT events_type_check CHECK (((type)::text = ANY (ARRAY[('rehearsal'::character varying)::text, ('concert'::character varying)::text, ('recording'::character varying)::text])))
);


--
-- TOC entry 222 (class 1259 OID 16584)
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 222
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- TOC entry 223 (class 1259 OID 16585)
-- Name: member_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_roles (
    band_member_id integer NOT NULL,
    role_id integer NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 16588)
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    message_id integer NOT NULL,
    text text NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    band_member_id integer NOT NULL
);


--
-- TOC entry 225 (class 1259 OID 16594)
-- Name: messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 225
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_message_id_seq OWNED BY public.messages.message_id;


--
-- TOC entry 226 (class 1259 OID 16595)
-- Name: musideas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.musideas (
    idea_id integer NOT NULL,
    band_member_id integer NOT NULL,
    title character varying(255) NOT NULL,
    key character varying(4),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    length time without time zone,
    bpm smallint,
    audiourl text,
    text_tabs text,
    visibility character varying(10) DEFAULT 'private'::character varying,
    CONSTRAINT musideas_key_check CHECK (((key)::text = ANY (ARRAY[('C'::character varying)::text, ('C#'::character varying)::text, ('D'::character varying)::text, ('D#'::character varying)::text, ('E'::character varying)::text, ('F'::character varying)::text, ('F#'::character varying)::text, ('G'::character varying)::text, ('G#'::character varying)::text, ('A'::character varying)::text, ('A#'::character varying)::text, ('B'::character varying)::text, ('Cm'::character varying)::text, ('C#m'::character varying)::text, ('Dm'::character varying)::text, ('D#m'::character varying)::text, ('Em'::character varying)::text, ('Fm'::character varying)::text, ('F#m'::character varying)::text, ('Gm'::character varying)::text, ('G#m'::character varying)::text, ('Am'::character varying)::text, ('A#m'::character varying)::text, ('Bm'::character varying)::text]))),
    CONSTRAINT musideas_visibility_check CHECK (((visibility)::text = ANY (ARRAY[('private'::character varying)::text, ('band'::character varying)::text])))
);


--
-- TOC entry 227 (class 1259 OID 16604)
-- Name: musideas_idea_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.musideas_idea_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 227
-- Name: musideas_idea_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.musideas_idea_id_seq OWNED BY public.musideas.idea_id;


--
-- TOC entry 228 (class 1259 OID 16605)
-- Name: practice_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.practice_sessions (
    practice_session_id integer NOT NULL,
    length interval NOT NULL,
    notes text,
    started_at timestamp without time zone,
    user_id integer NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 16610)
-- Name: practice_sessions_practice_session_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.practice_sessions_practice_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 229
-- Name: practice_sessions_practice_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_sessions_practice_session_id_seq OWNED BY public.practice_sessions.practice_session_id;


--
-- TOC entry 230 (class 1259 OID 16611)
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    title character varying(45)
);


--
-- TOC entry 231 (class 1259 OID 16614)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 231
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 232 (class 1259 OID 16615)
-- Name: setlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setlists (
    setlist_id integer NOT NULL,
    title character varying(128) NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 16618)
-- Name: setlists_setlist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.setlists_setlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 233
-- Name: setlists_setlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.setlists_setlist_id_seq OWNED BY public.setlists.setlist_id;


--
-- TOC entry 234 (class 1259 OID 16619)
-- Name: setlists_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setlists_songs (
    setlists_songs_id integer NOT NULL,
    setlist_id integer NOT NULL,
    song_id integer NOT NULL,
    "position" smallint NOT NULL
);


--
-- TOC entry 235 (class 1259 OID 16622)
-- Name: setlists_songs_setlists_songs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.setlists_songs_setlists_songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 235
-- Name: setlists_songs_setlists_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.setlists_songs_setlists_songs_id_seq OWNED BY public.setlists_songs.setlists_songs_id;


--
-- TOC entry 245 (class 1259 OID 17716)
-- Name: song_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_tags (
    song_tag_id integer NOT NULL,
    song_id integer NOT NULL,
    tag_id integer NOT NULL
);


--
-- TOC entry 244 (class 1259 OID 17715)
-- Name: song_tags_song_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.song_tags_song_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 244
-- Name: song_tags_song_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.song_tags_song_tag_id_seq OWNED BY public.song_tags.song_tag_id;


--
-- TOC entry 236 (class 1259 OID 16623)
-- Name: songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.songs (
    song_id integer NOT NULL,
    title character varying(255) NOT NULL,
    key character varying(4),
    length interval,
    created_at timestamp without time zone DEFAULT now(),
    notes text,
    status character varying(20),
    bpm smallint,
    cloudurl text,
    band_id integer NOT NULL,
    CONSTRAINT songs_key_check CHECK (((key)::text = ANY (ARRAY[('C'::character varying)::text, ('C#'::character varying)::text, ('D'::character varying)::text, ('D#'::character varying)::text, ('E'::character varying)::text, ('F'::character varying)::text, ('F#'::character varying)::text, ('G'::character varying)::text, ('G#'::character varying)::text, ('A'::character varying)::text, ('A#'::character varying)::text, ('B'::character varying)::text, ('Cm'::character varying)::text, ('C#m'::character varying)::text, ('Dm'::character varying)::text, ('D#m'::character varying)::text, ('Em'::character varying)::text, ('Fm'::character varying)::text, ('F#m'::character varying)::text, ('Gm'::character varying)::text, ('G#m'::character varying)::text, ('Am'::character varying)::text, ('A#m'::character varying)::text, ('Bm'::character varying)::text]))),
    CONSTRAINT songs_status_check CHECK (((status)::text = ANY (ARRAY['draft'::text, 'finished'::text, 'rehearsed'::text])))
);


--
-- TOC entry 237 (class 1259 OID 16631)
-- Name: songs_song_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.songs_song_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 237
-- Name: songs_song_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.songs_song_id_seq OWNED BY public.songs.song_id;


--
-- TOC entry 243 (class 1259 OID 17707)
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    tag_id integer NOT NULL,
    name character varying(60) NOT NULL,
    band_id integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT now(),
    color character varying(7)
);


--
-- TOC entry 242 (class 1259 OID 17706)
-- Name: tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tags_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 242
-- Name: tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_tag_id_seq OWNED BY public.tags.tag_id;


--
-- TOC entry 238 (class 1259 OID 16632)
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    task_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    due_date date,
    band_member_id integer NOT NULL
);


--
-- TOC entry 239 (class 1259 OID 16637)
-- Name: tasks_task_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 239
-- Name: tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_task_id_seq OWNED BY public.tasks.task_id;


--
-- TOC entry 240 (class 1259 OID 16638)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    firebase_uid character varying(128) NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    photourl text DEFAULT 'https://static.vecteezy.com/system/resources/previews/013/360/247/non_2x/default-avatar-photo-icon-social-media-profile-sign-symbol-vector.jpg'::text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 241 (class 1259 OID 16644)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 241
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4833 (class 2604 OID 16645)
-- Name: band_members band_member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members ALTER COLUMN band_member_id SET DEFAULT nextval('public.band_members_band_member_id_seq'::regclass);


--
-- TOC entry 4834 (class 2604 OID 16646)
-- Name: bands band_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands ALTER COLUMN band_id SET DEFAULT nextval('public.bands_band_id_seq'::regclass);


--
-- TOC entry 4857 (class 2604 OID 17757)
-- Name: collection_songs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs ALTER COLUMN id SET DEFAULT nextval('public.collection_songs_id_seq'::regclass);


--
-- TOC entry 4855 (class 2604 OID 17747)
-- Name: collections collection_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections ALTER COLUMN collection_id SET DEFAULT nextval('public.collections_collection_id_seq'::regclass);


--
-- TOC entry 4858 (class 2604 OID 17804)
-- Name: event_songs event_song_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_songs ALTER COLUMN event_song_id SET DEFAULT nextval('public.event_songs_event_song_id_seq'::regclass);


--
-- TOC entry 4836 (class 2604 OID 16647)
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 16648)
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- TOC entry 4839 (class 2604 OID 16649)
-- Name: musideas idea_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas ALTER COLUMN idea_id SET DEFAULT nextval('public.musideas_idea_id_seq'::regclass);


--
-- TOC entry 4842 (class 2604 OID 16650)
-- Name: practice_sessions practice_session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions ALTER COLUMN practice_session_id SET DEFAULT nextval('public.practice_sessions_practice_session_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 16651)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 16652)
-- Name: setlists setlist_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists ALTER COLUMN setlist_id SET DEFAULT nextval('public.setlists_setlist_id_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 16653)
-- Name: setlists_songs setlists_songs_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs ALTER COLUMN setlists_songs_id SET DEFAULT nextval('public.setlists_songs_setlists_songs_id_seq'::regclass);


--
-- TOC entry 4854 (class 2604 OID 17719)
-- Name: song_tags song_tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags ALTER COLUMN song_tag_id SET DEFAULT nextval('public.song_tags_song_tag_id_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 16654)
-- Name: songs song_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs ALTER COLUMN song_id SET DEFAULT nextval('public.songs_song_id_seq'::regclass);


--
-- TOC entry 4852 (class 2604 OID 17710)
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 16655)
-- Name: tasks task_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN task_id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);


--
-- TOC entry 4849 (class 2604 OID 16656)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4866 (class 2606 OID 16658)
-- Name: band_members band_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT band_members_pkey PRIMARY KEY (band_member_id);


--
-- TOC entry 4871 (class 2606 OID 16660)
-- Name: bands bands_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands
    ADD CONSTRAINT bands_invite_code_key UNIQUE (invite_code);


--
-- TOC entry 4873 (class 2606 OID 16662)
-- Name: bands bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands
    ADD CONSTRAINT bands_pkey PRIMARY KEY (band_id);


--
-- TOC entry 4915 (class 2606 OID 17764)
-- Name: collection_songs collection_songs_collection_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_position_key UNIQUE (collection_id, "position");


--
-- TOC entry 4917 (class 2606 OID 17762)
-- Name: collection_songs collection_songs_collection_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_song_id_key UNIQUE (collection_id, song_id);


--
-- TOC entry 4919 (class 2606 OID 17760)
-- Name: collection_songs collection_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_pkey PRIMARY KEY (id);


--
-- TOC entry 4913 (class 2606 OID 17752)
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (collection_id);


--
-- TOC entry 4921 (class 2606 OID 17806)
-- Name: event_songs event_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_songs
    ADD CONSTRAINT event_songs_pkey PRIMARY KEY (event_song_id);


--
-- TOC entry 4875 (class 2606 OID 16664)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 4877 (class 2606 OID 16666)
-- Name: member_roles member_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT member_roles_pkey PRIMARY KEY (band_member_id, role_id);


--
-- TOC entry 4880 (class 2606 OID 16668)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4882 (class 2606 OID 16670)
-- Name: musideas musideas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas
    ADD CONSTRAINT musideas_pkey PRIMARY KEY (idea_id);


--
-- TOC entry 4884 (class 2606 OID 16672)
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (practice_session_id);


--
-- TOC entry 4886 (class 2606 OID 16674)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4888 (class 2606 OID 16676)
-- Name: roles roles_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_title_key UNIQUE (title);


--
-- TOC entry 4890 (class 2606 OID 16678)
-- Name: setlists setlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_pkey PRIMARY KEY (setlist_id);


--
-- TOC entry 4892 (class 2606 OID 16680)
-- Name: setlists_songs setlists_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT setlists_songs_pkey PRIMARY KEY (setlists_songs_id);


--
-- TOC entry 4911 (class 2606 OID 17721)
-- Name: song_tags song_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_pkey PRIMARY KEY (song_tag_id);


--
-- TOC entry 4896 (class 2606 OID 16682)
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (song_id);


--
-- TOC entry 4907 (class 2606 OID 17713)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- TOC entry 4898 (class 2606 OID 16684)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (task_id);


--
-- TOC entry 4869 (class 2606 OID 16686)
-- Name: band_members unique_band_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT unique_band_member UNIQUE (user_id, band_id);


--
-- TOC entry 4925 (class 2606 OID 17808)
-- Name: event_songs unique_event_song; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_songs
    ADD CONSTRAINT unique_event_song UNIQUE (event_id, song_id);


--
-- TOC entry 4894 (class 2606 OID 16688)
-- Name: setlists_songs unique_setlist_song; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT unique_setlist_song UNIQUE (setlist_id, song_id);


--
-- TOC entry 4901 (class 2606 OID 16690)
-- Name: users users_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);


--
-- TOC entry 4903 (class 2606 OID 16692)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4867 (class 1259 OID 17070)
-- Name: idx_band_members_user_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_band_members_user_band ON public.band_members USING btree (user_id, band_id);


--
-- TOC entry 4922 (class 1259 OID 17819)
-- Name: idx_event_songs_event; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_songs_event ON public.event_songs USING btree (event_id);


--
-- TOC entry 4923 (class 1259 OID 17820)
-- Name: idx_event_songs_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_songs_song ON public.event_songs USING btree (song_id);


--
-- TOC entry 4878 (class 1259 OID 17069)
-- Name: idx_messages_band_sentat_id_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_band_sentat_id_desc ON public.messages USING btree (band_member_id, sent_at DESC, message_id DESC);


--
-- TOC entry 4908 (class 1259 OID 17733)
-- Name: idx_song_tags_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_tags_song ON public.song_tags USING btree (song_id);


--
-- TOC entry 4909 (class 1259 OID 17734)
-- Name: idx_song_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_tags_tag ON public.song_tags USING btree (tag_id);


--
-- TOC entry 4904 (class 1259 OID 17732)
-- Name: idx_tags_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_band ON public.tags USING btree (band_id);


--
-- TOC entry 4905 (class 1259 OID 17714)
-- Name: idx_tags_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tags_unique ON public.tags USING btree (band_id, lower((name)::text)) NULLS NOT DISTINCT;


--
-- TOC entry 4899 (class 1259 OID 16693)
-- Name: idx_users_firebase_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_firebase_uid ON public.users USING btree (firebase_uid);


--
-- TOC entry 4940 (class 2606 OID 17765)
-- Name: collection_songs collection_songs_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(collection_id) ON DELETE CASCADE;


--
-- TOC entry 4941 (class 2606 OID 17770)
-- Name: collection_songs collection_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id);


--
-- TOC entry 4942 (class 2606 OID 17809)
-- Name: event_songs event_songs_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_songs
    ADD CONSTRAINT event_songs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON DELETE CASCADE;


--
-- TOC entry 4943 (class 2606 OID 17814)
-- Name: event_songs event_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_songs
    ADD CONSTRAINT event_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 16694)
-- Name: band_members fk_band_members_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT fk_band_members_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 16900)
-- Name: band_members fk_band_members_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT fk_band_members_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4928 (class 2606 OID 16704)
-- Name: events fk_events_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4929 (class 2606 OID 16905)
-- Name: member_roles fk_member_roles_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT fk_member_roles_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4930 (class 2606 OID 16714)
-- Name: member_roles fk_member_roles_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT fk_member_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- TOC entry 4931 (class 2606 OID 16910)
-- Name: messages fk_messages_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 16915)
-- Name: musideas fk_musideas_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas
    ADD CONSTRAINT fk_musideas_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4933 (class 2606 OID 16925)
-- Name: practice_sessions fk_practice_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT fk_practice_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4934 (class 2606 OID 16930)
-- Name: setlists_songs fk_setlists_songs_setlist; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT fk_setlists_songs_setlist FOREIGN KEY (setlist_id) REFERENCES public.setlists(setlist_id) ON DELETE CASCADE;


--
-- TOC entry 4935 (class 2606 OID 16935)
-- Name: setlists_songs fk_setlists_songs_song; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT fk_setlists_songs_song FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- TOC entry 4936 (class 2606 OID 16744)
-- Name: songs fk_songs_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT fk_songs_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4937 (class 2606 OID 16920)
-- Name: tasks fk_tasks_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4938 (class 2606 OID 17722)
-- Name: song_tags song_tags_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- TOC entry 4939 (class 2606 OID 17727)
-- Name: song_tags song_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE;


-- Completed on 2026-01-10 16:25:49

--
-- PostgreSQL database dump complete
--

\unrestrict h94Q3AsFz2dofSdBTjWM4dqgxHoEDiRkHHJ1cUHaLcM9xxPHfJhjI8kxC2IEB7o

