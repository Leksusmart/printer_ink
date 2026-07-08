--
-- PostgreSQL database dump
--

\restrict 2qyaYady0QkeyY9TqEH1l1vvr7ZbJhIjUTeDYtTXUmPlaQ2b5DQGuvfDUIe0YwI

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-07-07 11:39:40

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

--
-- TOC entry 220 (class 1259 OID 16486)
-- Name: cartridges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cartridges (
    id integer NOT NULL,
    model character varying(50) NOT NULL,
    guid character varying(36) NOT NULL,
    status character varying(20),
    isdefective boolean DEFAULT false,
    lastchangedata timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lastchangeby integer
);


ALTER TABLE public.cartridges OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16485)
-- Name: cartridges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cartridges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cartridges_id_seq OWNER TO postgres;

--
-- TOC entry 5058 (class 0 OID 0)
-- Dependencies: 219
-- Name: cartridges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cartridges_id_seq OWNED BY public.cartridges.id;


--
-- TOC entry 222 (class 1259 OID 16500)
-- Name: employers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employers (
    id integer NOT NULL,
    phone character varying(12) NOT NULL,
    fullname character varying(255) NOT NULL,
    role character varying(15) DEFAULT 'User'::character varying
);


ALTER TABLE public.employers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16499)
-- Name: employers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employers_id_seq OWNER TO postgres;

--
-- TOC entry 5059 (class 0 OID 0)
-- Dependencies: 221
-- Name: employers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employers_id_seq OWNED BY public.employers.id;


--
-- TOC entry 224 (class 1259 OID 16513)
-- Name: requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requests (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
	isDeflective bool,
    status character varying(20),
    data timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    employee integer,
    lastchangedata timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    lastchangeby integer,
    comment character varying(255)
);


ALTER TABLE public.requests OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16512)
-- Name: requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requests_id_seq OWNER TO postgres;

--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 223
-- Name: requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.requests_id_seq OWNED BY public.requests.id;


--
-- TOC entry 226 (class 1259 OID 16534)
-- Name: requestslist; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requestslist (
    id integer NOT NULL,
    requestid integer NOT NULL,
    cartridgeid integer NOT NULL
);


ALTER TABLE public.requestslist OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16533)
-- Name: requestslist_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.requestslist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requestslist_id_seq OWNER TO postgres;

--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 225
-- Name: requestslist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.requestslist_id_seq OWNED BY public.requestslist.id;


--
-- TOC entry 4871 (class 2604 OID 16489)
-- Name: cartridges id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartridges ALTER COLUMN id SET DEFAULT nextval('public.cartridges_id_seq'::regclass);


--
-- TOC entry 4874 (class 2604 OID 16503)
-- Name: employers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employers ALTER COLUMN id SET DEFAULT nextval('public.employers_id_seq'::regclass);


--
-- TOC entry 4876 (class 2604 OID 16516)
-- Name: requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests ALTER COLUMN id SET DEFAULT nextval('public.requests_id_seq'::regclass);


--
-- TOC entry 4879 (class 2604 OID 16537)
-- Name: requestslist id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requestslist ALTER COLUMN id SET DEFAULT nextval('public.requestslist_id_seq'::regclass);


--
-- TOC entry 5046 (class 0 OID 16486)
-- Dependencies: 220
-- Data for Name: cartridges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cartridges (id, model, guid, status, isdefective, lastchangedata, lastchangeby) FROM stdin;
1	HP LaserJet 12A	550e8400-e29b-41d4-a716-446655440000	Требуется заправка	f	2026-07-05 10:07:57.24339	\N
2	Canon 725	550e8400-e29b-41d4-a716-446655440001	Готов к выдаче	f	2026-07-05 10:07:57.24339	\N
3	Samsung MLT-D101S	550e8400-e29b-41d4-a716-446655440002	На ремонте	t	2026-07-05 10:07:57.24339	\N
4	Brother TN-1075	550e8400-e29b-41d4-a716-446655440003	Ожидает ремонта	t	2026-07-05 10:07:57.24339	\N
5	Xerox 3020	550e8400-e29b-41d4-a716-446655440004	Брак	t	2026-07-05 10:07:57.24339	\N
\.


