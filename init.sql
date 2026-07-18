\restrict 2qyaYady0QkeyY9TqEH1l1vvr7ZbJhIjUTeDYtTXUmPlaQ2b5DQGuvfDUIe0YwI

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

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.cartridges (
    id integer NOT NULL,
    model character varying(50) NOT NULL,
    guid character varying(36) NOT NULL,
    status character varying(20),
    isdefective boolean DEFAULT false,
    lastchangedata timestamp with time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow'),
    lastchangeby integer
);

ALTER TABLE public.cartridges OWNER TO postgres;

CREATE SEQUENCE public.cartridges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cartridges_id_seq OWNER TO postgres;

ALTER SEQUENCE public.cartridges_id_seq OWNED BY public.cartridges.id;

CREATE TABLE public.employers (
    id integer NOT NULL,
    phone character varying(12) NOT NULL,
    fullname character varying(255) NOT NULL,
    role character varying(15) DEFAULT 'User'::character varying,
    password character varying(255) DEFAULT NULL
);

ALTER TABLE public.employers OWNER TO postgres;

CREATE SEQUENCE public.employers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employers_id_seq OWNER TO postgres;

ALTER SEQUENCE public.employers_id_seq OWNED BY public.employers.id;

CREATE TABLE public.requests (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
	isDefective bool,
    status character varying(20),
    data timestamp with time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow'),
    employee integer,
    lastchangedata timestamp with time zone DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow'),
    lastchangeby integer,
    comment character varying(255)
);

ALTER TABLE public.requests OWNER TO postgres;

CREATE SEQUENCE public.requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.requests_id_seq OWNER TO postgres;

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;

CREATE TABLE public.requestslist (
    id integer NOT NULL,
    requestid integer NOT NULL,
    cartridgeid integer NOT NULL
);

ALTER TABLE public.requestslist OWNER TO postgres;

CREATE SEQUENCE public.requestslist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requestslist_id_seq OWNER TO postgres;

ALTER SEQUENCE public.requestslist_id_seq OWNED BY public.requestslist.id;

ALTER TABLE ONLY public.cartridges ALTER COLUMN id SET DEFAULT nextval('public.cartridges_id_seq'::regclass);

ALTER TABLE ONLY public.employers ALTER COLUMN id SET DEFAULT nextval('public.employers_id_seq'::regclass);

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);

ALTER TABLE ONLY public.requestslist ALTER COLUMN id SET DEFAULT nextval('public.requestslist_id_seq'::regclass);

CREATE TABLE public.dashboard_settings (
    id integer PRIMARY KEY DEFAULT 1,
    refillThreshold integer DEFAULT 10,
    rowsCollapsedLimit integer DEFAULT 5,
    CONSTRAINT single_row CHECK (id = 1)
);

COPY public.dashboard_settings (id, refillThreshold, rowsCollapsedLimit) FROM stdin;
1	10	6
\.

COPY public.employers (id, phone, fullname, role, password) FROM stdin;
1	+79991112233	Иванов Иван Иванович	Admin	$2b$10$vn6tNBc5qvNrYMJtxCkEe.i0H6vv79gVmZO58U3Zo73gNh2pI3vFi
\.


SELECT pg_catalog.setval('public.cartridges_id_seq', 1, true);
SELECT pg_catalog.setval('public.employers_id_seq', 2, true);
SELECT pg_catalog.setval('public.requests_id_seq', 1, true);
SELECT pg_catalog.setval('public.requestslist_id_seq', 1, true);

ALTER TABLE ONLY public.cartridges
    ADD CONSTRAINT cartridges_guid_key UNIQUE (guid);

ALTER TABLE ONLY public.cartridges
    ADD CONSTRAINT cartridges_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_phone_key UNIQUE (phone);

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT requestslist_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT unique_request_cartridge UNIQUE (requestid, cartridgeid);

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_employee_fkey FOREIGN KEY (employee) REFERENCES public.employers(id);

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_lastchangeby_fkey FOREIGN KEY (lastchangeby) REFERENCES public.employers(id);

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT requestslist_cartridgeid_fkey FOREIGN KEY (cartridgeid) REFERENCES public.cartridges(id);

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT requestslist_requestid_fkey FOREIGN KEY (requestid) REFERENCES public.requests(id) ON DELETE CASCADE;

\unrestrict 2qyaYady0QkeyY9TqEH1l1vvr7ZbJhIjUTeDYtTXUmPlaQ2b5DQGuvfDUIe0YwI

