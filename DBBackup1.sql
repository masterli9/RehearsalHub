--
-- PostgreSQL database dump
--

\restrict 0ojjFXO8dSYhNUGdchwC2ZiKzZTr7D0mr6ttq6eRrc6wAPlJaveZBFFyl3X41RQ

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-10-05 21:44:19

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
-- TOC entry 5048 (class 1262 OID 19506)
-- Name: RehearsalHub; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "RehearsalHub" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Czech_Czechia.1250';


ALTER DATABASE "RehearsalHub" OWNER TO postgres;

\unrestrict 0ojjFXO8dSYhNUGdchwC2ZiKzZTr7D0mr6ttq6eRrc6wAPlJaveZBFFyl3X41RQ
\connect "RehearsalHub"
\restrict 0ojjFXO8dSYhNUGdchwC2ZiKzZTr7D0mr6ttq6eRrc6wAPlJaveZBFFyl3X41RQ

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 19530)
-- Name: band_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.band_members (
    band_member_id integer NOT NULL,
    user_id integer,
    band_id integer
);


ALTER TABLE public.band_members OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 19529)
-- Name: band_members_band_member_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.band_members_band_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.band_members_band_member_id_seq OWNER TO postgres;

--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 221
-- Name: band_members_band_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.band_members_band_member_id_seq OWNED BY public.band_members.band_member_id;


--
-- TOC entry 220 (class 1259 OID 19520)
-- Name: bands; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bands (
    band_id integer NOT NULL,
    name character varying(128) NOT NULL,
    invite_code character varying(12),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.bands OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 19519)
-- Name: bands_band_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bands_band_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bands_band_id_seq OWNER TO postgres;

--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 219
-- Name: bands_band_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bands_band_id_seq OWNED BY public.bands.band_id;


--
-- TOC entry 237 (class 1259 OID 19649)
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(20),
    date_time timestamp without time zone NOT NULL,
    description text,
    band_id integer NOT NULL,
    CONSTRAINT events_type_check CHECK (((type)::text = ANY ((ARRAY['rehearsal'::character varying, 'concert'::character varying, 'recording'::character varying])::text[])))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 19648)
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_event_id_seq OWNER TO postgres;

--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 236
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- TOC entry 225 (class 1259 OID 19557)
-- Name: member_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.member_roles (
    band_member_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.member_roles OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 19573)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    message_id integer NOT NULL,
    text text NOT NULL,
    sent_at timestamp without time zone DEFAULT now() NOT NULL,
    band_member_id integer NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 19572)
-- Name: messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_message_id_seq OWNER TO postgres;

--
-- TOC entry 5053 (class 0 OID 0)
-- Dependencies: 226
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_message_id_seq OWNED BY public.messages.message_id;


--
-- TOC entry 235 (class 1259 OID 19631)
-- Name: musideas; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT musideas_key_check CHECK (((key)::text = ANY ((ARRAY['C'::character varying, 'C#'::character varying, 'D'::character varying, 'D#'::character varying, 'E'::character varying, 'F'::character varying, 'F#'::character varying, 'G'::character varying, 'G#'::character varying, 'A'::character varying, 'A#'::character varying, 'B'::character varying, 'Cm'::character varying, 'C#m'::character varying, 'Dm'::character varying, 'D#m'::character varying, 'Em'::character varying, 'Fm'::character varying, 'F#m'::character varying, 'Gm'::character varying, 'G#m'::character varying, 'Am'::character varying, 'A#m'::character varying, 'Bm'::character varying])::text[]))),
    CONSTRAINT musideas_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['private'::character varying, 'band'::character varying])::text[])))
);


ALTER TABLE public.musideas OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 19630)
-- Name: musideas_idea_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.musideas_idea_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.musideas_idea_id_seq OWNER TO postgres;

--
-- TOC entry 5054 (class 0 OID 0)
-- Dependencies: 234
-- Name: musideas_idea_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.musideas_idea_id_seq OWNED BY public.musideas.idea_id;


