--
-- PostgreSQL database dump
--

\restrict PpBoTHsTQWzUqqfa27gybtDUpB891xVZj6aAcyHsDTyrL51GeBkiL6bulYbPbab

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-12-02 17:17:58

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
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 923 (class 1247 OID 17736)
-- Name: collection_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collection_type AS ENUM (
    'EP',
    'Album',
    'Single'
);


SET default_tablespace = '';

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
-- TOC entry 5109 (class 0 OID 0)
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
-- TOC entry 5110 (class 0 OID 0)
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
-- TOC entry 5111 (class 0 OID 0)
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
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 246
-- Name: collections_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.collections_collection_id_seq OWNED BY public.collections.collection_id;


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
-- TOC entry 5113 (class 0 OID 0)
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
-- TOC entry 5114 (class 0 OID 0)
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
-- TOC entry 5115 (class 0 OID 0)
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
-- TOC entry 5116 (class 0 OID 0)
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
-- TOC entry 5117 (class 0 OID 0)
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
-- TOC entry 5118 (class 0 OID 0)
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
-- TOC entry 5119 (class 0 OID 0)
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
-- TOC entry 5120 (class 0 OID 0)
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
    created_at date DEFAULT CURRENT_DATE,
    notes text,
    status character varying(20),
    bpm smallint,
    cloudurl text,
    band_id integer NOT NULL,
    CONSTRAINT songs_key_check CHECK (((key)::text = ANY (ARRAY[('C'::character varying)::text, ('C#'::character varying)::text, ('D'::character varying)::text, ('D#'::character varying)::text, ('E'::character varying)::text, ('F'::character varying)::text, ('F#'::character varying)::text, ('G'::character varying)::text, ('G#'::character varying)::text, ('A'::character varying)::text, ('A#'::character varying)::text, ('B'::character varying)::text, ('Cm'::character varying)::text, ('C#m'::character varying)::text, ('Dm'::character varying)::text, ('D#m'::character varying)::text, ('Em'::character varying)::text, ('Fm'::character varying)::text, ('F#m'::character varying)::text, ('Gm'::character varying)::text, ('G#m'::character varying)::text, ('Am'::character varying)::text, ('A#m'::character varying)::text, ('Bm'::character varying)::text]))),
    CONSTRAINT songs_status_check CHECK (((status)::text = ANY (ARRAY[('draft'::character varying)::text, ('finished'::character varying)::text, ('finished & rehearsed'::character varying)::text])))
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
-- TOC entry 5121 (class 0 OID 0)
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
-- TOC entry 5122 (class 0 OID 0)
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
-- TOC entry 5123 (class 0 OID 0)
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
    photourl text,
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
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 241
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4824 (class 2604 OID 16645)
-- Name: band_members band_member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members ALTER COLUMN band_member_id SET DEFAULT nextval('public.band_members_band_member_id_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 16646)
-- Name: bands band_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands ALTER COLUMN band_id SET DEFAULT nextval('public.bands_band_id_seq'::regclass);


--
-- TOC entry 4847 (class 2604 OID 17757)
-- Name: collection_songs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs ALTER COLUMN id SET DEFAULT nextval('public.collection_songs_id_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 17747)
-- Name: collections collection_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections ALTER COLUMN collection_id SET DEFAULT nextval('public.collections_collection_id_seq'::regclass);


--
-- TOC entry 4827 (class 2604 OID 16647)
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 16648)
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- TOC entry 4830 (class 2604 OID 16649)
-- Name: musideas idea_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas ALTER COLUMN idea_id SET DEFAULT nextval('public.musideas_idea_id_seq'::regclass);


--
-- TOC entry 4833 (class 2604 OID 16650)
-- Name: practice_sessions practice_session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions ALTER COLUMN practice_session_id SET DEFAULT nextval('public.practice_sessions_practice_session_id_seq'::regclass);


--
-- TOC entry 4834 (class 2604 OID 16651)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4835 (class 2604 OID 16652)
-- Name: setlists setlist_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists ALTER COLUMN setlist_id SET DEFAULT nextval('public.setlists_setlist_id_seq'::regclass);


--
-- TOC entry 4836 (class 2604 OID 16653)
-- Name: setlists_songs setlists_songs_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs ALTER COLUMN setlists_songs_id SET DEFAULT nextval('public.setlists_songs_setlists_songs_id_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 17719)
-- Name: song_tags song_tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags ALTER COLUMN song_tag_id SET DEFAULT nextval('public.song_tags_song_tag_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 16654)
-- Name: songs song_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs ALTER COLUMN song_id SET DEFAULT nextval('public.songs_song_id_seq'::regclass);


--
-- TOC entry 4842 (class 2604 OID 17710)
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- TOC entry 4839 (class 2604 OID 16655)
-- Name: tasks task_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN task_id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);


--
-- TOC entry 4840 (class 2604 OID 16656)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5070 (class 0 OID 16569)
-- Dependencies: 217
-- Data for Name: band_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.band_members (band_member_id, user_id, band_id) VALUES (24, 15, 10);
INSERT INTO public.band_members (band_member_id, user_id, band_id) VALUES (25, 16, 10);


--
-- TOC entry 5072 (class 0 OID 16573)
-- Dependencies: 219
-- Data for Name: bands; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.bands (band_id, name, invite_code, created_at) VALUES (10, 'Páv', 'ZYA8WL', '2025-11-11 12:48:00.944486');


--
-- TOC entry 5102 (class 0 OID 17754)
-- Dependencies: 249
-- Data for Name: collection_songs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5100 (class 0 OID 17744)
-- Dependencies: 247
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5074 (class 0 OID 16578)
-- Dependencies: 221
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5076 (class 0 OID 16585)
-- Dependencies: 223
-- Data for Name: member_roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.member_roles (band_member_id, role_id) VALUES (24, 5);
INSERT INTO public.member_roles (band_member_id, role_id) VALUES (25, 1);


--
-- TOC entry 5077 (class 0 OID 16588)
-- Dependencies: 224
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (2, 'Hahaha', '2025-11-11 12:50:00.800027', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (3, 'Nigga', '2025-11-11 12:50:07.877676', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (4, 'Henlo', '2025-11-12 09:58:45.824221', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (5, 'Cau', '2025-11-12 09:58:52.052691', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (6, 'Co je', '2025-11-12 09:58:55.755286', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (7, 'Hodne', '2025-11-12 09:59:24.275664', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (8, 'Zprav', '2025-11-12 09:59:26.200494', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (9, 'Jalize', '2025-11-12 09:59:28.263677', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (10, 'Proste', '2025-11-12 09:59:30.559456', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (11, 'Hodne', '2025-11-12 09:59:32.255196', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (12, '😍😍😍', '2025-11-12 10:00:20.976385', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (13, '🤣🤣', '2025-11-12 10:00:42.821909', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (14, 'Jvjvjv', '2025-11-12 10:18:09.592428', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (15, '😅😅😅', '2025-11-12 10:23:22.912384', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (16, 'Gg', '2025-11-13 12:21:52.787707', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (17, 'A', '2025-11-18 12:50:26.289324', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (18, 'B', '2025-11-18 12:50:27.164578', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (19, 'C', '2025-11-18 12:50:28.211016', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (20, 'D', '2025-11-18 12:50:30.060919', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (21, 'E', '2025-11-18 12:50:31.776338', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (22, 'F', '2025-11-18 12:50:32.949034', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (23, 'H', '2025-11-18 12:50:35.255338', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (24, 'I', '2025-11-18 12:50:36.366921', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (25, 'K', '2025-11-18 12:50:38.720398', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (26, 'M', '2025-11-18 12:50:41.664243', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (27, 'N', '2025-11-18 12:50:43.662521', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (28, 'O', '2025-11-18 12:50:45.71284', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (29, 'P', '2025-11-18 12:50:47.085371', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (30, 'Q', '2025-11-18 12:50:50.012165', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (31, 'R', '2025-11-18 12:50:51.091742', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (32, 'S', '2025-11-18 12:50:52.545125', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (33, 'U', '2025-11-18 12:50:54.951196', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (34, 'V', '2025-11-18 12:50:57.323426', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (35, 'W', '2025-11-18 12:50:59.193674', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (36, 'Krása', '2025-11-20 12:24:20.794893', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (37, 'Jásá', '2025-11-20 12:24:24.460286', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (38, 'Beru', '2025-11-20 12:24:28.339813', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (39, 'V šeru', '2025-11-20 12:24:32.590133', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (40, 'Ještě neni 10', '2025-11-20 12:25:59.991237', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (41, 'Tttt', '2025-11-20 12:26:07.706465', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (42, 'Tfjefnj', '2025-11-20 12:27:25.095515', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (43, '🙂😑🙏🎉😭🎉😞', '2025-11-20 12:27:38.613306', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (44, 'Dkjxnds', '2025-11-20 12:32:52.534888', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (45, 'Gogga', '2025-11-20 12:33:00.046479', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (46, 'And if', '2025-11-20 12:33:12.644433', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (47, '😇😇', '2025-11-20 12:33:23.723899', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (48, '🙃😇😇🙃', '2025-11-20 12:33:38.053664', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (49, '🙃😇😃🤗', '2025-11-20 12:33:43.827808', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (50, '🫠', '2025-11-20 12:33:47.991483', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (51, 'Hello', '2025-11-21 08:35:57.40734', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (52, 'Hi', '2025-11-21 08:36:01.936726', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (53, 'Ha', '2025-11-21 08:36:17.888967', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (54, 'G', '2025-11-21 08:36:38.48583', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (55, 'Jdkwons', '2025-11-21 08:37:00.172381', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (56, 'H', '2025-11-21 08:37:47.770149', 24);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (57, 'Fdkdkks', '2025-11-21 08:37:55.833877', 25);
INSERT INTO public.messages (message_id, text, sent_at, band_member_id) VALUES (58, '🙂🙂🙂', '2025-11-21 08:40:33.785092', 24);


--
-- TOC entry 5079 (class 0 OID 16595)
-- Dependencies: 226
-- Data for Name: musideas; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5081 (class 0 OID 16605)
-- Dependencies: 228
-- Data for Name: practice_sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5083 (class 0 OID 16611)
-- Dependencies: 230
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (role_id, title) VALUES (2, 'Lead Vocalist');
INSERT INTO public.roles (role_id, title) VALUES (3, 'Backing Vocalist');
INSERT INTO public.roles (role_id, title) VALUES (4, 'Lead Guitarist');
INSERT INTO public.roles (role_id, title) VALUES (5, 'Rhythm Guitarist');
INSERT INTO public.roles (role_id, title) VALUES (6, 'Bassist');
INSERT INTO public.roles (role_id, title) VALUES (7, 'Drummer');
INSERT INTO public.roles (role_id, title) VALUES (8, 'Keyboardist');
INSERT INTO public.roles (role_id, title) VALUES (9, 'DJ');
INSERT INTO public.roles (role_id, title) VALUES (10, 'Producer');
INSERT INTO public.roles (role_id, title) VALUES (1, 'Leader');


--
-- TOC entry 5085 (class 0 OID 16615)
-- Dependencies: 232
-- Data for Name: setlists; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5087 (class 0 OID 16619)
-- Dependencies: 234
-- Data for Name: setlists_songs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5098 (class 0 OID 17716)
-- Dependencies: 245
-- Data for Name: song_tags; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5089 (class 0 OID 16623)
-- Dependencies: 236
-- Data for Name: songs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5096 (class 0 OID 17707)
-- Dependencies: 243
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5091 (class 0 OID 16632)
-- Dependencies: 238
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 5093 (class 0 OID 16638)
-- Dependencies: 240
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (user_id, firebase_uid, email, username, photourl, created_at) VALUES (15, 'Uygr5gBc4oZ0VUR1CANWQ0YxeYT2', 'andrej.zdvorak.123@gmail.com', 'Sterli.', NULL, '2025-11-11 12:47:12.827228');
INSERT INTO public.users (user_id, firebase_uid, email, username, photourl, created_at) VALUES (16, 'QoJv2SeDVscPtX6B2UZNTTwkWFm1', 'luk07luk@gmail.com', 'BirLukas', NULL, '2025-11-11 12:47:34.641264');


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 218
-- Name: band_members_band_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.band_members_band_member_id_seq', 25, true);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 220
-- Name: bands_band_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bands_band_id_seq', 10, true);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 248
-- Name: collection_songs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.collection_songs_id_seq', 1, false);


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 246
-- Name: collections_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.collections_collection_id_seq', 1, false);


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 222
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_event_id_seq', 1, false);


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 225
-- Name: messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_message_id_seq', 58, true);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 227
-- Name: musideas_idea_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.musideas_idea_id_seq', 1, false);


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 229
-- Name: practice_sessions_practice_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.practice_sessions_practice_session_id_seq', 1, false);


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 231
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 11, true);


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 233
-- Name: setlists_setlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.setlists_setlist_id_seq', 1, false);


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 235
-- Name: setlists_songs_setlists_songs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.setlists_songs_setlists_songs_id_seq', 1, false);


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 244
-- Name: song_tags_song_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.song_tags_song_tag_id_seq', 1, false);


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 237
-- Name: songs_song_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.songs_song_id_seq', 1, false);


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 242
-- Name: tags_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tags_tag_id_seq', 1, false);


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 239
-- Name: tasks_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_task_id_seq', 1, false);


--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 241
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_user_id_seq', 16, true);


--
-- TOC entry 4855 (class 2606 OID 16658)
-- Name: band_members band_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT band_members_pkey PRIMARY KEY (band_member_id);


--
-- TOC entry 4860 (class 2606 OID 16660)
-- Name: bands bands_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands
    ADD CONSTRAINT bands_invite_code_key UNIQUE (invite_code);


--
-- TOC entry 4862 (class 2606 OID 16662)
-- Name: bands bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands
    ADD CONSTRAINT bands_pkey PRIMARY KEY (band_id);


--
-- TOC entry 4904 (class 2606 OID 17764)
-- Name: collection_songs collection_songs_collection_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_position_key UNIQUE (collection_id, "position");


--
-- TOC entry 4906 (class 2606 OID 17762)
-- Name: collection_songs collection_songs_collection_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_song_id_key UNIQUE (collection_id, song_id);


--
-- TOC entry 4908 (class 2606 OID 17760)
-- Name: collection_songs collection_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_pkey PRIMARY KEY (id);


--
-- TOC entry 4902 (class 2606 OID 17752)
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (collection_id);


--
-- TOC entry 4864 (class 2606 OID 16664)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 4866 (class 2606 OID 16666)
-- Name: member_roles member_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT member_roles_pkey PRIMARY KEY (band_member_id, role_id);


--
-- TOC entry 4869 (class 2606 OID 16668)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4871 (class 2606 OID 16670)
-- Name: musideas musideas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas
    ADD CONSTRAINT musideas_pkey PRIMARY KEY (idea_id);


--
-- TOC entry 4873 (class 2606 OID 16672)
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (practice_session_id);


--
-- TOC entry 4875 (class 2606 OID 16674)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4877 (class 2606 OID 16676)
-- Name: roles roles_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_title_key UNIQUE (title);


--
-- TOC entry 4879 (class 2606 OID 16678)
-- Name: setlists setlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_pkey PRIMARY KEY (setlist_id);


--
-- TOC entry 4881 (class 2606 OID 16680)
-- Name: setlists_songs setlists_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT setlists_songs_pkey PRIMARY KEY (setlists_songs_id);


--
-- TOC entry 4900 (class 2606 OID 17721)
-- Name: song_tags song_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_pkey PRIMARY KEY (song_tag_id);


--
-- TOC entry 4885 (class 2606 OID 16682)
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (song_id);


--
-- TOC entry 4896 (class 2606 OID 17713)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- TOC entry 4887 (class 2606 OID 16684)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (task_id);


--
-- TOC entry 4858 (class 2606 OID 16686)
-- Name: band_members unique_band_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT unique_band_member UNIQUE (user_id, band_id);


--
-- TOC entry 4883 (class 2606 OID 16688)
-- Name: setlists_songs unique_setlist_song; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT unique_setlist_song UNIQUE (setlist_id, song_id);


--
-- TOC entry 4890 (class 2606 OID 16690)
-- Name: users users_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);


--
-- TOC entry 4892 (class 2606 OID 16692)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4856 (class 1259 OID 17070)
-- Name: idx_band_members_user_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_band_members_user_band ON public.band_members USING btree (user_id, band_id);


--
-- TOC entry 4867 (class 1259 OID 17069)
-- Name: idx_messages_band_sentat_id_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_band_sentat_id_desc ON public.messages USING btree (band_member_id, sent_at DESC, message_id DESC);


--
-- TOC entry 4897 (class 1259 OID 17733)
-- Name: idx_song_tags_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_tags_song ON public.song_tags USING btree (song_id);


--
-- TOC entry 4898 (class 1259 OID 17734)
-- Name: idx_song_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_tags_tag ON public.song_tags USING btree (tag_id);


--
-- TOC entry 4893 (class 1259 OID 17732)
-- Name: idx_tags_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_band ON public.tags USING btree (band_id);


--
-- TOC entry 4894 (class 1259 OID 17714)
-- Name: idx_tags_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tags_unique ON public.tags USING btree (band_id, lower((name)::text)) NULLS NOT DISTINCT;


--
-- TOC entry 4888 (class 1259 OID 16693)
-- Name: idx_users_firebase_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_firebase_uid ON public.users USING btree (firebase_uid);


--
-- TOC entry 4923 (class 2606 OID 17765)
-- Name: collection_songs collection_songs_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(collection_id) ON DELETE CASCADE;


--
-- TOC entry 4924 (class 2606 OID 17770)
-- Name: collection_songs collection_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id);


--
-- TOC entry 4909 (class 2606 OID 16694)
-- Name: band_members fk_band_members_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT fk_band_members_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4910 (class 2606 OID 16900)
-- Name: band_members fk_band_members_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT fk_band_members_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4911 (class 2606 OID 16704)
-- Name: events fk_events_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4912 (class 2606 OID 16905)
-- Name: member_roles fk_member_roles_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT fk_member_roles_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4913 (class 2606 OID 16714)
-- Name: member_roles fk_member_roles_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT fk_member_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- TOC entry 4914 (class 2606 OID 16910)
-- Name: messages fk_messages_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4915 (class 2606 OID 16915)
-- Name: musideas fk_musideas_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas
    ADD CONSTRAINT fk_musideas_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4916 (class 2606 OID 16925)
-- Name: practice_sessions fk_practice_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT fk_practice_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4917 (class 2606 OID 16930)
-- Name: setlists_songs fk_setlists_songs_setlist; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT fk_setlists_songs_setlist FOREIGN KEY (setlist_id) REFERENCES public.setlists(setlist_id) ON DELETE CASCADE;


--
-- TOC entry 4918 (class 2606 OID 16935)
-- Name: setlists_songs fk_setlists_songs_song; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT fk_setlists_songs_song FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- TOC entry 4919 (class 2606 OID 16744)
-- Name: songs fk_songs_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT fk_songs_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4920 (class 2606 OID 16920)
-- Name: tasks fk_tasks_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4921 (class 2606 OID 17722)
-- Name: song_tags song_tags_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- TOC entry 4922 (class 2606 OID 17727)
-- Name: song_tags song_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE;


-- Completed on 2025-12-02 17:17:59

--
-- PostgreSQL database dump complete
--

\unrestrict PpBoTHsTQWzUqqfa27gybtDUpB891xVZj6aAcyHsDTyrL51GeBkiL6bulYbPbab

