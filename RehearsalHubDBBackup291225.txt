--
-- PostgreSQL database dump
--

\restrict eBIS99TaC1mHDYfEl9HLgntssPdfI5uQUnl7HWDoTSeOpbIwLQ4w1Duxvfk8tar

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-12-29 11:45:08

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
-- TOC entry 919 (class 1247 OID 19885)
-- Name: collection_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.collection_type AS ENUM (
    'EP',
    'Album',
    'Single'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 19530)
-- Name: band_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.band_members (
    band_member_id integer NOT NULL,
    user_id integer,
    band_id integer
);


--
-- TOC entry 223 (class 1259 OID 19529)
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
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 223
-- Name: band_members_band_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.band_members_band_member_id_seq OWNED BY public.band_members.band_member_id;


--
-- TOC entry 222 (class 1259 OID 19520)
-- Name: bands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bands (
    band_id integer NOT NULL,
    name character varying(128) NOT NULL,
    invite_code character varying(12),
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 221 (class 1259 OID 19519)
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
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 221
-- Name: bands_band_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bands_band_id_seq OWNED BY public.bands.band_id;


--
-- TOC entry 244 (class 1259 OID 19891)
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
-- TOC entry 245 (class 1259 OID 19895)
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
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 245
-- Name: collection_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.collection_songs_id_seq OWNED BY public.collection_songs.id;


--
-- TOC entry 246 (class 1259 OID 19896)
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
-- TOC entry 247 (class 1259 OID 19902)
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
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 247
-- Name: collections_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.collections_collection_id_seq OWNED BY public.collections.collection_id;


--
-- TOC entry 239 (class 1259 OID 19649)
-- Name: events; Type: TABLE; Schema: public; Owner: -
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


--
-- TOC entry 238 (class 1259 OID 19648)
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
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 238
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- TOC entry 227 (class 1259 OID 19557)
-- Name: member_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_roles (
    band_member_id integer NOT NULL,
    role_id integer NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 19573)
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    message_id integer NOT NULL,
    text text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    band_member_id integer NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 19572)
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
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 228
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_message_id_seq OWNED BY public.messages.message_id;


--
-- TOC entry 237 (class 1259 OID 19631)
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
    CONSTRAINT musideas_key_check CHECK (((key)::text = ANY ((ARRAY['C'::character varying, 'C#'::character varying, 'D'::character varying, 'D#'::character varying, 'E'::character varying, 'F'::character varying, 'F#'::character varying, 'G'::character varying, 'G#'::character varying, 'A'::character varying, 'A#'::character varying, 'B'::character varying, 'Cm'::character varying, 'C#m'::character varying, 'Dm'::character varying, 'D#m'::character varying, 'Em'::character varying, 'Fm'::character varying, 'F#m'::character varying, 'Gm'::character varying, 'G#m'::character varying, 'Am'::character varying, 'A#m'::character varying, 'Bm'::character varying])::text[]))),
    CONSTRAINT musideas_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['private'::character varying, 'band'::character varying])::text[])))
);


--
-- TOC entry 236 (class 1259 OID 19630)
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
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 236
-- Name: musideas_idea_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.musideas_idea_id_seq OWNED BY public.musideas.idea_id;


--
-- TOC entry 241 (class 1259 OID 19664)
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
-- TOC entry 240 (class 1259 OID 19663)
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
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 240
-- Name: practice_sessions_practice_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.practice_sessions_practice_session_id_seq OWNED BY public.practice_sessions.practice_session_id;


--
-- TOC entry 226 (class 1259 OID 19549)
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    title character varying(45)
);


--
-- TOC entry 225 (class 1259 OID 19548)
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
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 225
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- TOC entry 233 (class 1259 OID 19605)
-- Name: setlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setlists (
    setlist_id integer NOT NULL,
    title character varying(128) NOT NULL
);


--
-- TOC entry 232 (class 1259 OID 19604)
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
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 232
-- Name: setlists_setlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.setlists_setlist_id_seq OWNED BY public.setlists.setlist_id;