--
-- TOC entry 239 (class 1259 OID 19664)
-- Name: practice_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.practice_sessions (
    practice_session_id integer NOT NULL,
    length interval NOT NULL,
    notes text,
    started_at timestamp without time zone,
    user_id integer NOT NULL
);


ALTER TABLE public.practice_sessions OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 19663)
-- Name: practice_sessions_practice_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.practice_sessions_practice_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.practice_sessions_practice_session_id_seq OWNER TO postgres;

--
-- TOC entry 5055 (class 0 OID 0)
-- Dependencies: 238
-- Name: practice_sessions_practice_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.practice_sessions_practice_session_id_seq OWNED BY public.practice_sessions.practice_session_id;


--
-- TOC entry 224 (class 1259 OID 19549)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    title character varying(45)
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 19548)
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO postgres;

--
-- TOC entry 5056 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 231 (class 1259 OID 19605)
-- Name: setlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.setlists (
    setlist_id integer NOT NULL,
    title character varying(128) NOT NULL
);


ALTER TABLE public.setlists OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 19604)
-- Name: setlists_setlist_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.setlists_setlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.setlists_setlist_id_seq OWNER TO postgres;

--
-- TOC entry 5057 (class 0 OID 0)
-- Dependencies: 230
-- Name: setlists_setlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.setlists_setlist_id_seq OWNED BY public.setlists.setlist_id;


--
-- TOC entry 233 (class 1259 OID 19612)
-- Name: setlists_songs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.setlists_songs (
    setlists_songs_id integer NOT NULL,
    setlist_id integer NOT NULL,
    song_id integer NOT NULL,
    "position" smallint NOT NULL
);


ALTER TABLE public.setlists_songs OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 19611)
-- Name: setlists_songs_setlists_songs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.setlists_songs_setlists_songs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.setlists_songs_setlists_songs_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 232
-- Name: setlists_songs_setlists_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.setlists_songs_setlists_songs_id_seq OWNED BY public.setlists_songs.setlists_songs_id;


--
-- TOC entry 229 (class 1259 OID 19588)
-- Name: songs; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT songs_key_check CHECK (((key)::text = ANY ((ARRAY['C'::character varying, 'C#'::character varying, 'D'::character varying, 'D#'::character varying, 'E'::character varying, 'F'::character varying, 'F#'::character varying, 'G'::character varying, 'G#'::character varying, 'A'::character varying, 'A#'::character varying, 'B'::character varying, 'Cm'::character varying, 'C#m'::character varying, 'Dm'::character varying, 'D#m'::character varying, 'Em'::character varying, 'Fm'::character varying, 'F#m'::character varying, 'Gm'::character varying, 'G#m'::character varying, 'Am'::character varying, 'A#m'::character varying, 'Bm'::character varying])::text[]))),
    CONSTRAINT songs_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'finished'::character varying, 'finished & rehearsed'::character varying])::text[])))
);


ALTER TABLE public.songs OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 19587)
-- Name: songs_song_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.songs_song_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.songs_song_id_seq OWNER TO postgres;

--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 228
-- Name: songs_song_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.songs_song_id_seq OWNED BY public.songs.song_id;


--
-- TOC entry 241 (class 1259 OID 19678)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    task_id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    due_date date,
    band_member_id integer NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 19677)
-- Name: tasks_task_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_task_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_task_id_seq OWNER TO postgres;

--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 240
-- Name: tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_task_id_seq OWNED BY public.tasks.task_id;


--
-- TOC entry 218 (class 1259 OID 19508)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    firebase_uid character varying(128) NOT NULL,
    email character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    photourl text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 19507)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4805 (class 2604 OID 19533)
-- Name: band_members band_member_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.band_members ALTER COLUMN band_member_id SET DEFAULT nextval('public.band_members_band_member_id_seq'::regclass);