--
-- TOC entry 5048 (class 0 OID 16500)
-- Dependencies: 222
-- Data for Name: employers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employers (id, phone, fullname, role) FROM stdin;
1	+79991112233	Иванов Иван Иванович	Admin
2	+79992223344	Петров Петр Петрович	User
3	+79993334455	Сидоров Сидор Сидорович	User
4	+79994445566	Алексеев Алексей Алексеевич	User
5	+79995556677	Николаев Николай Николаевич	User
\.


--
-- TOC entry 5050 (class 0 OID 16513)
-- Dependencies: 224
-- Data for Name: requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.requests (id, type, isDeflective, status, data, employee, lastchangedata, lastchangeby, comment) FROM stdin;
1	Выдача	\N	Завершена	2026-07-05 10:07:57.24339	2	2026-07-05 10:07:57.24339	\N	Выдан картридж для бухгалтерии
2	Прием	false	В обработке	2026-07-05 10:07:57.24339	3	2026-07-05 10:07:57.24339	\N	Сдали пустой картридж из кадров
3	Ремонт	true	В обработке	2026-07-05 10:07:57.24339	1	2026-07-05 10:07:57.24339	\N	Сильный треск при печати
4	Выдача	\N	Создана	2026-07-05 10:07:57.24339	4	2026-07-05 10:07:57.24339	\N	Заявка на картридж в архив
5	Прием	false	Завершена	2026-07-05 10:07:57.24339	5	2026-07-05 10:07:57.24339	\N	Плановая замена картриджа
\.


--
-- TOC entry 5052 (class 0 OID 16534)
-- Dependencies: 226
-- Data for Name: requestslist; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.requestslist (id, requestid, cartridgeid) FROM stdin;
1	1	2
2	2	1
3	3	3
4	4	4
5	5	5
\.


--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 219
-- Name: cartridges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cartridges_id_seq', 5, true);


--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 221
-- Name: employers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employers_id_seq', 5, true);


--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 223
-- Name: requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.requests_id_seq', 5, true);


--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 225
-- Name: requestslist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.requestslist_id_seq', 5, true);


--
-- TOC entry 4881 (class 2606 OID 16498)
-- Name: cartridges cartridges_guid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartridges
    ADD CONSTRAINT cartridges_guid_key UNIQUE (guid);


--
-- TOC entry 4883 (class 2606 OID 16496)
-- Name: cartridges cartridges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartridges
    ADD CONSTRAINT cartridges_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 16511)
-- Name: employers employers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_phone_key UNIQUE (phone);


--
-- TOC entry 4887 (class 2606 OID 16509)
-- Name: employers employers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employers
    ADD CONSTRAINT employers_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 16522)
-- Name: requests requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 16542)
-- Name: requestslist requestslist_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT requestslist_pkey PRIMARY KEY (id);


--
-- TOC entry 4893 (class 2606 OID 16554)
-- Name: requestslist unique_request_cartridge; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT unique_request_cartridge UNIQUE (requestid, cartridgeid);


--
-- TOC entry 4894 (class 2606 OID 16523)
-- Name: requests requests_employee_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_employee_fkey FOREIGN KEY (employee) REFERENCES public.employers(id);


--
-- TOC entry 4895 (class 2606 OID 16528)
-- Name: requests requests_lastchangeby_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requests
    ADD CONSTRAINT requests_lastchangeby_fkey FOREIGN KEY (lastchangeby) REFERENCES public.employers(id);


--
-- TOC entry 4896 (class 2606 OID 16548)
-- Name: requestslist requestslist_cartridgeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT requestslist_cartridgeid_fkey FOREIGN KEY (cartridgeid) REFERENCES public.cartridges(id);


--
-- TOC entry 4897 (class 2606 OID 16543)
-- Name: requestslist requestslist_requestid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requestslist
    ADD CONSTRAINT requestslist_requestid_fkey FOREIGN KEY (requestid) REFERENCES public.requests(id) ON DELETE CASCADE;


-- Completed on 2026-07-07 11:39:40

--
-- PostgreSQL database dump complete
--

\unrestrict 2qyaYady0QkeyY9TqEH1l1vvr7ZbJhIjUTeDYtTXUmPlaQ2b5DQGuvfDUIe0YwI