--
-- TOC entry 235 (class 1259 OID 19612)
-- Name: setlists_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.setlists_songs (
    setlists_songs_id integer NOT NULL,
    setlist_id integer NOT NULL,
    song_id integer NOT NULL,
    "position" smallint NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 19611)
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
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 234
-- Name: setlists_songs_setlists_songs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.setlists_songs_setlists_songs_id_seq OWNED BY public.setlists_songs.setlists_songs_id;


--
-- TOC entry 248 (class 1259 OID 19903)
-- Name: song_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_tags (
    song_tag_id integer NOT NULL,
    song_id integer NOT NULL,
    tag_id integer NOT NULL
);


--
-- TOC entry 249 (class 1259 OID 19906)
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
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 249
-- Name: song_tags_song_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.song_tags_song_tag_id_seq OWNED BY public.song_tags.song_tag_id;


--
-- TOC entry 231 (class 1259 OID 19588)
-- Name: songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.songs (
    song_id integer NOT NULL,
    title character varying(255) NOT NULL,
    key character varying(4),
    length interval,
    created_at timestamp with time zone DEFAULT now(),
    notes text,
    status character varying(20),
    bpm smallint,
    cloudurl text,
    band_id integer NOT NULL,
    CONSTRAINT songs_key_check CHECK (((key)::text = ANY ((ARRAY['C'::character varying, 'C#'::character varying, 'D'::character varying, 'D#'::character varying, 'E'::character varying, 'F'::character varying, 'F#'::character varying, 'G'::character varying, 'G#'::character varying, 'A'::character varying, 'A#'::character varying, 'B'::character varying, 'Cm'::character varying, 'C#m'::character varying, 'Dm'::character varying, 'D#m'::character varying, 'Em'::character varying, 'Fm'::character varying, 'F#m'::character varying, 'Gm'::character varying, 'G#m'::character varying, 'Am'::character varying, 'A#m'::character varying, 'Bm'::character varying])::text[]))),
    CONSTRAINT songs_status_check CHECK (((status)::text = ANY (ARRAY['draft'::text, 'finished'::text, 'ready'::text])))
);


--
-- TOC entry 230 (class 1259 OID 19587)
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
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 230
-- Name: songs_song_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.songs_song_id_seq OWNED BY public.songs.song_id;


--
-- TOC entry 250 (class 1259 OID 19907)
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
-- TOC entry 251 (class 1259 OID 19911)
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
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 251
-- Name: tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_tag_id_seq OWNED BY public.tags.tag_id;


--
-- TOC entry 243 (class 1259 OID 19678)
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
-- TOC entry 242 (class 1259 OID 19677)
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
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 242
-- Name: tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_task_id_seq OWNED BY public.tasks.task_id;