--
-- TOC entry 4803 (class 2604 OID 19523)
-- Name: bands band_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bands ALTER COLUMN band_id SET DEFAULT nextval('public.bands_band_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 19652)
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- TOC entry 4807 (class 2604 OID 19576)
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- TOC entry 4813 (class 2604 OID 19634)
-- Name: musideas idea_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.musideas ALTER COLUMN idea_id SET DEFAULT nextval('public.musideas_idea_id_seq'::regclass);


--
-- TOC entry 4817 (class 2604 OID 19667)
-- Name: practice_sessions practice_session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.practice_sessions ALTER COLUMN practice_session_id SET DEFAULT nextval('public.practice_sessions_practice_session_id_seq'::regclass);


--
-- TOC entry 4806 (class 2604 OID 19552)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4811 (class 2604 OID 19608)
-- Name: setlists setlist_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlists ALTER COLUMN setlist_id SET DEFAULT nextval('public.setlists_setlist_id_seq'::regclass);


--
-- TOC entry 4812 (class 2604 OID 19615)
-- Name: setlists_songs setlists_songs_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.setlists_songs ALTER COLUMN setlists_songs_id SET DEFAULT nextval('public.setlists_songs_setlists_songs_id_seq'::regclass);


--
-- TOC entry 4809 (class 2604 OID 19591)
-- Name: songs song_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.songs ALTER COLUMN song_id SET DEFAULT nextval('public.songs_song_id_seq'::regclass);


--
-- TOC entry 4818 (class 2604 OID 19681)
-- Name: tasks task_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN task_id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);


--
-- TOC entry 4801 (class 2604 OID 19511)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5023 (class 0 OID 19530)
-- Dependencies: 222
-- Data for Name: band_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5021 (class 0 OID 19520)
-- Dependencies: 220
-- Data for Name: bands; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5038 (class 0 OID 19649)
-- Dependencies: 237
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5026 (class 0 OID 19557)
-- Dependencies: 225
-- Data for Name: member_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5028 (class 0 OID 19573)
-- Dependencies: 227
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5036 (class 0 OID 19631)
-- Dependencies: 235
-- Data for Name: musideas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5040 (class 0 OID 19664)
-- Dependencies: 239
-- Data for Name: practice_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5025 (class 0 OID 19549)
-- Dependencies: 224
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5032 (class 0 OID 19605)
-- Dependencies: 231
-- Data for Name: setlists; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5034 (class 0 OID 19612)
-- Dependencies: 233
-- Data for Name: setlists_songs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5030 (class 0 OID 19588)
-- Dependencies: 229
-- Data for Name: songs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5042 (class 0 OID 19678)
-- Dependencies: 241
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5019 (class 0 OID 19508)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 221
-- Name: band_members_band_member_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.band_members_band_member_id_seq', 1, false);


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 219
-- Name: bands_band_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bands_band_id_seq', 1, false);


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 236
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_event_id_seq', 1, false);


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 226
-- Name: messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_message_id_seq', 1, false);


--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 234
-- Name: musideas_idea_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.musideas_idea_id_seq', 1, false);


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 238
-- Name: practice_sessions_practice_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.practice_sessions_practice_session_id_seq', 1, false);


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 223
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 1, false);


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 230
-- Name: setlists_setlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.setlists_setlist_id_seq', 1, false);


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 232
-- Name: setlists_songs_setlists_songs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.setlists_songs_setlists_songs_id_seq', 1, false);


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 228
-- Name: songs_song_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.songs_song_id_seq', 1, false);


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 240
-- Name: tasks_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_task_id_seq', 1, false);


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);


-- Completed on 2025-10-05 21:44:20

--
-- PostgreSQL database dump complete
--

\unrestrict 0ojjFXO8dSYhNUGdchwC2ZiKzZTr7D0mr6ttq6eRrc6wAPlJaveZBFFyl3X41RQ