--
-- TOC entry 220 (class 1259 OID 19508)
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
-- TOC entry 219 (class 1259 OID 19507)
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
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4831 (class 2604 OID 19912)
-- Name: band_members band_member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members ALTER COLUMN band_member_id SET DEFAULT nextval('public.band_members_band_member_id_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 19913)
-- Name: bands band_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands ALTER COLUMN band_id SET DEFAULT nextval('public.bands_band_id_seq'::regclass);


--
-- TOC entry 4845 (class 2604 OID 19914)
-- Name: collection_songs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs ALTER COLUMN id SET DEFAULT nextval('public.collection_songs_id_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 19915)
-- Name: collections collection_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections ALTER COLUMN collection_id SET DEFAULT nextval('public.collections_collection_id_seq'::regclass);


--
-- TOC entry 4842 (class 2604 OID 19916)
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- TOC entry 4833 (class 2604 OID 19917)
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- TOC entry 4839 (class 2604 OID 19918)
-- Name: musideas idea_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas ALTER COLUMN idea_id SET DEFAULT nextval('public.musideas_idea_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 19919)
-- Name: practice_sessions practice_session_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions ALTER COLUMN practice_session_id SET DEFAULT nextval('public.practice_sessions_practice_session_id_seq'::regclass);


--
-- TOC entry 4832 (class 2604 OID 19920)
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 19921)
-- Name: setlists setlist_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists ALTER COLUMN setlist_id SET DEFAULT nextval('public.setlists_setlist_id_seq'::regclass);


--
-- TOC entry 4838 (class 2604 OID 19922)
-- Name: setlists_songs setlists_songs_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs ALTER COLUMN setlists_songs_id SET DEFAULT nextval('public.setlists_songs_setlists_songs_id_seq'::regclass);


--
-- TOC entry 4848 (class 2604 OID 19923)
-- Name: song_tags song_tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags ALTER COLUMN song_tag_id SET DEFAULT nextval('public.song_tags_song_tag_id_seq'::regclass);


--
-- TOC entry 4835 (class 2604 OID 19924)
-- Name: songs song_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs ALTER COLUMN song_id SET DEFAULT nextval('public.songs_song_id_seq'::regclass);


--
-- TOC entry 4849 (class 2604 OID 19925)
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 19926)
-- Name: tasks task_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN task_id SET DEFAULT nextval('public.tasks_task_id_seq'::regclass);


--
-- TOC entry 4826 (class 2604 OID 19927)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 4867 (class 2606 OID 19535)
-- Name: band_members band_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT band_members_pkey PRIMARY KEY (band_member_id);


--
-- TOC entry 4863 (class 2606 OID 19528)
-- Name: bands bands_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands
    ADD CONSTRAINT bands_invite_code_key UNIQUE (invite_code);


--
-- TOC entry 4865 (class 2606 OID 19526)
-- Name: bands bands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bands
    ADD CONSTRAINT bands_pkey PRIMARY KEY (band_id);


--
-- TOC entry 4897 (class 2606 OID 19929)
-- Name: collection_songs collection_songs_collection_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_position_key UNIQUE (collection_id, "position");


--
-- TOC entry 4899 (class 2606 OID 19931)
-- Name: collection_songs collection_songs_collection_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_song_id_key UNIQUE (collection_id, song_id);


--
-- TOC entry 4901 (class 2606 OID 19933)
-- Name: collection_songs collection_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 19935)
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (collection_id);


--
-- TOC entry 4891 (class 2606 OID 19657)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 4876 (class 2606 OID 19561)
-- Name: member_roles member_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT member_roles_pkey PRIMARY KEY (band_member_id, role_id);


--
-- TOC entry 4879 (class 2606 OID 19581)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4889 (class 2606 OID 19642)
-- Name: musideas musideas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas
    ADD CONSTRAINT musideas_pkey PRIMARY KEY (idea_id);


--
-- TOC entry 4893 (class 2606 OID 19671)
-- Name: practice_sessions practice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT practice_sessions_pkey PRIMARY KEY (practice_session_id);


--
-- TOC entry 4872 (class 2606 OID 19554)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 4874 (class 2606 OID 19556)
-- Name: roles roles_title_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_title_key UNIQUE (title);


--
-- TOC entry 4883 (class 2606 OID 19610)
-- Name: setlists setlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists
    ADD CONSTRAINT setlists_pkey PRIMARY KEY (setlist_id);


--
-- TOC entry 4885 (class 2606 OID 19617)
-- Name: setlists_songs setlists_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT setlists_songs_pkey PRIMARY KEY (setlists_songs_id);


--
-- TOC entry 4907 (class 2606 OID 19937)
-- Name: song_tags song_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_pkey PRIMARY KEY (song_tag_id);


--
-- TOC entry 4881 (class 2606 OID 19598)
-- Name: songs songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (song_id);


--
-- TOC entry 4911 (class 2606 OID 19939)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- TOC entry 4895 (class 2606 OID 19685)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (task_id);


--
-- TOC entry 4870 (class 2606 OID 19537)
-- Name: band_members unique_band_member; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT unique_band_member UNIQUE (user_id, band_id);


--
-- TOC entry 4887 (class 2606 OID 19619)
-- Name: setlists_songs unique_setlist_song; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT unique_setlist_song UNIQUE (setlist_id, song_id);


--
-- TOC entry 4859 (class 2606 OID 19518)
-- Name: users users_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);


--
-- TOC entry 4861 (class 2606 OID 19516)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4868 (class 1259 OID 19940)
-- Name: idx_band_members_user_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_band_members_user_band ON public.band_members USING btree (user_id, band_id);


--
-- TOC entry 4877 (class 1259 OID 19941)
-- Name: idx_messages_band_sentat_id_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_band_sentat_id_desc ON public.messages USING btree (band_member_id, sent_at DESC, message_id DESC);


--
-- TOC entry 4904 (class 1259 OID 19942)
-- Name: idx_song_tags_song; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_tags_song ON public.song_tags USING btree (song_id);


--
-- TOC entry 4905 (class 1259 OID 19943)
-- Name: idx_song_tags_tag; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_song_tags_tag ON public.song_tags USING btree (tag_id);


--
-- TOC entry 4908 (class 1259 OID 19944)
-- Name: idx_tags_band; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_band ON public.tags USING btree (band_id);


--
-- TOC entry 4909 (class 1259 OID 19945)
-- Name: idx_tags_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tags_unique ON public.tags USING btree (band_id, lower((name)::text)) NULLS NOT DISTINCT;


--
-- TOC entry 4857 (class 1259 OID 19707)
-- Name: idx_users_firebase_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_firebase_uid ON public.users USING btree (firebase_uid);


--
-- TOC entry 4924 (class 2606 OID 19946)
-- Name: collection_songs collection_songs_collection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.collections(collection_id) ON DELETE CASCADE;


--
-- TOC entry 4925 (class 2606 OID 19951)
-- Name: collection_songs collection_songs_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.collection_songs
    ADD CONSTRAINT collection_songs_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id);


--
-- TOC entry 4912 (class 2606 OID 19747)
-- Name: band_members fk_band_members_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT fk_band_members_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4913 (class 2606 OID 19538)
-- Name: band_members fk_band_members_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.band_members
    ADD CONSTRAINT fk_band_members_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4921 (class 2606 OID 19702)
-- Name: events fk_events_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT fk_events_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4914 (class 2606 OID 19752)
-- Name: member_roles fk_member_roles_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT fk_member_roles_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id) ON DELETE CASCADE;


--
-- TOC entry 4915 (class 2606 OID 19562)
-- Name: member_roles fk_member_roles_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT fk_member_roles_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id);


--
-- TOC entry 4916 (class 2606 OID 19582)
-- Name: messages fk_messages_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_messages_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id);


--
-- TOC entry 4920 (class 2606 OID 19643)
-- Name: musideas fk_musideas_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.musideas
    ADD CONSTRAINT fk_musideas_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id);


--
-- TOC entry 4922 (class 2606 OID 19672)
-- Name: practice_sessions fk_practice_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.practice_sessions
    ADD CONSTRAINT fk_practice_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 4918 (class 2606 OID 19620)
-- Name: setlists_songs fk_setlists_songs_setlist; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT fk_setlists_songs_setlist FOREIGN KEY (setlist_id) REFERENCES public.setlists(setlist_id);


--
-- TOC entry 4919 (class 2606 OID 19625)
-- Name: setlists_songs fk_setlists_songs_song; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.setlists_songs
    ADD CONSTRAINT fk_setlists_songs_song FOREIGN KEY (song_id) REFERENCES public.songs(song_id);


--
-- TOC entry 4917 (class 2606 OID 19697)
-- Name: songs fk_songs_band; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.songs
    ADD CONSTRAINT fk_songs_band FOREIGN KEY (band_id) REFERENCES public.bands(band_id) ON DELETE CASCADE;


--
-- TOC entry 4923 (class 2606 OID 19686)
-- Name: tasks fk_tasks_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT fk_tasks_member FOREIGN KEY (band_member_id) REFERENCES public.band_members(band_member_id);


--
-- TOC entry 4926 (class 2606 OID 19956)
-- Name: song_tags song_tags_song_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(song_id) ON DELETE CASCADE;


--
-- TOC entry 4927 (class 2606 OID 19961)
-- Name: song_tags song_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_tags
    ADD CONSTRAINT song_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(tag_id) ON DELETE CASCADE;


-- Completed on 2025-12-29 11:45:09

--
-- PostgreSQL database dump complete
--

\unrestrict eBIS99TaC1mHDYfEl9HLgntssPdfI5uQUnl7HWDoTSeOpbIwLQ4w1Duxvfk8tar

