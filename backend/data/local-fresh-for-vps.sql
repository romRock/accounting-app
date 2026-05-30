--
-- PostgreSQL database dump
--

\restrict f3QcHthW2J3CK2D7cu3Jk1cQtzFhRdFPWT15iOrgD75zFxv7WxsVbR9vkS0fbgA

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "users_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS "users_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.user_sessions DROP CONSTRAINT IF EXISTS "user_sessions_userId_fkey";
ALTER TABLE IF EXISTS ONLY public.parties DROP CONSTRAINT IF EXISTS "parties_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS "ledger_entries_createdBy_fkey";
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS "ledger_entries_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS "ledger_entries_accountEntryId_fkey";
ALTER TABLE IF EXISTS ONLY public.client_ledgers DROP CONSTRAINT IF EXISTS "client_ledgers_clientId_fkey";
ALTER TABLE IF EXISTS ONLY public.cities DROP CONSTRAINT IF EXISTS "cities_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.balance_sheets DROP CONSTRAINT IF EXISTS "balance_sheets_branchId_fkey";
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_createdBy_fkey";
ALTER TABLE IF EXISTS ONLY public.account_entries DROP CONSTRAINT IF EXISTS "account_entries_partyId_fkey";
ALTER TABLE IF EXISTS ONLY public.account_entries DROP CONSTRAINT IF EXISTS "account_entries_categoryId_fkey";
ALTER TABLE IF EXISTS ONLY public.account_categories DROP CONSTRAINT IF EXISTS "account_categories_parentId_fkey";
DROP INDEX IF EXISTS public.users_username_key;
DROP INDEX IF EXISTS public.users_username_idx;
DROP INDEX IF EXISTS public."users_roleId_idx";
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public."users_createdAt_idx";
DROP INDEX IF EXISTS public."users_branchId_idx";
DROP INDEX IF EXISTS public."user_sessions_userId_idx";
DROP INDEX IF EXISTS public."user_sessions_refreshToken_key";
DROP INDEX IF EXISTS public."user_sessions_refreshToken_idx";
DROP INDEX IF EXISTS public."user_sessions_expiresAt_idx";
DROP INDEX IF EXISTS public."user_sessions_createdAt_idx";
DROP INDEX IF EXISTS public.roles_name_key;
DROP INDEX IF EXISTS public.parties_name_idx;
DROP INDEX IF EXISTS public."parties_isActive_isDeleted_idx";
DROP INDEX IF EXISTS public."parties_createdAt_idx";
DROP INDEX IF EXISTS public.parties_city_idx;
DROP INDEX IF EXISTS public."parties_branchId_idx";
DROP INDEX IF EXISTS public."ledger_entries_transactionId_idx";
DROP INDEX IF EXISTS public.ledger_entries_date_idx;
DROP INDEX IF EXISTS public."ledger_entries_createdBy_idx";
DROP INDEX IF EXISTS public."ledger_entries_createdAt_idx";
DROP INDEX IF EXISTS public."ledger_entries_branchId_idx";
DROP INDEX IF EXISTS public."ledger_entries_accountType_idx";
DROP INDEX IF EXISTS public."ledger_entries_accountId_idx";
DROP INDEX IF EXISTS public."ledger_entries_accountEntryId_idx";
DROP INDEX IF EXISTS public."commission_rates_toCityId_idx";
DROP INDEX IF EXISTS public."commission_rates_rateType_idx";
DROP INDEX IF EXISTS public."commission_rates_fromCityId_idx";
DROP INDEX IF EXISTS public."commission_rates_createdAt_idx";
DROP INDEX IF EXISTS public."client_ledgers_financialYear_idx";
DROP INDEX IF EXISTS public."client_ledgers_createdAt_idx";
DROP INDEX IF EXISTS public."client_ledgers_clientId_key";
DROP INDEX IF EXISTS public."client_ledgers_clientId_idx";
DROP INDEX IF EXISTS public."client_ledgers_balanceType_idx";
DROP INDEX IF EXISTS public.cities_name_idx;
DROP INDEX IF EXISTS public."cities_isActive_isDeleted_idx";
DROP INDEX IF EXISTS public.cities_code_key;
DROP INDEX IF EXISTS public.cities_code_idx;
DROP INDEX IF EXISTS public.cities_code_branchid_key;
DROP INDEX IF EXISTS public."cities_branchId_idx";
DROP INDEX IF EXISTS public."branches_createdAt_idx";
DROP INDEX IF EXISTS public.branches_code_key;
DROP INDEX IF EXISTS public.branches_code_idx;
DROP INDEX IF EXISTS public.balance_sheets_date_idx;
DROP INDEX IF EXISTS public."balance_sheets_createdAt_idx";
DROP INDEX IF EXISTS public."balance_sheets_branchId_idx";
DROP INDEX IF EXISTS public.audit_logs_entity_idx;
DROP INDEX IF EXISTS public."audit_logs_entityId_idx";
DROP INDEX IF EXISTS public."audit_logs_createdBy_idx";
DROP INDEX IF EXISTS public."audit_logs_createdAt_idx";
DROP INDEX IF EXISTS public.audit_logs_action_idx;
DROP INDEX IF EXISTS public.account_entries_type_idx;
DROP INDEX IF EXISTS public."account_entries_partyId_idx";
DROP INDEX IF EXISTS public."account_entries_entryId_key";
DROP INDEX IF EXISTS public."account_entries_entryId_idx";
DROP INDEX IF EXISTS public.account_entries_date_idx;
DROP INDEX IF EXISTS public."account_entries_createdBy_idx";
DROP INDEX IF EXISTS public."account_entries_createdAt_idx";
DROP INDEX IF EXISTS public."account_entries_categoryId_idx";
DROP INDEX IF EXISTS public."account_entries_branchId_idx";
DROP INDEX IF EXISTS public.account_categories_type_idx;
DROP INDEX IF EXISTS public."account_categories_parentId_idx";
DROP INDEX IF EXISTS public."account_categories_createdAt_idx";
DROP INDEX IF EXISTS public."Transaction_type_status_idx";
DROP INDEX IF EXISTS public."Transaction_transactionId_key";
DROP INDEX IF EXISTS public."Transaction_transactionId_idx";
DROP INDEX IF EXISTS public."Transaction_isActive_isDeleted_idx";
DROP INDEX IF EXISTS public."Transaction_date_type_status_idx";
DROP INDEX IF EXISTS public."Transaction_date_type_idx";
DROP INDEX IF EXISTS public."Transaction_date_idx";
DROP INDEX IF EXISTS public."Transaction_createdBy_idx";
DROP INDEX IF EXISTS public."Transaction_centerId_idx";
DROP INDEX IF EXISTS public."Transaction_centerId_date_idx";
DROP INDEX IF EXISTS public."SpecialEntry_transactionId_key";
DROP INDEX IF EXISTS public."SpecialEntry_transactionId_idx";
DROP INDEX IF EXISTS public."SpecialEntry_partyC_idx";
DROP INDEX IF EXISTS public."SpecialEntry_partyB_idx";
DROP INDEX IF EXISTS public."SpecialEntry_partyA_idx";
DROP INDEX IF EXISTS public."SpecialEntry_date_idx";
DROP INDEX IF EXISTS public."SpecialEntry_createdBy_idx";
DROP INDEX IF EXISTS public."Hawala_transactionId_key";
DROP INDEX IF EXISTS public."Hawala_transactionId_idx";
DROP INDEX IF EXISTS public."Hawala_partyB_idx";
DROP INDEX IF EXISTS public."Hawala_partyA_idx";
DROP INDEX IF EXISTS public."Hawala_date_idx";
DROP INDEX IF EXISTS public."Hawala_createdBy_idx";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_sessions DROP CONSTRAINT IF EXISTS user_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.parties DROP CONSTRAINT IF EXISTS parties_pkey;
ALTER TABLE IF EXISTS ONLY public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.commission_rates DROP CONSTRAINT IF EXISTS commission_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.client_ledgers DROP CONSTRAINT IF EXISTS client_ledgers_pkey;
ALTER TABLE IF EXISTS ONLY public.cities DROP CONSTRAINT IF EXISTS cities_pkey;
ALTER TABLE IF EXISTS ONLY public.branches DROP CONSTRAINT IF EXISTS branches_pkey;
ALTER TABLE IF EXISTS ONLY public.balance_sheets DROP CONSTRAINT IF EXISTS balance_sheets_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.account_entries DROP CONSTRAINT IF EXISTS account_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.account_categories DROP CONSTRAINT IF EXISTS account_categories_pkey;
ALTER TABLE IF EXISTS ONLY public."Transaction" DROP CONSTRAINT IF EXISTS "Transaction_pkey";
ALTER TABLE IF EXISTS ONLY public."SpecialEntry" DROP CONSTRAINT IF EXISTS "SpecialEntry_pkey";
ALTER TABLE IF EXISTS ONLY public."Hawala" DROP CONSTRAINT IF EXISTS "Hawala_pkey";
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_sessions;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.parties;
DROP TABLE IF EXISTS public.ledger_entries;
DROP TABLE IF EXISTS public.commission_rates;
DROP TABLE IF EXISTS public.client_ledgers;
DROP TABLE IF EXISTS public.cities;
DROP TABLE IF EXISTS public.branches;
DROP TABLE IF EXISTS public.balance_sheets;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.account_entries;
DROP TABLE IF EXISTS public.account_categories;
DROP TABLE IF EXISTS public."Transaction";
DROP TABLE IF EXISTS public."SpecialEntry";
DROP TABLE IF EXISTS public."Hawala";
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Hawala; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Hawala" (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "tokenNo" integer,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "time" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "partyA" text NOT NULL,
    "partyB" text NOT NULL,
    amount integer NOT NULL,
    remark text,
    status boolean DEFAULT true NOT NULL,
    "statusTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "branchId" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SpecialEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpecialEntry" (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "tokenNo" integer,
    date timestamp(3) without time zone NOT NULL,
    "time" timestamp(3) without time zone NOT NULL,
    "partyA" text NOT NULL,
    "amountA" integer NOT NULL,
    "partyB" text NOT NULL,
    "amountB" integer NOT NULL,
    "partyC" text,
    "amountC" integer,
    remark text,
    status text NOT NULL,
    "statusTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "branchId" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "tokenNo" integer,
    date timestamp(3) without time zone NOT NULL,
    "time" timestamp(3) without time zone NOT NULL,
    "centerId" text NOT NULL,
    amount integer NOT NULL,
    "amountType" text NOT NULL,
    commission integer DEFAULT 0 NOT NULL,
    "bookingCommission" integer DEFAULT 0 NOT NULL,
    "centerCommission" integer DEFAULT 0 NOT NULL,
    "autoCommission" boolean DEFAULT true NOT NULL,
    "receiverName" text NOT NULL,
    "receiverNumber" text,
    "senderName" text NOT NULL,
    "senderNumber" text,
    "receiverClientId" text,
    "senderClientId" text,
    remark text,
    status boolean DEFAULT true NOT NULL,
    "statusTime" timestamp(3) without time zone NOT NULL,
    type text DEFAULT 'OUTWARD'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "branchId" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: account_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_categories (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    "parentId" text,
    "gstApplicable" boolean DEFAULT false NOT NULL,
    "tdsApplicable" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: account_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_entries (
    id text NOT NULL,
    "entryId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "categoryId" text NOT NULL,
    amount double precision NOT NULL,
    description text,
    "partyId" text,
    "paymentMethod" text,
    "referenceNo" text,
    "gstAmount" double precision DEFAULT 0 NOT NULL,
    "tdsAmount" double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision NOT NULL,
    type text NOT NULL,
    "statusTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "branchId" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    entity text NOT NULL,
    "entityId" text NOT NULL,
    action text NOT NULL,
    "oldValues" text,
    "newValues" text,
    "ipAddress" text,
    "userAgent" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text NOT NULL
);


--
-- Name: balance_sheets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balance_sheets (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "openingBalance" double precision NOT NULL,
    "closingBalance" double precision NOT NULL,
    "totalAssets" double precision NOT NULL,
    "totalLiabilities" double precision NOT NULL,
    "totalEquity" double precision NOT NULL,
    "branchId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    state text,
    address text,
    number text,
    "branchId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: client_ledgers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_ledgers (
    id text NOT NULL,
    "clientId" text NOT NULL,
    "openingBalance" double precision DEFAULT 0 NOT NULL,
    "currentBalance" double precision DEFAULT 0 NOT NULL,
    "lastTransactionDate" timestamp(3) without time zone,
    "balanceType" text DEFAULT 'DEBIT'::text NOT NULL,
    "financialYear" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text NOT NULL
);


--
-- Name: commission_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_rates (
    id text NOT NULL,
    "fromCityId" text NOT NULL,
    "toCityId" text NOT NULL,
    "rateType" text NOT NULL,
    rate double precision NOT NULL,
    "minAmount" double precision,
    "maxAmount" double precision,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ledger_entries (
    id text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "accountId" text NOT NULL,
    "accountType" text NOT NULL,
    description text NOT NULL,
    "debitAmount" double precision,
    "creditAmount" double precision,
    balance double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "deletedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "transactionId" text,
    "branchId" text,
    "createdBy" text NOT NULL,
    "accountEntryId" text
);


--
-- Name: parties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parties (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    city text,
    "panNumber" text,
    "gstNumber" text,
    "branchId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "refreshToken" text NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    "isActive" boolean DEFAULT true NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "roleId" text NOT NULL,
    "branchId" text
);


--
-- Data for Name: Hawala; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Hawala" (id, "transactionId", "tokenNo", date, "time", "partyA", "partyB", amount, remark, status, "statusTime", "isActive", "isDeleted", "deletedAt", "deletedBy", "branchId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SpecialEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SpecialEntry" (id, "transactionId", "tokenNo", date, "time", "partyA", "amountA", "partyB", "amountB", "partyC", "amountC", remark, status, "statusTime", "isActive", "isDeleted", "deletedAt", "deletedBy", "branchId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Transaction" (id, "transactionId", "tokenNo", date, "time", "centerId", amount, "amountType", commission, "bookingCommission", "centerCommission", "autoCommission", "receiverName", "receiverNumber", "senderName", "senderNumber", "receiverClientId", "senderClientId", remark, status, "statusTime", type, "isActive", "isDeleted", "deletedAt", "deletedBy", "branchId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: account_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_categories (id, name, type, description, "parentId", "gstApplicable", "tdsApplicable", "isActive", "isDeleted", "createdAt", "updatedAt") FROM stdin;
cat-1	Cash	INCOME	Cash income entries	\N	f	f	t	f	2026-05-28 06:35:36.414	2026-05-28 06:35:36.414
cat-2	LBL	INCOME	LBL income entries (Label/Entry/Token)	\N	f	f	t	f	2026-05-28 06:35:36.414	2026-05-28 06:35:36.414
cat-3	LBL	EXPENSE	LBL expense entries (Label/Entry/Token)	\N	f	f	t	f	2026-05-28 06:35:36.414	2026-05-28 06:35:36.414
cat-4	Money Transfer	EXPENSE	Money transfer expenses	\N	f	f	t	f	2026-05-28 06:35:36.414	2026-05-28 06:35:36.414
\.


--
-- Data for Name: account_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_entries (id, "entryId", date, "categoryId", amount, description, "partyId", "paymentMethod", "referenceNo", "gstAmount", "tdsAmount", "totalAmount", type, "statusTime", "isActive", "isDeleted", "deletedAt", "deletedBy", "branchId", "createdBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, entity, "entityId", action, "oldValues", "newValues", "ipAddress", "userAgent", "isActive", "isDeleted", "createdAt", "createdBy") FROM stdin;
cmpp57lzp000iii2k36ztvu50	AccountEntry	cmpp57iy0000eii2k4i0k4a89	DELETE	{"id":"cmpp57iy0000eii2k4i0k4a89","entryId":"TRN001","date":"2026-05-28T00:00:00.000Z","categoryId":"cat-2","amount":50000,"description":"","partyId":"cmpp57ixv000cii2knxc9o5fx","paymentMethod":null,"referenceNo":null,"gstAmount":0,"tdsAmount":0,"totalAmount":50000,"type":"INCOME","statusTime":"2026-05-28T06:59:32.124Z","isActive":true,"isDeleted":false,"deletedAt":null,"deletedBy":null,"branchId":null,"createdBy":"cmpp47abo0001ii2knuh2yues","createdAt":"2026-05-28T06:59:32.136Z","updatedAt":"2026-05-28T06:59:32.136Z"}	{"deleted":true,"softDelete":true}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	f	2026-05-28 06:59:36.086	cmpp47abo0001ii2knuh2yues
cmps8wov70005mf1n4fywnvd9	Party	cmps6iov10001i21jw7oyt8jf	UPDATE	{"id":"cmps6iov10001i21jw7oyt8jf","name":"3K(KKK)","phone":"9778860852","email":null,"address":null,"city":null,"panNumber":null,"gstNumber":null,"branchId":"cmps2l3x3000011oto35qgrdq","isActive":true,"isDeleted":false,"createdAt":"2026-05-30T09:59:31.164Z","updatedAt":"2026-05-30T09:59:31.164Z"}	{"id":"cmps6iov10001i21jw7oyt8jf","name":"3K(KKK)","phone":"9778860854","email":null,"address":null,"city":"jnd","panNumber":null,"gstNumber":null,"branchId":"cmps2l3x3000011oto35qgrdq","isActive":true,"isDeleted":false,"createdAt":"2026-05-30T09:59:31.164Z","updatedAt":"2026-05-30T11:06:23.563Z"}	127.0.0.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	f	2026-05-30 11:06:23.588	cmps2l4hc000811otw0qw2n4k
cmps97ks80003o8keu4xuo92a	City	cmps8ocoi0003mf1nonxes9lq	DELETE	{"id":"cmps8ocoi0003mf1nonxes9lq","name":"SORATHIYAWADI 25","code":"SOR001","state":"GUJARAT","address":null,"number":null,"branchId":"cmps2l3x3000011oto35qgrdq","isActive":true,"isDeleted":false,"createdAt":"2026-05-30T10:59:54.546Z","updatedAt":"2026-05-30T11:00:06.636Z"}	\N	127.0.0.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	f	2026-05-30 11:14:51.513	cmps2l4hc000811otw0qw2n4k
cmps97tt10005o8keyghcq36a	Party	cmps8x2730007mf1n3i77dibx	DELETE	{"id":"cmps8x2730007mf1n3i77dibx","name":"AAA","phone":"8780670096","email":null,"address":null,"city":"jnd","panNumber":null,"gstNumber":null,"branchId":"cmps2l3x3000011oto35qgrdq","isActive":true,"isDeleted":false,"createdAt":"2026-05-30T11:06:40.862Z","updatedAt":"2026-05-30T11:06:40.862Z"}	\N	127.0.0.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	f	2026-05-30 11:15:03.205	cmps2l4hc000811otw0qw2n4k
cmps99cwe000do8kef93keil2	Party	cmps995cp000bo8kexskw2564	UPDATE	{"id":"cmps995cp000bo8kexskw2564","name":"romil","phone":"8780670096","email":null,"address":null,"city":"JND","panNumber":null,"gstNumber":null,"branchId":"cmps2l3yb000111otsxcjhs5f","isActive":true,"isDeleted":false,"createdAt":"2026-05-30T11:16:04.826Z","updatedAt":"2026-05-30T11:16:04.826Z"}	{"id":"cmps995cp000bo8kexskw2564","name":"romil","phone":"7777777777","email":null,"address":null,"city":"JND","panNumber":null,"gstNumber":null,"branchId":"cmps2l3yb000111otsxcjhs5f","isActive":true,"isDeleted":false,"createdAt":"2026-05-30T11:16:04.826Z","updatedAt":"2026-05-30T11:16:14.603Z"}	127.0.0.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	f	2026-05-30 11:16:14.606	cmps2l4qb000a11otxq281suw
cmps99v71000ho8kexn3bg6br	Party	cmps99qrb000fo8keotp4dclq	DELETE	{"id":"cmps99qrb000fo8keotp4dclq","name":"rocky","phone":"9099916300","email":null,"address":null,"city":"jnd","panNumber":null,"gstNumber":null,"branchId":"cmps2l3yb000111otsxcjhs5f","isActive":true,"isDeleted":false,"createdAt":"2026-05-30T11:16:32.566Z","updatedAt":"2026-05-30T11:16:32.566Z"}	\N	127.0.0.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	f	2026-05-30 11:16:38.317	cmps2l4qb000a11otxq281suw
cmpsa267w000dbcr80o3s68hl	SpecialEntry	cmpsa2674000bbcr8mj446vzz	CREATE	\N	{"id":"cmpsa2674000bbcr8mj446vzz","transactionId":"SPL001","tokenNo":1,"date":"2026-05-30T00:00:00.000Z","time":"2026-05-30T11:38:00.000Z","partyA":"AD TKN","amountA":50000,"partyB":"3K(KKK)","amountB":49500,"partyC":"ADVANCE LBL","amountC":500,"remark":"","status":"pending","statusTime":"2026-05-30T11:38:38.942Z","isActive":true,"isDeleted":false,"deletedAt":null,"deletedBy":null,"branchId":"cmps2l3x3000011oto35qgrdq","createdBy":"cmps2l4hc000811otw0qw2n4k","createdAt":"2026-05-30T11:38:38.944Z","updatedAt":"2026-05-30T11:38:38.944Z"}	127.0.0.1	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36	t	f	2026-05-30 11:38:38.971	cmps2l4hc000811otw0qw2n4k
cmpsb6y9w000gl24jlzaw15sb	SpecialEntry	cmpsb6y91000el24j3v38rw6t	CREATE	\N	{"id":"cmpsb6y91000el24j3v38rw6t","transactionId":"SPL002","tokenNo":1,"date":"2026-05-29T00:00:00.000Z","time":"2026-05-29T12:10:00.000Z","partyA":"ADVANCE LBL","amountA":200000,"partyB":"AED NJ","amountB":199800,"partyC":"AKASHBHAI JP","amountC":200,"remark":"","status":"pending","statusTime":"2026-05-30T12:10:21.540Z","isActive":true,"isDeleted":false,"deletedAt":null,"deletedBy":null,"branchId":"cmps2l3x3000011oto35qgrdq","createdBy":"cmps2l4hc000811otw0qw2n4k","createdAt":"2026-05-30T12:10:21.542Z","updatedAt":"2026-05-30T12:10:21.542Z"}	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	f	2026-05-30 12:10:21.572	cmps2l4hc000811otw0qw2n4k
\.


--
-- Data for Name: balance_sheets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.balance_sheets (id, date, "openingBalance", "closingBalance", "totalAssets", "totalLiabilities", "totalEquity", "branchId", "isActive", "isDeleted", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.branches (id, name, code, address, phone, email, "isActive", "isDeleted", "createdAt", "updatedAt") FROM stdin;
cmps2l3x3000011oto35qgrdq	PM2 Branch	PM2	\N	\N	\N	t	f	2026-05-30 08:09:25.527	2026-05-30 08:09:25.527
cmps2l3yb000111otsxcjhs5f	VPATEL Branch	VP	\N	\N	\N	t	f	2026-05-30 08:09:25.53	2026-05-30 08:09:25.53
cmps35tin0002aq9b2aw21wlw	SHREE angadiya	SRA	\N	\N	\N	t	f	2026-05-30 08:25:31.824	2026-05-30 08:25:31.824
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cities (id, name, code, state, address, number, "branchId", "isActive", "isDeleted", "createdAt", "updatedAt") FROM stdin;
cmps8ocoi0003mf1nonxes9lq	SORATHIYAWADI 25	SOR001	GUJARAT	\N	\N	cmps2l3x3000011oto35qgrdq	f	t	2026-05-30 10:59:54.546	2026-05-30 11:14:51.504
cmps98tt60009o8kelkm3dgoh	SORATHIYAWADI	srw	gujarat	\N	\N	cmps2l3yb000111otsxcjhs5f	t	f	2026-05-30 11:15:49.866	2026-05-30 11:15:49.866
cmps9bw5v000no8ketn1l4a20	GURUKUL	GRL	GUJARAT	\N	\N	cmps2l3yb000111otsxcjhs5f	t	f	2026-05-30 11:18:12.884	2026-05-30 11:18:12.884
cmpp3wx3o0000z8b4rucx90p8	C.G. ROAD	CGR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.653	2026-05-30 09:59:31.105
cmpp3wx3u0001z8b4k3mmosvu	RATANPOLE	RAT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.659	2026-05-30 09:59:31.105
cmpp3wx3y0002z8b4dglya6k7	BAPUNAGAR	BAP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.662	2026-05-30 09:59:31.105
cmpp3wx410003z8b4ute9wvhw	BOPAL	BOP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.665	2026-05-30 09:59:31.105
cmpp3wx430004z8b4191tgqdp	GOTA	GOT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.667	2026-05-30 09:59:31.105
cmpp3wx440005z8b4cczogcgs	GURUKUL	GUR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.669	2026-05-30 09:59:31.105
cmpp3wx460006z8b4b525fbtu	KALUPUR	KAL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.671	2026-05-30 09:59:31.105
cmpp3wx480007z8b4v8bz5hr7	MADHUPURA	MAD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.672	2026-05-30 09:59:31.105
cmpp3wx490008z8b42rjwdzdk	NARODA	NAR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.674	2026-05-30 09:59:31.105
cmpp3wx4b0009z8b4h09sun56	NAROL	NA1	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.675	2026-05-30 09:59:31.105
cmpp3wx4c000az8b43j4gxyur	ODHAV	ODH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.676	2026-05-30 09:59:31.105
cmpp3wx4f000bz8b4otzrikrf	ASHRAM ROAD	ASH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.679	2026-05-30 09:59:31.105
cmpp3wx4g000cz8b48vjxh9i5	RAKHIYAL	RAK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.68	2026-05-30 09:59:31.105
cmpp3wx4h000dz8b4dbb79ul3	CHANGODAR	CHA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.681	2026-05-30 09:59:31.105
cmpp3wx4i000ez8b4eerhcmi7	SATELLITE	SAT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.682	2026-05-30 09:59:31.105
cmpp3wx4i000fz8b429kfri2t	RANIP	RAN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.683	2026-05-30 09:59:31.105
cmpp3wx4k000gz8b45vc54h8y	SCIENCE CITY	SCI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.684	2026-05-30 09:59:31.105
cmpp3wx4l000hz8b46309azit	SARKHEJ	SAR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.685	2026-05-30 09:59:31.105
cmpp3wx4m000iz8b4qt5ajkr9	VATVA	VAT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.686	2026-05-30 09:59:31.105
cmpp3wx4n000jz8b40930ea3y	CHANDKHEDA	CH1	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.687	2026-05-30 09:59:31.105
cmpp3wx4n000kz8b4alg0v39k	MANINAGAR	MNI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.688	2026-05-30 09:59:31.105
cmpp3wx4o000lz8b49ia0cod0	NIKOL	NIK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.689	2026-05-30 09:59:31.105
cmpp3wx4p000mz8b4m27a8tur	VASTRAPUR	VAS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.69	2026-05-30 09:59:31.105
cmpp3wx4q000nz8b4rjxckkk5	KATHWADA G.I.D.C	KTH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.691	2026-05-30 09:59:31.105
cmpp3wx4r000oz8b4mm2glwxo	VASNA A.P.M.C.	VA1	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.692	2026-05-30 09:59:31.105
cmpp3wx4s000pz8b4vpo29yhu	GITA MANDIR	GIT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.693	2026-05-30 09:59:31.105
cmpp3wx4u000qz8b4njeg2tqs	RAKANPUR-BHADAJ	RBH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.694	2026-05-30 09:59:31.105
cmpp3wx4u000rz8b492ips5p2	C.T.M	CTM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.695	2026-05-30 09:59:31.105
cmpp3wx4v000sz8b443ncwhbf	BAKROL G.I.D.C BUJRANG	BAK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.696	2026-05-30 09:59:31.105
cmpp3wx4x000tz8b4oqn4anjb	VEJALPUR	VEJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.697	2026-05-30 09:59:31.105
cmpp3wx4y000uz8b4d277vjl4	K.K. NAGAR	KKN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.698	2026-05-30 09:59:31.105
cmpp3wx4z000vz8b4ajvjzyf8	NEW CLOTH GHANTAKARNA MARKET	NCG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.699	2026-05-30 09:59:31.105
cmpp3wx50000wz8b4fdia43vx	MEMCO	MEM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.7	2026-05-30 09:59:31.105
cmpp3wx51000xz8b48lbbkfho	SOUTH BOPAL	SBO	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.701	2026-05-30 09:59:31.105
cmpp3wx52000yz8b4aeodqv4i	MIRZAPUR	MIR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.702	2026-05-30 09:59:31.105
cmpp3wx53000zz8b4sgcj1xqn	SINDHU BHAVAN	SIN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.703	2026-05-30 09:59:31.105
cmpp3wx540010z8b4r56v10zy	PALDI	PLD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.704	2026-05-30 09:59:31.105
cmpp3wx540011z8b4228vezzj	VASTRAL	VA2	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.705	2026-05-30 09:59:31.105
cmpp3wx550012z8b416yzgmuv	VINZOL	VIN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.706	2026-05-30 09:59:31.105
cmpp3wx560013z8b4zifei53p	NEW RANIP	NRA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.707	2026-05-30 09:59:31.105
cmpp3wx580014z8b40i8qik9k	ANKUR CHAR RASTA	ANC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.708	2026-05-30 09:59:31.105
cmpp3wx590015z8b4at59i64d	NANA CHILODA	NCH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.709	2026-05-30 09:59:31.105
cmpp3wx5a0016z8b44v0xipy8	HANSPURA	HAN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.71	2026-05-30 09:59:31.105
cmpp3wx5b0017z8b44f2j0pij	DHANDHUKA	DHA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.711	2026-05-30 09:59:31.105
cmpp3wx5c0018z8b41433rthh	DHOLKA	DHO	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.712	2026-05-30 09:59:31.105
cmpp3wx5d0019z8b4yhri1nus	VATAMAN CHOKDI	VTC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.713	2026-05-30 09:59:31.105
cmpp3wx5e001az8b4oohyj1cs	BAVLA	BAV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.714	2026-05-30 09:59:31.105
cmpp3wx5f001bz8b47gwaj8qp	SANAND	SAN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.715	2026-05-30 09:59:31.105
cmpp3wx5g001cz8b43o3axd1v	MANDAL	MA1	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.716	2026-05-30 09:59:31.105
cmpp3wx5h001dz8b4gg340pwb	VIRAMGAM	VIR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.717	2026-05-30 09:59:31.105
cmpp3wx8b001ez8b4hforxj14	DHOLERA	DH1	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.819	2026-05-30 09:59:31.105
cmpp3wx8d001fz8b4u84tbfjz	GANDHINAGAR SECTOR 3	GAN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.821	2026-05-30 09:59:31.105
cmpp3wx8e001gz8b4offxbxvj	GANDHINAGAR KUDASAN	GAK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.822	2026-05-30 09:59:31.105
cmpp3wx8f001hz8b4ih6yqlk8	DAHEGAM	DAH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.823	2026-05-30 09:59:31.105
cmpp3wx8g001iz8b4k5nhgx0k	MANSA	MAN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.825	2026-05-30 09:59:31.105
cmpp3wx8h001jz8b4tli4yvxa	KALOL	KLL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.826	2026-05-30 09:59:31.105
cmpp3wx8i001kz8b4sasd3gju	CHHATRAL	CHH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.827	2026-05-30 09:59:31.105
cmpp3wx8j001lz8b4skvuslnp	HIMMATNAGAR	HIM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.828	2026-05-30 09:59:31.105
cmpp3wx8k001mz8b4p3o8qz43	IDAR	IDA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.829	2026-05-30 09:59:31.105
cmpp3wx8l001nz8b4hyp5ro89	MODASA	MOD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.83	2026-05-30 09:59:31.105
cmpp3wx8m001oz8b4gutf4q6p	BAYAD	BAY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.831	2026-05-30 09:59:31.105
cmpp3wx8n001pz8b4zuu7r00z	KHEDBRAHMA	KHD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.832	2026-05-30 09:59:31.105
cmpp3wx8o001qz8b4c99e7p32	PRANTIJ	PRA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.833	2026-05-30 09:59:31.105
cmpp3wx8p001rz8b446dsg7cn	SULTANPURA VADODARA	SUL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.834	2026-05-30 09:59:31.105
cmpp3wx8q001sz8b4lldp2111	ALKAPURI VADODARA	ALK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.835	2026-05-30 09:59:31.105
cmpp3wx8r001tz8b4sdqyft18	MAKARPURA G.I.D.C VADODARA	MAK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.836	2026-05-30 09:59:31.105
cmpp3wx8s001uz8b41knztvpx	CHHANI JAKATNAKA VADODARA	CHJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.837	2026-05-30 09:59:31.105
cmpp3wx8u001vz8b4meq7q9mn	AJWA CHOKDI VADODARA	AJW	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.838	2026-05-30 09:59:31.105
cmpp3wx8v001wz8b49v560c0u	GOTRI VADODARA	GTV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.839	2026-05-30 09:59:31.105
cmpp3wx8v001xz8b4cjpu1nq3	SAMA-SAVLI VADODARA	SAM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.84	2026-05-30 09:59:31.105
cmpp3wx8w001yz8b4bv3r94zd	VASNA-BHAYLI VADODADRA	VAB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.841	2026-05-30 09:59:31.105
cmpp3wx8x001zz8b4pxr2mf7h	SAVLI	SAV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.842	2026-05-30 09:59:31.105
cmpp3wx8y0020z8b4xvoyvs3e	WAGHODIA ROAD PARIVAR CHOKDI VADODARA	WAG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.843	2026-05-30 09:59:31.105
cmpp3wx8z0021z8b4enh5rqrs	PRATAPNAGAR VADODARA	PRT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.844	2026-05-30 09:59:31.105
cmpp3wx900022z8b41gzieoub	TARAPUR	TAR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.845	2026-05-30 09:59:31.105
cmpp3wx910023z8b4dkzq6mht	NADIAD	NAD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.846	2026-05-30 09:59:31.105
cmpp3wx930024z8b4lvf2e7wp	ANAND	ANA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.847	2026-05-30 09:59:31.105
cmpp3wx940025z8b45fe1edhz	UMRETH	UMR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.849	2026-05-30 09:59:31.105
cmpp3wx960026z8b4uuzwmy4n	KHEDA	KHE	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.85	2026-05-30 09:59:31.105
cmpp3wx990027z8b4531avmiz	KAPADVANJ	KAP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.853	2026-05-30 09:59:31.105
cmpp3wx9a0028z8b4kfvhn6by	KATHLAL	KAT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.854	2026-05-30 09:59:31.105
cmpp3wx9b0029z8b4j8czphb8	VALLABH VIDHYANAGAR	VAL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.855	2026-05-30 09:59:31.105
cmpp3wx9c002az8b42attwzow	PETLAD	PET	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.857	2026-05-30 09:59:31.105
cmpp3wx9d002bz8b43pilowjv	BORSAD	BOR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.858	2026-05-30 09:59:31.105
cmpp3wx9f002cz8b4b4asdxo2	KHAMBHAT	KHA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.859	2026-05-30 09:59:31.105
cmpp3wx9g002dz8b4h86sdb2n	DAHOD	DHD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.861	2026-05-30 09:59:31.105
cmpp3wx9h002ez8b4u411575c	PIPLOD	PIP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.862	2026-05-30 09:59:31.105
cmpp3wx9i002fz8b4l0txk369	GODHRA	GOD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.863	2026-05-30 09:59:31.105
cmpp3wx9j002gz8b4z73njjz4	HALOL	HAL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.864	2026-05-30 09:59:31.105
cmpp3wx9k002hz8b4r6p4w3mm	LUNAWADA	LUN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.865	2026-05-30 09:59:31.105
cmpp3wx9l002iz8b4zmxl4n2j	KALOL ( PANCHMAHAL )	KA1	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.866	2026-05-30 09:59:31.105
cmpp3wx9m002jz8b4440z4j4y	PADRA	PAD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.867	2026-05-30 09:59:31.105
cmpp3wx9n002kz8b4j7v6litq	DABHOI	DAB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.868	2026-05-30 09:59:31.105
cmpp3wx9o002lz8b4eg2fnecl	BODELI	BOD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.869	2026-05-30 09:59:31.105
cmpp3wx9q002mz8b4efijyrw1	CHHOTA UDEPUR	CHU	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.87	2026-05-30 09:59:31.105
cmpp3wx9r002nz8b4tcg2usc8	VARACHHA	VAR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.871	2026-05-30 09:59:31.105
cmpp3wx9s002oz8b4wv3qcolq	MOTA VARACHHA	MVA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.872	2026-05-30 09:59:31.105
cmpp3wx9t002pz8b4rehc9lga	MAHIDHARPURA	MHD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.873	2026-05-30 09:59:31.105
cmpp3wx9u002qz8b42au7ij26	A.K.ROAD	AKR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.874	2026-05-30 09:59:31.105
cmpp3wx9u002rz8b4h77ov58u	HIRABAUG	HIR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.875	2026-05-30 09:59:31.105
cmpp3wxco002sz8b4zx8fl75d	KATARGAM	KAG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.977	2026-05-30 09:59:31.105
cmpp3wxcr002tz8b4oj57pjan	ATHWALINES	ATH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.979	2026-05-30 09:59:31.105
cmpp3wxcs002uz8b4gzv6i263	ADAJAN	ADA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.981	2026-05-30 09:59:31.105
cmpp3wxcu002vz8b4zaauzp20	PAL	PAL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.982	2026-05-30 09:59:31.105
cmpp3wxcv002wz8b4kq4fo8mj	SARTHANA JAKAT NAKA	SJN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.984	2026-05-30 09:59:31.105
cmpp3wxcw002xz8b4ewht50j8	UDHNA	UDH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.985	2026-05-30 09:59:31.105
cmpp3wxcy002yz8b4955ld88f	KAMREJ	KAM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.986	2026-05-30 09:59:31.105
cmpp3wxd0002zz8b4kykurins	SAHARA DARWAJA	SHD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.988	2026-05-30 09:59:31.105
cmpp3wxd10030z8b4z09zvp7m	BHATAR	BHT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.99	2026-05-30 09:59:31.105
cmpp3wxd20031z8b40a19s7fc	SACHIN	SAC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.991	2026-05-30 09:59:31.105
cmpp3wxd30032z8b4kcg82xnh	BHAGAL	BHG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.992	2026-05-30 09:59:31.105
cmpp3wxd40033z8b4u3c6k7ke	VESU	VES	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.993	2026-05-30 09:59:31.105
cmpp3wxd50034z8b41isxe3hh	PARVAT PATIYA	PVP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.994	2026-05-30 09:59:31.105
cmpp3wxd60035z8b47f2j09p5	PARLE POINT GHOD DOD ROAD	PPG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.995	2026-05-30 09:59:31.105
cmpp3wxd70036z8b469wzpz5f	RANDER	RND	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.996	2026-05-30 09:59:31.105
cmpp3wxd80037z8b4bj0zc7wj	YOGI CHOWK	YOC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.997	2026-05-30 09:59:31.105
cmpp3wxd90038z8b4mtcm232r	CHAUTA BAZAR	CHB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.998	2026-05-30 09:59:31.105
cmpp3wxda0039z8b4god1db7t	ALTHAN	ALT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:17.999	2026-05-30 09:59:31.105
cmpp3wxdc003az8b4gvajgzj3	AMROLI	AMR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.001	2026-05-30 09:59:31.105
cmpp3wxdd003bz8b4tiidu13w	KIM	KIM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.002	2026-05-30 09:59:31.105
cmpp3wxdf003cz8b434ws26tw	DABHOLI	DBH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.003	2026-05-30 09:59:31.105
cmpp3wxdg003dz8b4sn6f9zhe	NAVSARI	NAV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.004	2026-05-30 09:59:31.105
cmpp3wxdh003ez8b4xdo58utu	CHIKHLI	CHK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.006	2026-05-30 09:59:31.105
cmpp3wxdj003fz8b4j5ujo2mn	VALSAD	VLS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.008	2026-05-30 09:59:31.105
cmpp3wxdk003gz8b4h4yplfw3	DHARMPUR	DHP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.009	2026-05-30 09:59:31.105
cmpp3wxdl003hz8b4n1aw0rjh	VAPI	VAP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.01	2026-05-30 09:59:31.105
cmpp3wxdm003iz8b4msymekj0	ANKLESHWAR STATION ROAD	ASR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.011	2026-05-30 09:59:31.105
cmpp3wxdn003jz8b42ykmvjmw	ANKLESHWAR G.I.D.C	AGI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.012	2026-05-30 09:59:31.105
cmpp3wxdo003kz8b49cxpy4bl	GOLDEN POINT CHOKDI	GPC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.013	2026-05-30 09:59:31.105
cmpp3wxdp003lz8b4ltdgdj3q	BHARUCH	BRC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.014	2026-05-30 09:59:31.105
cmpp3wxdq003mz8b4d8f0q8ch	BILIMORA	BLM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.015	2026-05-30 09:59:31.105
cmpp3wxdt003nz8b4iyv906qc	BARDOLI	BRD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.018	2026-05-30 09:59:31.105
cmpp3wxdu003oz8b47fuyez9g	VYARA	VYA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.019	2026-05-30 09:59:31.105
cmpp3wxdv003pz8b4szn5u3fl	MANDVI	MDV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.02	2026-05-30 09:59:31.105
cmpp3wxdw003qz8b4rhp9e5p2	RAJPUTPARA	RJP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.021	2026-05-30 09:59:31.105
cmpp3wxdx003rz8b4gcr2oppy	SONIBAZAR	SNB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.021	2026-05-30 09:59:31.105
cmpp3wxdy003sz8b4es5m4llj	UNIVERSITY	UNI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.023	2026-05-30 09:59:31.105
cmpp3wxdz003tz8b45nfztx4a	DANAPITH	DNP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.024	2026-05-30 09:59:31.105
cmpp3wxe0003uz8b4w2lfl2wc	BHAKTINAGAR	BKT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.025	2026-05-30 09:59:31.105
cmpp3wxe1003vz8b4c37s1bv1	RAJKOT YARD OLD	RYO	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.026	2026-05-30 09:59:31.105
cmpp3wxe2003wz8b4wvjku512	RAJKOT YARD NEW BEDI YARD	RNB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.027	2026-05-30 09:59:31.105
cmpp3wxe4003xz8b4s4zm4tbw	RAIYA ROAD	RAR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.028	2026-05-30 09:59:31.105
cmpp3wxe5003yz8b4mb54k9v2	AMIN MARG	AMM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.029	2026-05-30 09:59:31.105
cmpp3wxe6003zz8b4zjwtd881	KISHANPARA	KSP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.031	2026-05-30 09:59:31.105
cmpp3wxe80040z8b4079g24kt	YAGNIK ROAD	YGR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.032	2026-05-30 09:59:31.105
cmpp3wxe90041z8b4ymr3nqsi	METODA	MTD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.033	2026-05-30 09:59:31.105
cmpp3wxea0042z8b4c06vlqs0	MAVDI	MVD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.034	2026-05-30 09:59:31.105
cmpp3wxeb0043z8b4w0dc0til	MAVDI ROAD BAPASITARAM CHOWK	MRB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.035	2026-05-30 09:59:31.105
cmpp3wxed0044z8b45lefa0d2	GOVERDHAN CHOWK 150FT RING ROAD	GCR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.037	2026-05-30 09:59:31.105
cmpp3wxel0045z8b4m554vsff	RANCHHODNAGAR	RCH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.045	2026-05-30 09:59:31.105
cmpp3wxhh0046z8b4pqvrpqjr	SORATHIYAWADI	SRW	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.15	2026-05-30 09:59:31.105
cmpp3wxhj0047z8b49xtld59a	NANA MAVA MAIN ROAD	NMM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.152	2026-05-30 09:59:31.105
cmpp3wxhl0048z8b4fig9753s	NAVAGAM	NVG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.153	2026-05-30 09:59:31.105
cmpp3wxhm0049z8b46j6iu1p8	GONDAL CHOKDI	GDC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.154	2026-05-30 09:59:31.105
cmpp3wxhn004az8b4ojzlu13t	GUNDAWADI	GDW	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.155	2026-05-30 09:59:31.105
cmpp3wxho004bz8b4a2ibc1ab	KARANPARA	KRP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.156	2026-05-30 09:59:31.105
cmpp3wxhp004cz8b4dff4vbuu	MADHAPAR CHOKDI	MDC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.157	2026-05-30 09:59:31.105
cmpp3wxhq004dz8b4hnevt5qv	BAJARANGWADI	BJW	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.159	2026-05-30 09:59:31.105
cmpp3wxhr004ez8b4ymz653f1	KOTHARIYA ROAD	KTR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.16	2026-05-30 09:59:31.105
cmpp3wxhs004fz8b4k73dyemw	SADHU VASWANI ROAD	SVR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.161	2026-05-30 09:59:31.105
cmpp3wxht004gz8b4o2t5ubf5	AYODHYA CHOWK 150 FT	AYC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.162	2026-05-30 09:59:31.105
cmpp3wxhu004hz8b4vncf1fsg	JUNCTION PLOT	JNP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.163	2026-05-30 09:59:31.105
cmpp3wxhv004iz8b41vrqkqht	SPEEDWELL PARTY CHOWK	SPC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.163	2026-05-30 09:59:31.105
cmpp3wxhw004jz8b4vkifia74	SAPAR-VERAVAL	SPV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.164	2026-05-30 09:59:31.105
cmpp3wxhx004kz8b457pt6atg	KUVADVA	KUV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.165	2026-05-30 09:59:31.105
cmpp3wxhy004lz8b4hrt0lqp0	WANKANER	WNK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.166	2026-05-30 09:59:31.105
cmpp3wxhz004mz8b457zo4k1q	JETPUR	JTP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.167	2026-05-30 09:59:31.105
cmpp3wxi0004nz8b473o54746	JETPUR YARD	JPY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.168	2026-05-30 09:59:31.105
cmpp3wxi1004oz8b4glhu94qm	JASDAN	JSD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.169	2026-05-30 09:59:31.105
cmpp3wxi2004pz8b44ehvkt1y	VINCHHIYA	VCH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.17	2026-05-30 09:59:31.105
cmpp3wxi3004qz8b4bbsie33b	GONDAL VICTORY TALKIES	GVT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.171	2026-05-30 09:59:31.105
cmpp3wxi4004rz8b4svndy2hg	GONDAL BUS STAND ROAD	GBS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.172	2026-05-30 09:59:31.105
cmpp3wxi5004sz8b4x9trzo8s	GONDAL YARD	GYD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.173	2026-05-30 09:59:31.105
cmpp3wxi6004tz8b4xxvv0gfb	GONDAL G.I.D.C JAMVADI	GGJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.174	2026-05-30 09:59:31.105
cmpp3wxi7004uz8b4sj6hthde	BHUNAVA CHOKDI	BNC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.175	2026-05-30 09:59:31.105
cmpp3wxi7004vz8b4qb2ruw09	HALVAD	HLV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.176	2026-05-30 09:59:31.105
cmpp3wxi9004wz8b4nrion6tm	KALAVAD	KLV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.178	2026-05-30 09:59:31.105
cmpp3wxia004xz8b4nvch0uub	PADDHARI	PDH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.179	2026-05-30 09:59:31.105
cmpp3wxib004yz8b4u2xy5vtj	JAM KADORANA	JKD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.18	2026-05-30 09:59:31.105
cmpp3wxic004zz8b4a3dnfzlv	MORBI CITY	MBC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.181	2026-05-30 09:59:31.105
cmpp3wxid0050z8b4n590wzj2	MORBI YARD NEW BUS STAND	MYN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.182	2026-05-30 09:59:31.105
cmpp3wxie0051z8b4zhyvjuus	MORBI SAMAKATHA	MSK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.182	2026-05-30 09:59:31.105
cmpp3wxif0052z8b42rxboive	MORBI MAHENDRA NAGAR CHOKDI	MMN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.184	2026-05-30 09:59:31.105
cmpp3wxig0053z8b4rjmyflda	TANKARA	TNK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.185	2026-05-30 09:59:31.105
cmpp3wxih0054z8b46oqhsos7	LAJAI CHOKDI	LJC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.186	2026-05-30 09:59:31.105
cmpp3wxii0055z8b473tsfur4	SURENDRANAGAR	SRN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.187	2026-05-30 09:59:31.105
cmpp3wxij0056z8b4dcmabkbw	JORAVARNAGAR	JRV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.188	2026-05-30 09:59:31.105
cmpp3wxik0057z8b48270n4zk	WADHWAN	WDH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.189	2026-05-30 09:59:31.105
cmpp3wxil0058z8b4m3xnj5sm	THANGADH	THA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.189	2026-05-30 09:59:31.105
cmpp3wxim0059z8b4i3leln6n	LIMBDI	LIM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.19	2026-05-30 09:59:31.105
cmpp3wxin005az8b4sv7jhzqc	CHOTILA	CHO	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.191	2026-05-30 09:59:31.105
cmpp3wxio005bz8b4w7lfo6ig	DHRANGADHRA	DRG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.192	2026-05-30 09:59:31.105
cmpp3wxip005cz8b407c8kxe2	SAYLA	SAY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.194	2026-05-30 09:59:31.105
cmpp3wxiq005dz8b4ay6gc5gz	PATDI	PTD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.195	2026-05-30 09:59:31.105
cmpp3wxir005ez8b4dzz27c36	JUNAGADH MANGNATH ROAD	JMR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.196	2026-05-30 09:59:31.105
cmpp3wxis005fz8b4gucx4zci	JUNAGADH M G ROAD	JMG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.196	2026-05-30 09:59:31.105
cmpp3wxit005gz8b4cndg5yip	JUNAGADH YARD DAULATPURA	JYD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.197	2026-05-30 09:59:31.105
cmpp3wxiu005hz8b4drlmy6qr	JUNAGADH ZANZARDA ROAD	JZR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.198	2026-05-30 09:59:31.105
cmpp3wxiv005iz8b4xizhbtvd	JUNAGADH MADHURAM	JMD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.199	2026-05-30 09:59:31.105
cmpp3wxiw005jz8b4cd7l2w23	VANTHLI	VNT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.2	2026-05-30 09:59:31.105
cmpp3wxlq005kz8b4iwsbj2i2	BHESHAN	BHE	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.302	2026-05-30 09:59:31.105
cmpp3wxls005lz8b4mxtz4dgc	KESHOD AMBAVADI	KAV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.304	2026-05-30 09:59:31.105
cmpp3wxlt005mz8b4go1lw50m	KESHOD BUS STAND	KBS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.306	2026-05-30 09:59:31.105
cmpp3wxlu005nz8b4gexhr3jq	KODINAR	KOD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.307	2026-05-30 09:59:31.105
cmpp3wxlv005oz8b4s43jency	UPLETA	UPL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.308	2026-05-30 09:59:31.105
cmpp3wxlw005pz8b4u0rg0zj7	PANELI	PNL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.309	2026-05-30 09:59:31.105
cmpp3wxly005qz8b4gyxu7hhv	BHAYAVADAR	BYV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.31	2026-05-30 09:59:31.105
cmpp3wxlz005rz8b495mnq9wv	TALALA	TLL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.311	2026-05-30 09:59:31.105
cmpp3wxm0005sz8b4cb5j5qqm	CHORVAD	CRV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.312	2026-05-30 09:59:31.105
cmpp3wxm1005tz8b426ythutp	DHORAJI	DRJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.313	2026-05-30 09:59:31.105
cmpp3wxm2005uz8b41g5jqq1p	UNA	UNA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.314	2026-05-30 09:59:31.105
cmpp3wxm3005vz8b4e8uom9o1	VERAVAL	VRV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.315	2026-05-30 09:59:31.105
cmpp3wxm4005wz8b4vwvncdgb	VISAVADAR	VSV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.316	2026-05-30 09:59:31.105
cmpp3wxm5005xz8b4vypi6j2g	MANAVADAR	MNV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.317	2026-05-30 09:59:31.105
cmpp3wxm6005yz8b4vleyvxjj	BATWA	BTW	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.318	2026-05-30 09:59:31.105
cmpp3wxm8005zz8b4fk0step5	BILKHA	BLK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.32	2026-05-30 09:59:31.105
cmpp3wxm90060z8b4h87zouvk	MANGROL	MGR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.321	2026-05-30 09:59:31.105
cmpp3wxma0061z8b4tjyw8lw1	PRACHI	PRC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.322	2026-05-30 09:59:31.105
cmpp3wxmb0062z8b44k1e9gjq	SUTRAPADA	SUT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.323	2026-05-30 09:59:31.105
cmpp3wxmd0063z8b408ghgxmc	SUTRAPADA FATAK	STF	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.325	2026-05-30 09:59:31.105
cmpp3wxme0064z8b4acvu0v90	MENDARDA	MND	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.326	2026-05-30 09:59:31.105
cmpp3wxmg0065z8b43eajc66m	GADU	GDU	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.328	2026-05-30 09:59:31.105
cmpp3wxmh0066z8b4qmtur7rt	MALIYA HATINA	MLH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.329	2026-05-30 09:59:31.105
cmpp3wxmi0067z8b4omqe6hrq	JAMNAGAR GRAIN MARKET	JGM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.33	2026-05-30 09:59:31.105
cmpp3wxmk0068z8b45xv6xbzi	JAMNAGAR UDHYOG DIGVIJAY	JUD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.332	2026-05-30 09:59:31.105
cmpp3wxml0069z8b4bor48gkz	DARED	DRD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.334	2026-05-30 09:59:31.105
cmpp3wxmm006az8b4xjp4j0lz	LAMBA	LMB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.335	2026-05-30 09:59:31.105
cmpp3wxmn006bz8b4pu3d5lj9	RAVAL	RVL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.335	2026-05-30 09:59:31.105
cmpp3wxmo006cz8b490mm7mf5	PORBANDAR M.G ROAD	PMR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.337	2026-05-30 09:59:31.105
cmpp3wxmp006dz8b48swtvalt	PORBANDAR HOSPITAL ROAD	PHR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.338	2026-05-30 09:59:31.105
cmpp3wxmr006ez8b4slctr6z9	MADHAVPUR GHED	MDG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.339	2026-05-30 09:59:31.105
cmpp3wxms006fz8b4bh581eav	DHROL	DHR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.34	2026-05-30 09:59:31.105
cmpp3wxmt006gz8b4x5ptzvni	KHAMBHALIA	KHB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.342	2026-05-30 09:59:31.105
cmpp3wxmu006hz8b4030yjmsn	JAM JODHPUR	JJP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.343	2026-05-30 09:59:31.105
cmpp3wxmv006iz8b4zegsakzd	LALPUR	LLP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.344	2026-05-30 09:59:31.105
cmpp3wxmx006jz8b4gfwg4alc	BHATIYA	BHA	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.345	2026-05-30 09:59:31.105
cmpp3wxmy006kz8b4kxz3ropk	MITHAPUR	MTP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.347	2026-05-30 09:59:31.105
cmpp3wxmz006lz8b4m23dy3qx	DWARKA	DWK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.348	2026-05-30 09:59:31.105
cmpp3wxn0006mz8b4gdmn7ayt	RANAVAV	RNV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.349	2026-05-30 09:59:31.105
cmpp3wxn1006nz8b4jgugj3od	KUTIYANA	KTY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.35	2026-05-30 09:59:31.105
cmpp3wxn2006oz8b4gw3yig9a	RANA KANDORNA	RNK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.351	2026-05-30 09:59:31.105
cmpp3wxn3006pz8b423omf3vh	BHANVAD	BNV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.352	2026-05-30 09:59:31.105
cmpp3wxn4006qz8b44rgsec2k	OKHA	OKH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.353	2026-05-30 09:59:31.105
cmpp3wxn5006rz8b4g69sjthw	NIKAVA	NKV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.354	2026-05-30 09:59:31.105
cmpp3wxn6006sz8b4yytaf7r5	BHAVNAGAR VORABAJAR	BHV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.355	2026-05-30 09:59:31.105
cmpp3wxn8006tz8b4flnly21m	BHAVNAGAR SHASTRINAGAR	BHS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.356	2026-05-30 09:59:31.105
cmpp3wxn9006uz8b4dmtpesqb	BHAVNAGAR SANSKAR MANDAL	BSM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.358	2026-05-30 09:59:31.105
cmpp3wxna006vz8b4dy675nzz	BHAVNAGAR KALIYABID	BKL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.359	2026-05-30 09:59:31.105
cmpp3wxnb006wz8b4dc8go46f	BHAVNAGAR KALANALA	BKN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.36	2026-05-30 09:59:31.105
cmpp3wxnd006xz8b47mpeeunj	BHAVNAGAR YARD CHITRA	BYC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.361	2026-05-30 09:59:31.105
cmpp3wxq6006yz8b4swgkj9c9	VARTEJ	VTJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.463	2026-05-30 09:59:31.105
cmpp3wxq9006zz8b42c3eiukz	AMRELI	AML	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.465	2026-05-30 09:59:31.105
cmpp3wxqe0070z8b4pbcobznb	AMRELI YARD	AMY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.471	2026-05-30 09:59:31.105
cmpp3wxqg0071z8b48z4tc2w1	CHITAL	CTL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.472	2026-05-30 09:59:31.105
cmpp3wxqh0072z8b4y2ol6bw8	DHARI	DHI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.474	2026-05-30 09:59:31.105
cmpp3wxqo0073z8b4nt8oxtr4	CHALALA	CHL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.481	2026-05-30 09:59:31.105
cmpp3wxqr0074z8b47tsaomqh	KHAMBHA (GIR)	KHG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.483	2026-05-30 09:59:31.105
cmpp3wxqs0075z8b404uz92hq	KUNKAVAV	KKV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.484	2026-05-30 09:59:31.105
cmpp3wxqt0076z8b4tody265u	DERDI KUMBHAJI	DKM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.486	2026-05-30 09:59:31.105
cmpp3wxqu0077z8b4wtutkdlg	BOTAD HIRA BAZZAR	BHB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.487	2026-05-30 09:59:31.105
cmpp3wxqv0078z8b4qxk3wqhk	BOTAD YARD	BTY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.488	2026-05-30 09:59:31.105
cmpp3wxqx0079z8b4t5upzb4b	BOTAD TOWER ROAD	BTR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.489	2026-05-30 09:59:31.105
cmpp3wxqy007az8b47a7za3o6	RANPUR	RNP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.49	2026-05-30 09:59:31.105
cmpp3wxr0007bz8b4vwtbi4a6	BARVALA	BRV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.492	2026-05-30 09:59:31.105
cmpp3wxr1007cz8b4i0klydle	SAVARKUNDLA	SVK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.493	2026-05-30 09:59:31.105
cmpp3wxr2007dz8b4jmx5j1q0	DHOLA JUNCTION	DHJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.495	2026-05-30 09:59:31.105
cmpp3wxr7007ez8b4j6m1nh06	SIHOR	SHR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.499	2026-05-30 09:59:31.105
cmpp3wxr8007fz8b45uy7ohj1	TALAJA MAIN BAZAR	TMB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.5	2026-05-30 09:59:31.105
cmpp3wxr9007gz8b480re7q7x	ALANG	ALG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.501	2026-05-30 09:59:31.105
cmpp3wxra007hz8b42rcq7qgv	BAGASARA	BGS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.503	2026-05-30 09:59:31.105
cmpp3wxrb007iz8b42uvhoqey	BABRA	BBR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.504	2026-05-30 09:59:31.105
cmpp3wxrd007jz8b4i82t5moq	RAJULA	RJL	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.505	2026-05-30 09:59:31.105
cmpp3wxre007kz8b4403obb04	JAFRABAD	JFR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.506	2026-05-30 09:59:31.105
cmpp3wxrf007lz8b4l6jg1r2q	TIMBI	TIM	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.507	2026-05-30 09:59:31.105
cmpp3wxrg007mz8b454edjsqo	GARIYADHAR	GRD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.508	2026-05-30 09:59:31.105
cmpp3wxrh007nz8b4krywdl01	DHASA	DHS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.509	2026-05-30 09:59:31.105
cmpp3wxri007oz8b4ajamch34	MAHUVA	MHV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.51	2026-05-30 09:59:31.105
cmpp3wxrj007pz8b4wq8g78js	MAHUVA YARD	MHY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.511	2026-05-30 09:59:31.105
cmpp3wxrk007qz8b4bpqo68rv	PALITANA BUS STAND	PBS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.512	2026-05-30 09:59:31.105
cmpp3wxrl007rz8b48hy57rel	DAMNAGAR	DMN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.513	2026-05-30 09:59:31.105
cmpp3wxrm007sz8b4hadvvu9t	JESAR	JSR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.514	2026-05-30 09:59:31.105
cmpp3wxrn007tz8b4owtwk6i9	GADHADA	GDH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.516	2026-05-30 09:59:31.105
cmpp3wxro007uz8b4bm88hlfe	VALLABHIPUR	VLP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.517	2026-05-30 09:59:31.105
cmpp3wxrr007vz8b470hd8c91	THARA	THR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.52	2026-05-30 09:59:31.105
cmpp3wxrs007wz8b439nqk69i	LAKHANI	LKH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.521	2026-05-30 09:59:31.105
cmpp3wxrt007xz8b4fk70lrrv	UNJHA	UNJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.522	2026-05-30 09:59:31.105
cmpp3wxrv007yz8b4g5uzh16r	PALANPUR	PLP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.523	2026-05-30 09:59:31.105
cmpp3wxrw007zz8b4co9gt46v	AMBAJI	AMB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.524	2026-05-30 09:59:31.105
cmpp3wxrx0080z8b4grx0hna4	PATAN	PAT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.525	2026-05-30 09:59:31.105
cmpp3wxry0081z8b4hdtc6cry	CHANASMA	CHS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.526	2026-05-30 09:59:31.105
cmpp3wxrz0082z8b4huv860w4	KADI	KDI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.527	2026-05-30 09:59:31.105
cmpp3wxs00083z8b4fgkagmuf	SIDDHPUR	SDP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.528	2026-05-30 09:59:31.105
cmpp3wxs10084z8b43c5v16y8	SAMI	SMI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.529	2026-05-30 09:59:31.105
cmpp3wxs20085z8b4f0mq298o	VISNAGAR	VNG	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.53	2026-05-30 09:59:31.105
cmpp3wxs30086z8b424935d3n	BHABHAR	BHR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.531	2026-05-30 09:59:31.105
cmpp3wxs40087z8b49sa2u71w	RADHANPUR	RDP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.532	2026-05-30 09:59:31.105
cmpp3wxs50088z8b4oep5g0ta	MEHSANA	MSN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.534	2026-05-30 09:59:31.105
cmpp3wxs60089z8b4iejdhixk	BHILDI	BHD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.535	2026-05-30 09:59:31.105
cmpp3wxs7008az8b4mc3hp1fy	DHANERA	DNR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.536	2026-05-30 09:59:31.105
cmpp3wxs9008bz8b47f12qio8	PANTHAWADA	PTW	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.537	2026-05-30 09:59:31.105
cmpp3wxv3008cz8b4dl2m8mk8	DIYODAR	DYD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.639	2026-05-30 09:59:31.105
cmpp3wxv5008dz8b4k6dqao46	HARIJ	HRJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.641	2026-05-30 09:59:31.105
cmpp3wxv8008ez8b4kjam86lk	SANKHESHWAR	SKW	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.644	2026-05-30 09:59:31.105
cmpp3wxva008fz8b4w7o0tgwo	THARAD	TRD	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.646	2026-05-30 09:59:31.105
cmpp3wxvd008gz8b466d0y3t6	VAV	VAV	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.649	2026-05-30 09:59:31.105
cmpp3wxvk008hz8b45q496dc6	VIJAPUR	VJP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.657	2026-05-30 09:59:31.105
cmpp3wxvm008iz8b4271zxjvs	BAHUCHARAJI	BAH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.659	2026-05-30 09:59:31.105
cmpp3wxvr008jz8b4dna9maxl	DEESA	DES	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.663	2026-05-30 09:59:31.105
cmpp3wxvu008kz8b44n1x05w4	VARAHI	VRH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.667	2026-05-30 09:59:31.105
cmpp3wxvw008lz8b4tpui160z	SANTALPUR	STP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.669	2026-05-30 09:59:31.105
cmpp3wxvx008mz8b49uvyhjmh	SIHORI	SHI	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.67	2026-05-30 09:59:31.105
cmpp3wxvz008nz8b4r7fipcqn	BHUJ CITY	BHC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.671	2026-05-30 09:59:31.105
cmpp3wxw0008oz8b4ywcq516z	BHUJ NEW STATION ROAD	BNS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.672	2026-05-30 09:59:31.105
cmpp3wxw1008pz8b4dkvlunis	BHUJ YARD	BHY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.673	2026-05-30 09:59:31.105
cmpp3wxw2008qz8b4hic1g21h	BHUJ JUBILEE CIRCLE	BJC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.674	2026-05-30 09:59:31.105
cmpp3wxw3008rz8b4urnv51h9	BHACHAU	BHU	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.675	2026-05-30 09:59:31.105
cmpp3wxw4008sz8b4b2uwp0mm	GANDHIDHAM ZANDA CHOWK	GZC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.676	2026-05-30 09:59:31.105
cmpp3wxw5008tz8b4u64mb1cn	GANDHIDHAM SONIBAJAR	GSB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.678	2026-05-30 09:59:31.105
cmpp3wxw6008uz8b4wp5nuc3l	ANJAR	ANJ	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.679	2026-05-30 09:59:31.105
cmpp3wxw7008vz8b49ao01ar6	NALIYA	NLY	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.68	2026-05-30 09:59:31.105
cmpp3wxw9008wz8b4caq3jf3d	VARMANAGAR (VAYA NALIYA)	VMN	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.681	2026-05-30 09:59:31.105
cmpp3wxwa008xz8b42vwqkl3t	KOTHARA	KOT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.683	2026-05-30 09:59:31.105
cmpp3wxwc008yz8b42qtwy9zx	VAYOR (VAYA NALIYA)	VYR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.684	2026-05-30 09:59:31.105
cmpp3wxwd008zz8b44j30ylv6	JAKHAU BANDAR (VAYA NALIYA)	JKB	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.685	2026-05-30 09:59:31.105
cmpp3wxwe0090z8b453iuiawu	MOTHALA (VAYA NALIYA)	MTH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.686	2026-05-30 09:59:31.105
cmpp3wxwf0091z8b484kjx2vd	RAPAR	RAP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.687	2026-05-30 09:59:31.105
cmpp3wxwg0092z8b4ulqdralx	MADHAPAR HIGHWAY	MPH	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.688	2026-05-30 09:59:31.105
cmpp3wxwh0093z8b4a9n6rg3f	MADHAPAR CITY	MPC	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.689	2026-05-30 09:59:31.105
cmpp3wxwi0094z8b4i5i7m4z1	ADIPUR	ADP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.69	2026-05-30 09:59:31.105
cmpp3wxwk0095z8b4ls1bqcjc	ADESAR	ADS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.692	2026-05-30 09:59:31.105
cmpp3wxwm0096z8b4t36enqgu	MUNDRA	MDR	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.694	2026-05-30 09:59:31.105
cmpp3wxwn0097z8b4gjcn8irf	NAKHTRANA	NKT	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.696	2026-05-30 09:59:31.105
cmpp3wxwp0098z8b4igd56yk9	SAMKHIYALI	SMK	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.698	2026-05-30 09:59:31.105
cmpp3wxwr0099z8b45f6r76ja	GADHSISA	GDS	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.699	2026-05-30 09:59:31.105
cmpp3wxws009az8b42p1ahjg5	DAYAPAR	DYP	Gujarat	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.7	2026-05-30 09:59:31.105
cmpp3wxwt009bz8b4y26etjcx	OPERA HOUSE	OPH	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.701	2026-05-30 09:59:31.105
cmpp3wxwu009cz8b48whm396e	BHULESHWAR	BHL	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.702	2026-05-30 09:59:31.105
cmpp3wxwv009dz8b484f8c9j4	ANDHERI	AND	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.703	2026-05-30 09:59:31.105
cmpp3wxww009ez8b42shwyfum	BORIVALI (EAST)	BOE	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.704	2026-05-30 09:59:31.105
cmpp3wxwx009fz8b4eh6g6bvj	DADAR (WEST)	DAW	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.705	2026-05-30 09:59:31.105
cmpp3wxwy009gz8b4c2yffiku	DOMBIVLI	DMB	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.706	2026-05-30 09:59:31.105
cmpp3wxwz009hz8b4i6jte3r5	GHATKOPAR TILAK ROAD	GTR	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.708	2026-05-30 09:59:31.105
cmpp3wxx0009iz8b422pz32p0	PANVEL	PNV	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.709	2026-05-30 09:59:31.105
cmpp3wxx1009jz8b444mt1542	KALYAN	KLY	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.71	2026-05-30 09:59:31.105
cmpp3wxx2009kz8b4bq0oyrpp	MALAD (EAST)	MAE	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.711	2026-05-30 09:59:31.105
cmpp3wxx4009lz8b4dk6yvlfs	MALAD (WEST)	MAW	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.712	2026-05-30 09:59:31.105
cmpp3wxx5009mz8b4euaq91i7	MULUND	MLD	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.713	2026-05-30 09:59:31.105
cmpp3wxx6009nz8b4jkwel1v4	NAGDEVI	NGD	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.714	2026-05-30 09:59:31.105
cmpp3wxx7009oz8b42kyp4ff1	VASHI	VSH	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.715	2026-05-30 09:59:31.105
cmpp3wxxc009pz8b4rban038y	VASAI	VSI	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.721	2026-05-30 09:59:31.105
cmpp3wy08009qz8b4hssj4r0k	ULHASNAGAR	ULH	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.825	2026-05-30 09:59:31.105
cmpp3wy0b009rz8b4tzn28vdk	AMBARNATH	AMN	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.827	2026-05-30 09:59:31.105
cmpp3wy0d009sz8b4yifq38q4	THANE	THN	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.829	2026-05-30 09:59:31.105
cmpp3wy0f009tz8b4ricvgu4v	GHATKOPAR KAILASH PLAZA	GKP	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.831	2026-05-30 09:59:31.105
cmpp3wy0h009uz8b4f7kobfu6	BHIWANDI	BWD	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.833	2026-05-30 09:59:31.105
cmpp3wy0i009vz8b4antsz991	BORIVALI (WEST)	BOW	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.834	2026-05-30 09:59:31.105
cmpp3wy0j009wz8b40m3mg7ck	SANTACRUZ	STC	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.835	2026-05-30 09:59:31.105
cmpp3wy0k009xz8b4id32fj49	B.K.C	BKC	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.836	2026-05-30 09:59:31.105
cmpp3wy0l009yz8b4aj279nea	BHAYANDAR	BYD	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.838	2026-05-30 09:59:31.105
cmpp3wy0m009zz8b4nx8f55bh	DELHI CHANDNI CHOWK	DCC	Delhi	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.839	2026-05-30 09:59:31.105
cmpp3wy0n00a0z8b4obu97j5u	DELHI KAROL BAGH	DKB	Delhi	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.839	2026-05-30 09:59:31.105
cmpp3wy0o00a1z8b4koi6848h	RAIPUR	RPR	Chhattisgarh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.84	2026-05-30 09:59:31.105
cmpp3wy0p00a2z8b4fj5pzvfm	PATNA	PTN	Bihar	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.841	2026-05-30 09:59:31.105
cmpp3wy0q00a3z8b4vi5grai0	GOA-PANAJI	GPN	Goa	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.842	2026-05-30 09:59:31.105
cmpp3wy0r00a4z8b4vbath8vu	GOA-VASCO	GVS	Goa	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.843	2026-05-30 09:59:31.105
cmpp3wy0s00a5z8b44yzw0wmw	KOLKATA	KOL	West Bengal	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.845	2026-05-30 09:59:31.105
cmpp3wy0t00a6z8b48vn18tx4	CHENNAI	CHN	Tamil Nadu	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.846	2026-05-30 09:59:31.105
cmpp3wy0u00a7z8b4y9pazea4	BANGALORE	BGL	Karnataka	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.846	2026-05-30 09:59:31.105
cmpp3wy0v00a8z8b4ymvmp2k3	DEHRADUN	DEH	Uttarakhand	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.847	2026-05-30 09:59:31.105
cmpp3wy0w00a9z8b4i2v8g2nm	BELGAUM	BLG	Karnataka	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.848	2026-05-30 09:59:31.105
cmpp3wy0x00aaz8b48t3dm67o	TELANGANA-ANDHRA PRADESH	TAP	Telangana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.849	2026-05-30 09:59:31.105
cmpp3wy0y00abz8b4on3n1kj5	BEGUM BAJAR HYDERABAD	BBH	Telangana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.85	2026-05-30 09:59:31.105
cmpp3wy0z00acz8b4fwoud7mi	RANIGANJ SIKANDARABAD	RNS	Telangana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.851	2026-05-30 09:59:31.105
cmpp3wy0z00adz8b4l4ulcnhg	HYDERABAD	HYD	Telangana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.852	2026-05-30 09:59:31.105
cmpp3wy1100aez8b4tqz5o0yp	VISAKHAPATNAM	VSK	Andhra Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.854	2026-05-30 09:59:31.105
cmpp3wy1200afz8b4oipcap1l	VIJAYWADA	VJW	Andhra Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.855	2026-05-30 09:59:31.105
cmpp3wy1300agz8b4h7xy3j3h	BANJARA JUBILEE HYDERABAD	BJH	Telangana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.856	2026-05-30 09:59:31.105
cmpp3wy1400ahz8b4xppo5sqn	RAJASTHAN	RAJ	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.857	2026-05-30 09:59:31.105
cmpp3wy1500aiz8b4znkx27pc	JODHPUR	JDP	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.858	2026-05-30 09:59:31.105
cmpp3wy1600ajz8b4b9uq0fyv	AJMER	AJM	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.859	2026-05-30 09:59:31.105
cmpp3wy1700akz8b42aeat03f	JAIPUR	JPR	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.86	2026-05-30 09:59:31.105
cmpp3wy1800alz8b4pysrxrlr	SANCHORE	SNC	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.861	2026-05-30 09:59:31.105
cmpp3wy1900amz8b4a6uzvvh3	BIKANER	BIK	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.862	2026-05-30 09:59:31.105
cmpp3wy1a00anz8b4v2lou7gi	BARMER	BMR	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.863	2026-05-30 09:59:31.105
cmpp3wy1c00aoz8b4unppg97d	UDAIPUR	UDP	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.864	2026-05-30 09:59:31.105
cmpp3wy1d00apz8b495pm1c2e	BANSWARA	BAN	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.865	2026-05-30 09:59:31.105
cmpp3wy1e00aqz8b43csx3d7h	BHILWARA	BHI	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.866	2026-05-30 09:59:31.105
cmpp3wy1f00arz8b4hrg77ntu	KOTA	KTA	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.867	2026-05-30 09:59:31.105
cmpp3wy1g00asz8b447pt4ebk	BUNDI	BND	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.868	2026-05-30 09:59:31.105
cmpp3wy1h00atz8b4bkboy853	KISHANGADH	KSG	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.869	2026-05-30 09:59:31.105
cmpp3wy1i00auz8b413j0ve1w	PALI	PLI	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.871	2026-05-30 09:59:31.105
cmpp3wy1k00avz8b4x50hwfhq	NAGAUR	NGR	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.872	2026-05-30 09:59:31.105
cmpp3wy1l00awz8b4ive8mrql	ABU ROAD	ABR	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.873	2026-05-30 09:59:31.105
cmpp3wy1m00axz8b4qdf36df9	BEAWAR	BWR	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.875	2026-05-30 09:59:31.105
cmpp3wy1o00ayz8b4eqfk3zv8	KANKROLI	KNK	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.877	2026-05-30 09:59:31.105
cmpp3wy1p00azz8b4qlazdjf1	CHITTORGARH	CTG	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.877	2026-05-30 09:59:31.105
cmpp3wy1q00b0z8b4k7fwd7km	BALOTRA	BLT	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.878	2026-05-30 09:59:31.105
cmpp3wy1r00b1z8b4sbhduzhg	DUNGARPUR	DNG	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.879	2026-05-30 09:59:31.105
cmpp3wy1s00b2z8b4vhzrfalr	NIMBAHERA	NMB	Rajasthan	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.88	2026-05-30 09:59:31.105
cmpp3wy1t00b3z8b4buu44f6i	M P	MPX	Madhya Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.881	2026-05-30 09:59:31.105
cmpp3wy4n00b4z8b4030tuvlx	BHOPAL	BPL	Madhya Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.983	2026-05-30 09:59:31.105
cmpp3wy4p00b5z8b4zuz5nzat	INDORE	IND	Madhya Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.985	2026-05-30 09:59:31.105
cmpp3wy4q00b6z8b40rpkx4dp	UJJAIN	UJN	Madhya Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.987	2026-05-30 09:59:31.105
cmpp3wy4s00b7z8b4wpwvsxzl	GWALIOR	GWL	Madhya Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.988	2026-05-30 09:59:31.105
cmpp3wy4t00b8z8b4z2ta9if0	RATLAM	RTM	Madhya Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.989	2026-05-30 09:59:31.105
cmpp3wy4u00b9z8b4jagk2pmk	JHABUA	JHB	Madhya Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.991	2026-05-30 09:59:31.105
cmpp3wy4v00baz8b4k4n2e6h4	MAHARASHTRA	MHS	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.992	2026-05-30 09:59:31.105
cmpp3wy4w00bbz8b4pp0n2zcc	KOLHAPUR	KLP	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.993	2026-05-30 09:59:31.105
cmpp3wy4y00bcz8b48hnfhu3x	NASHIK	NSK	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.994	2026-05-30 09:59:31.105
cmpp3wy4y00bdz8b4xkfj58e0	JALGAON	JLG	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.995	2026-05-30 09:59:31.105
cmpp3wy4z00bez8b42c8ih110	PUNE MARKET YARD	PMY	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.996	2026-05-30 09:59:31.105
cmpp3wy5000bfz8b4f1e064cd	NAGPUR	NGP	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.997	2026-05-30 09:59:31.105
cmpp3wy5100bgz8b4sq0iqm87	AKOLA	AKL	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.998	2026-05-30 09:59:31.105
cmpp3wy5300bhz8b4nwnhlzrf	YAVATMAL	YTL	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:18.999	2026-05-30 09:59:31.105
cmpp3wy5500biz8b4yf13ke8q	MALKAPUR	MKP	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.002	2026-05-30 09:59:31.105
cmpp3wy5800bjz8b4b3vry3g1	PUNE DAGDUSHETH	PDG	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.005	2026-05-30 09:59:31.105
cmpp3wy5a00bkz8b42no1ubmf	PUNE PIMPRI	PMP	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.007	2026-05-30 09:59:31.105
cmpp3wy5d00blz8b4h28ax61r	SATARA	STR	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.01	2026-05-30 09:59:31.105
cmpp3wy5f00bmz8b48puevohd	AMRAVATI	AMV	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.011	2026-05-30 09:59:31.105
cmpp3wy5g00bnz8b48bjb2agb	SANGLI	SGL	Maharashtra	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.013	2026-05-30 09:59:31.105
cmpp3wy5i00boz8b4rndc5np3	HARYANA	HRY	Haryana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.014	2026-05-30 09:59:31.105
cmpp3wy5j00bpz8b4heusu1t3	CHANDIGARH	CHD	Chandigarh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.016	2026-05-30 09:59:31.105
cmpp3wy5k00bqz8b4bvylx6rr	YAMUNANAGAR	YNG	Haryana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.017	2026-05-30 09:59:31.105
cmpp3wy5m00brz8b4pebnbril	PANIPAT	PNP	Haryana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.018	2026-05-30 09:59:31.105
cmpp3wy5n00bsz8b4kt5m8wyf	GURGAON (GURUGRAM)	GRG	Haryana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.019	2026-05-30 09:59:31.105
cmpp3wy5o00btz8b4dj1h2vw4	HISAR	HSR	Haryana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.02	2026-05-30 09:59:31.105
cmpp3wy5p00buz8b4usxfujbg	ROHTAK	RTK	Haryana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.022	2026-05-30 09:59:31.105
cmpp3wy5q00bvz8b4ye0ipdq6	KARNAL	KRL	Haryana	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.023	2026-05-30 09:59:31.105
cmpp3wy5r00bwz8b4u4xmm8fu	U P	UPX	Uttar Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.024	2026-05-30 09:59:31.105
cmpp3wy5s00bxz8b43feiiqkx	AGRA	AGR	Uttar Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.025	2026-05-30 09:59:31.105
cmpp3wy5u00byz8b4475k4r7c	NOIDA	NOI	Uttar Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.027	2026-05-30 09:59:31.105
cmpp3wy5v00bzz8b4pcne8dop	SAHARANPUR	SRP	Uttar Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.028	2026-05-30 09:59:31.105
cmpp3wy5w00c0z8b4kymz6eol	MEERUT	MRT	Uttar Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.029	2026-05-30 09:59:31.105
cmpp3wy5y00c1z8b4l8nu5674	KANPUR	KNP	Uttar Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.03	2026-05-30 09:59:31.105
cmpp3wy5z00c2z8b4a0iqmotv	BANARAS	BNR	Uttar Pradesh	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.031	2026-05-30 09:59:31.105
cmpp3wy6000c3z8b42erclnlw	KERALA	KER	Kerala	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.032	2026-05-30 09:59:31.105
cmpp3wy6100c4z8b4r5z2ould	KOCHIN	KOC	Kerala	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.034	2026-05-30 09:59:31.105
cmpp3wy6200c5z8b437inr94q	CALICUT	CLT	Kerala	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-28 06:23:19.035	2026-05-30 09:59:31.105
\.


--
-- Data for Name: client_ledgers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_ledgers (id, "clientId", "openingBalance", "currentBalance", "lastTransactionDate", "balanceType", "financialYear", "isActive", "isDeleted", "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: commission_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commission_rates (id, "fromCityId", "toCityId", "rateType", rate, "minAmount", "maxAmount", "isActive", "isDeleted", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ledger_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ledger_entries (id, date, "accountId", "accountType", description, "debitAmount", "creditAmount", balance, "isActive", "isDeleted", "deletedAt", "deletedBy", "createdAt", "updatedAt", "transactionId", "branchId", "createdBy", "accountEntryId") FROM stdin;
\.


--
-- Data for Name: parties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parties (id, name, phone, email, address, city, "panNumber", "gstNumber", "branchId", "isActive", "isDeleted", "createdAt", "updatedAt") FROM stdin;
cmps6iov50003i21ja6jl7cur	ABC	8421049091	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.169	2026-05-30 09:59:31.169
cmps6iov80005i21jkwo1ncvi	AD TKN	9909193547	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.172	2026-05-30 09:59:31.172
cmps6iova0007i21jn4x6eydb	ADVANCE LBL	7044653389	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.174	2026-05-30 09:59:31.174
cmps6iovb0009i21j0jim9djr	AED NJ	7845685455	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.176	2026-05-30 09:59:31.176
cmps6iovd000bi21j0n6z3fti	AFATABBHAI	7263312297	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.177	2026-05-30 09:59:31.177
cmps6iove000di21j842e50u7	AGOA	7005172190	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.179	2026-05-30 09:59:31.179
cmps6iovg000fi21j82xmbhhg	AKASHBHAI JP	8548169493	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.18	2026-05-30 09:59:31.18
cmps6iovh000hi21jj4ynhfic	ALI FATU	9666179526	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.181	2026-05-30 09:59:31.181
cmps6iovi000ji21jvc03u1hx	ALPHA	8288903406	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.182	2026-05-30 09:59:31.182
cmps6iovj000li21jq3izuawi	AMBIKA (BALUBHAI)	7186919621	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.184	2026-05-30 09:59:31.184
cmps6iovm000ni21j481ovona	AMITBHAI ADATIYA	8052446047	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.186	2026-05-30 09:59:31.186
cmps6iovo000pi21jrjew1sct	AMRUT IND. SHAILESHBHAI	8859120693	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.189	2026-05-30 09:59:31.189
cmps6iovq000ri21jizd0uje1	ANKITBHAI D	9498359127	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.19	2026-05-30 09:59:31.19
cmps6iovr000ti21jugxmgi43	APM AMRELI PM	8662570082	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.191	2026-05-30 09:59:31.191
cmps6iovs000vi21jbpgvvgao	ARIFBHAI GALIYAVAD	9024703303	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.193	2026-05-30 09:59:31.193
cmps6iovt000xi21jj82z5xxd	ARUNBHAI GOA	8485436546	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.194	2026-05-30 09:59:31.194
cmps6iovv000zi21j8zktucpo	ARVIND KANTI AGADIYA	9285835141	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.195	2026-05-30 09:59:31.195
cmps6iovw0011i21j4b79ern7	ASHAPURA MA	7969691830	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.197	2026-05-30 09:59:31.197
cmps6iovx0013i21jqmc8yoit	ASHIFBHAI LION	8964427392	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.198	2026-05-30 09:59:31.198
cmps6iovz0015i21jgnc7d50i	ASHISHBHAI JOSHI	8096855912	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.2	2026-05-30 09:59:31.2
cmps6iow10017i21j5e1f2po6	ASITARA PAN	9496328307	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.201	2026-05-30 09:59:31.201
cmps6iow40019i21jctwxnil9	ATULBHAI MARUTI	9335286804	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.205	2026-05-30 09:59:31.205
cmps6iow6001bi21jrqs21r5x	AXAYBHAI PABARI	9003514612	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.207	2026-05-30 09:59:31.207
cmps6iow8001di21j0fkq4q4l	BADAL AC NJ	8348509291	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.208	2026-05-30 09:59:31.208
cmps6iow9001fi21jzr2lbj3x	BALABHAI RADA	9494393296	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.21	2026-05-30 09:59:31.21
cmps6iowb001hi21jdgqnvrpo	BALAJI STORE	8420313535	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.211	2026-05-30 09:59:31.211
cmps6iowc001ji21jiyql9spi	BANZER MOBILE	8812033278	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.213	2026-05-30 09:59:31.213
cmps6iowe001li21jqk38atyt	BAPARAM MOBILE	8272419701	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.214	2026-05-30 09:59:31.214
cmps6iowf001ni21jwpdp317i	BBY NSP MJ	9238491491	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.215	2026-05-30 09:59:31.215
cmps6iowh001pi21jyi9pco2q	BEST TRAILOR	7200127628	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.217	2026-05-30 09:59:31.217
cmps6iowj001ri21jgqrkyf8u	BHARATBHAI PUTHAVADA	7987146832	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.22	2026-05-30 09:59:31.22
cmps6iowl001ti21jf7cbqcp4	BHAVESHBHAI PORBANDAR	8706827486	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.222	2026-05-30 09:59:31.222
cmps6iown001vi21jkvxwbm0m	BHAVESHBHAI RAJANI TEA	7643001705	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.224	2026-05-30 09:59:31.224
cmps6iowp001xi21jy8v1h5sc	BHAVINBHAI VAISHNANI CK	8164081819	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.225	2026-05-30 09:59:31.225
cmps6iowr001zi21jl6492qxn	BHAVNI NAYANBHAI	9592712884	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.227	2026-05-30 09:59:31.227
cmps6iows0021i21jq76aggks	BHAYAKUBHAI	8875395520	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.229	2026-05-30 09:59:31.229
cmps6iowt0023i21jmfo0os1w	BHIKHABHAI CON	7901318321	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.23	2026-05-30 09:59:31.23
cmps6iowv0025i21jyo2rm5oj	BHOLA AMD	8140858856	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.231	2026-05-30 09:59:31.231
cmps6ioww0027i21jr88is7ky	BIHAR PATNA	7660617179	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.232	2026-05-30 09:59:31.232
cmps6iowx0029i21jijz6e2wv	BIPINBHAI SINGALA	9793537705	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.233	2026-05-30 09:59:31.233
cmps6iowz002bi21j80f5al4b	BONANZA TKN AR	9545047402	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.235	2026-05-30 09:59:31.235
cmps6iox1002di21j9ht63xen	CHAMUNDA KATLERI	8465558370	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.238	2026-05-30 09:59:31.238
cmps6iox3002fi21j94q974pn	CHANDARANA DIPBHAI	7070879150	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.239	2026-05-30 09:59:31.239
cmps6iox4002hi21ju5cv8tsf	CHETANBHAI TILVA	8939785540	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.24	2026-05-30 09:59:31.24
cmps6iox5002ji21jzhgibsm5	CHINTANBHAI D	8283212534	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.242	2026-05-30 09:59:31.242
cmps6iox6002li21jxyzqdrpu	CHIRAGBHAI DALSANIYA	9740667727	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.243	2026-05-30 09:59:31.243
cmps6iox8002ni21js8gddxpb	CHUKAVA BAKI LBL	7120379276	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.244	2026-05-30 09:59:31.244
cmps6iox9002pi21jojnojeme	CLASSIC JEANS MANGANATH	8906706982	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.245	2026-05-30 09:59:31.245
cmps6ioxa002ri21jpcyfza4r	COMMISON	8389549119	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.246	2026-05-30 09:59:31.246
cmps6ioxb002ti21j3oyogff8	DARSANBHAI JASANI DC	9443475440	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.248	2026-05-30 09:59:31.248
cmps6ioxd002vi21j3a4o2oy6	DEEPBHAI SADARANI	7432531500	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.249	2026-05-30 09:59:31.249
cmps6ioxe002xi21je2qn74yu	DELHI NJ	9281499977	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.25	2026-05-30 09:59:31.25
cmps6ioxg002zi21jymv2cums	DELHI SANJAYBHAI NJ	8697239352	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.252	2026-05-30 09:59:31.252
cmps6ioxh0031i21j2pvz17mj	DELTIN TARUN	8109301809	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.254	2026-05-30 09:59:31.254
cmps6ioxj0033i21j7rfylycq	DEVABHAI KHADIYA	8646654101	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.255	2026-05-30 09:59:31.255
cmps6ioxk0035i21j0k852ho6	DEVANU NAMU	7063473536	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.256	2026-05-30 09:59:31.256
cmps6ioxl0037i21j5lxcdy4t	DHARMIKBHAI LEHARU NJ	7143688578	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.258	2026-05-30 09:59:31.258
cmps6ioxm0039i21jckb0rdev	DHAVALBHAI MANEK LAKADAVAD	9681842826	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.259	2026-05-30 09:59:31.259
cmps6ioxn003bi21jyf9l8lso	DHIRAJLAL AND COMPANY	7808197548	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.26	2026-05-30 09:59:31.26
cmps6ioxo003di21j6h6rz37v	DINESHBHAI SHREE SAI	9432957807	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.261	2026-05-30 09:59:31.261
cmps6ioxr003fi21jeb5jfeu8	DIPU DELHI	9143110469	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.263	2026-05-30 09:59:31.263
cmps6ioxs003hi21jbq8qm3nb	DIPU MAIN NJ	8450853103	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.264	2026-05-30 09:59:31.264
cmps6ioxt003ji21jcffrzufk	DISA MOBILE RAMBHAI	9272572155	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.265	2026-05-30 09:59:31.265
cmps6ioxu003li21jy45xmm6o	DIVYESHBHAI SOLANKI	7861578580	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.267	2026-05-30 09:59:31.267
cmps6ioxw003ni21j4l7s1ynf	DK AGADIYA SWAD	7027053426	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.268	2026-05-30 09:59:31.268
cmps6ioxy003pi21jb5r2f5jg	DOLARBHAI	7710714904	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.27	2026-05-30 09:59:31.27
cmps6ioy0003ri21jghculw3s	DT CHINTANBHAI	7166604026	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.272	2026-05-30 09:59:31.272
cmps6ioy1003ti21jgjcebt1h	FEJALBHAI	7991575904	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.273	2026-05-30 09:59:31.273
cmps6ioy2003vi21jvgzbvx0e	GADA SHAILESHBHAI	9525008653	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.275	2026-05-30 09:59:31.275
cmps6ioy3003xi21jv98v5a2n	GAMANBHAI POPAT	7577572826	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.276	2026-05-30 09:59:31.276
cmps6ioy5003zi21jf33lnxnh	GAYATRI SALES BRIJBHAI	7894441870	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.277	2026-05-30 09:59:31.277
cmps6ioy60041i21jr08jpcit	GBRIJESHBHAI B	8022723363	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.278	2026-05-30 09:59:31.278
cmps6ioy70043i21jdd70px3v	GCHETANBHAI YARD	7207472445	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.28	2026-05-30 09:59:31.28
cmps6ioy80045i21jxygd4lwx	GDIPAKBHAI PORBADNAR	7397455933	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.281	2026-05-30 09:59:31.281
cmps6ioy90047i21jw5mp21qh	GHASUBHAI BHAGDEV	8659244015	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.282	2026-05-30 09:59:31.282
cmps6ioyb0049i21jsu75xcjb	GHITESHBHAI SAH AND PAREKH	7446770656	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.283	2026-05-30 09:59:31.283
cmps6ioyd004bi21jxw9rmr8j	GIMARAN SSG	8828645587	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.285	2026-05-30 09:59:31.285
cmps6ioyf004di21j7wlixrpw	GKEYURBHAI CHAVADA	8973821229	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.287	2026-05-30 09:59:31.287
cmps6ioyh004fi21jc07qi011	GLOBAL NJ	8369418117	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.289	2026-05-30 09:59:31.289
cmps6ioyi004hi21jsb1ajjwj	GMANISHBHAI VITHLANI	9831986354	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.291	2026-05-30 09:59:31.291
cmps6ioyj004ji21j54jzfqdu	GMASARU SANJAYBHAI	8309618712	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.292	2026-05-30 09:59:31.292
cmps6ioyl004li21j9riroxgb	GMAYURBHAI KHAKHAR	7633258314	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.293	2026-05-30 09:59:31.293
cmps6ioym004ni21j4ov6m0t1	GMITHIA SANJAY	7044303606	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.295	2026-05-30 09:59:31.295
cmps6ioyo004pi21jpcs3curk	GOA GROUP	7681005466	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.296	2026-05-30 09:59:31.296
cmps6ioyp004ri21jul34k03x	GOHEL VIKBHAI	8469196169	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.298	2026-05-30 09:59:31.298
cmps6ioyr004ti21j6r5s7tzz	GOLD NJ	7694160561	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.299	2026-05-30 09:59:31.299
cmps6ioys004vi21jvcwel94l	GOPALBHAI SR	8792852653	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.301	2026-05-30 09:59:31.301
cmps6ioyv004xi21jin3vihd3	GOTECHA BHARGAV	7678254739	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.304	2026-05-30 09:59:31.304
cmps6ioyy004zi21j75be9mbz	GPANDIA VIJAYBHAI	9376812238	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.306	2026-05-30 09:59:31.306
cmps6ioyz0051i21jzsitwo9d	GPRAKASBHAI H AL	7261626490	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.308	2026-05-30 09:59:31.308
cmps6ioz00053i21jyz1cnmu5	GPRAKASH KARIYA	8292535496	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.309	2026-05-30 09:59:31.309
cmps6ioz20055i21jaq57tlzf	GRAJUMAM	8299122376	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.31	2026-05-30 09:59:31.31
cmps6ioz30057i21j13cy9yo4	GRAKESHBHAI	9097205717	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.312	2026-05-30 09:59:31.312
cmps6ioz50059i21jetygqh44	GROHITBHAI BARIYA	9235665150	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.314	2026-05-30 09:59:31.314
cmps6ioz6005bi21j15qjznbp	GRUDBRHAI	8644388786	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.315	2026-05-30 09:59:31.315
cmps6ioz8005di21jflnu1oky	GRUPARELIYA DIPAKBAHI PM	9136849377	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.316	2026-05-30 09:59:31.316
cmps6ioz9005fi21jrsp8l5fk	GSAGARBHAI YARD	8757235200	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.317	2026-05-30 09:59:31.317
cmps6iozc005hi21jxbq5aoaw	GSALIMBHAI BEKARI	9987410372	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.32	2026-05-30 09:59:31.32
cmps6ioze005ji21j5bpkzwdu	GSAURINDAR KAUR	8439507592	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.322	2026-05-30 09:59:31.322
cmps6iozg005li21jn4xwy2zz	GSURAT	9455908616	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.324	2026-05-30 09:59:31.324
cmps6iozh005ni21j0y697c2l	GTEJASHBHAI RAJDEV	9445922227	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.325	2026-05-30 09:59:31.325
cmps6iozj005pi21jcnecr5tg	GTINIBHAI	9106086202	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.327	2026-05-30 09:59:31.327
cmps6iozk005ri21jtzprey6m	GUNJANBHAI NJ	7916348781	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.328	2026-05-30 09:59:31.328
cmps6iozl005ti21j1rcsdzsk	GURUKUL NJ	7011422256	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.329	2026-05-30 09:59:31.329
cmps6iozm005vi21j29i0gu8e	GVARACHA SURAT	9553565529	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.331	2026-05-30 09:59:31.331
cmps6iozn005xi21jccg522wb	GVIJAYBHAI S	7272767181	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.332	2026-05-30 09:59:31.332
cmps6iozp005zi21j5g2mwc71	GVIKASH	8500444090	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.333	2026-05-30 09:59:31.333
cmps6iozq0061i21j6o73z6dv	GVIPULBHAI LIO	7760519270	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.334	2026-05-30 09:59:31.334
cmps6iozs0063i21jvegmnrua	GVISALBHAI	9225455291	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.337	2026-05-30 09:59:31.337
cmps6iozu0065i21j6jncrp7m	GYASHBHAI MADHURAM	8366260045	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.338	2026-05-30 09:59:31.338
cmps6iozv0067i21jhxnk6dpk	HAKUBHAI NJ	8218365659	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.34	2026-05-30 09:59:31.34
cmps6iozx0069i21jjtserc48	HARSHITBHAI KARIYA	7753469097	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.341	2026-05-30 09:59:31.341
cmps6iozy006bi21jhobzyvvj	HEAD OFFICE	9705479460	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.342	2026-05-30 09:59:31.342
cmps6iozz006di21j4yyco7b7	HIMALAY IND ASHVINBHAI	9685597516	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.343	2026-05-30 09:59:31.343
cmps6ip00006fi21j15b0yprm	HIRENBHAI PM MANGANATH	8404281423	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.344	2026-05-30 09:59:31.344
cmps6ip01006hi21jarnsfnvf	HITESHBHAI AJVANI	7580016715	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.346	2026-05-30 09:59:31.346
cmps6ip02006ji21jddwd9tvk	HITESHBHAI SUVAGIYA BHATIYA	8414131946	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.347	2026-05-30 09:59:31.347
cmps6ip03006li21jog4pfkpn	HM AGADIYA	8994084023	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.348	2026-05-30 09:59:31.348
cmps6ip05006ni21jexnfmgsd	HONEY LADIES WEAR	9397641912	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.349	2026-05-30 09:59:31.349
cmps6ip07006pi21jqyq0kee1	HP HITESHBHAI	9973244578	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.351	2026-05-30 09:59:31.351
cmps6ip09006ri21jhokmuz9g	IRFAN PASALIYA	9937803499	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.354	2026-05-30 09:59:31.354
cmps6ip0b006ti21j38x53tar	JAGADISHBHAI RUPARELIYA	7250664181	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.355	2026-05-30 09:59:31.355
cmps6ip0c006vi21jrqoz1dx7	JAGATBHAI MASARU	9279077886	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.357	2026-05-30 09:59:31.357
cmps6ip0e006xi21jzetqw72l	JALARAM FRUIT	9453937834	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.358	2026-05-30 09:59:31.358
cmps6ip0f006zi21joj35rnq0	JALYAN PROVISION SR	8402237230	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.36	2026-05-30 09:59:31.36
cmps6ip0h0071i21jpcmtfzgc	JAMA PARCHURAN	9036949598	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.361	2026-05-30 09:59:31.361
cmps6ip0i0073i21jm84foucw	JAVIDBHAI MOBILE	8167835178	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.362	2026-05-30 09:59:31.362
cmps6ip0j0075i21jz66pqb9c	JAYBHAI SONI AMBIKA CHOWK	7267059012	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.364	2026-05-30 09:59:31.364
cmps6ip0k0077i21jm76axdwi	JAYDIPSIH SOLANKI	7182307774	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.365	2026-05-30 09:59:31.365
cmps6ip0l0079i21jffp44tuz	JAYESHBHAI TRADA	8812200576	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.366	2026-05-30 09:59:31.366
cmps6ip0n007bi21jhhb72d4t	JAYSILBHAI RAJANI	9287156377	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.367	2026-05-30 09:59:31.367
cmps6ip0p007di21j063jiaaf	JIMIBHAI MOBILE	9588564644	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.369	2026-05-30 09:59:31.369
cmps6ip0r007fi21jp33aref7	JITUBHAI PARMESHVAR	8368583373	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.371	2026-05-30 09:59:31.371
cmps6ip0s007hi21jv92jwdz5	JON GOA	8447436648	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.372	2026-05-30 09:59:31.372
cmps6ip0t007ji21jaslen6d2	JOSHIBHAI BANK	7382311833	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.374	2026-05-30 09:59:31.374
cmps6ip0v007li21jh5qh3697	JSK	9093981594	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.375	2026-05-30 09:59:31.375
cmps6ip0w007ni21j5aeevyd9	JYOTI AGRO	7094581723	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.376	2026-05-30 09:59:31.376
cmps6ip0x007pi21jtrn8kgkd	KALINDRI MAHIPATBHAI	8390235909	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.377	2026-05-30 09:59:31.377
cmps6ip0y007ri21jrsbtgte3	KAMDAR MUKESHBHAI	8330130967	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.379	2026-05-30 09:59:31.379
cmps6ip0z007ti21jfb1qpxla	KARAN PROTIN	8042605544	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.38	2026-05-30 09:59:31.38
cmps6ip11007vi21jquw5jler	KARIYABHAI VINUS LIGHT HOUSE	8138084227	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.381	2026-05-30 09:59:31.381
cmps6ip12007xi21j7uv8v6mt	KAUSHALBHAI BADIYANI LAXMI	8164285735	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.382	2026-05-30 09:59:31.382
cmps6ip13007zi21j28y58e9n	KESHAV MILAN SONI	9803186306	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.383	2026-05-30 09:59:31.383
cmps6ip150081i21j0fym4pcc	KETANBHAI LAKHANI SPREE	7860891856	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.385	2026-05-30 09:59:31.385
cmps6ip170083i21j1xhcqpsx	KHODIYAR A	8925460983	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.387	2026-05-30 09:59:31.387
cmps6ip180085i21jocded386	KHUSHALBHAI VASANVADA MADHURAM	7253463974	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.389	2026-05-30 09:59:31.389
cmps6ip190087i21jarmqlbat	KHUTI BHAVESHBHAI	7483701954	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.39	2026-05-30 09:59:31.39
cmps6ip1b0089i21j87203eng	KISHANBHAI	8123645096	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.392	2026-05-30 09:59:31.392
cmps6ip1d008bi21judrudr7a	KISHORBHAI POKIA	7877356032	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.393	2026-05-30 09:59:31.393
cmps6ip1e008di21jjdy94r20	KK	7114813792	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.395	2026-05-30 09:59:31.395
cmps6ip1g008fi21jjtuoqzd0	KRISHBHAI SUKHVANI	8591871019	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.396	2026-05-30 09:59:31.396
cmps6ip1i008hi21joy95h8m2	KRUNALBHAI CHOLERA RAJKOT	8940448767	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.398	2026-05-30 09:59:31.398
cmps6ip1j008ji21jej14b16b	LADANI ADESHBHAI	8109515020	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.4	2026-05-30 09:59:31.4
cmps6ip1m008li21j4hpxfcfi	LIMBASHIYA MEHULBHAI	8496742357	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.403	2026-05-30 09:59:31.403
cmps6ip1o008ni21jx4iae0mm	LUCKYBHAI DELHI	8566976601	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.405	2026-05-30 09:59:31.405
cmps6ip1q008pi21ju44plv4n	MADHAV	9183860942	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.406	2026-05-30 09:59:31.406
cmps6ip1r008ri21j0mqyiek8	MADHURAM PM	7778424589	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.408	2026-05-30 09:59:31.408
cmps6ip1t008ti21jwzzxd1b2	MAHAVIR KALPESHBHAI	8566568751	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.409	2026-05-30 09:59:31.409
cmps6ip1u008vi21jvzaghb1p	MAHENDR SOMA AGADIYA	9234075940	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.41	2026-05-30 09:59:31.41
cmps6ip1v008xi21jee13a1eu	MAHESHBHAI MAHETA MARUTI	7647216114	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.412	2026-05-30 09:59:31.412
cmps6ip1w008zi21jp97ik4e6	MAKANJI SAMAJI PARAG	8823499550	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.413	2026-05-30 09:59:31.413
cmps6ip1y0091i21jx7z1to2p	MALI NJ	8618763936	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.414	2026-05-30 09:59:31.414
cmps6ip1z0093i21jt2tmvxiu	MANISHBHAI DEVMURARI	9868390997	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.415	2026-05-30 09:59:31.415
cmps6ip200095i21j2w1ye4nr	MANOJBHAI SURAT	8390170472	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.417	2026-05-30 09:59:31.417
cmps6ip220097i21jua9h90f9	MARADIYA VIVEK (RTO)	8613887243	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.418	2026-05-30 09:59:31.418
cmps6ip240099i21j8lonupvq	MARFATIYA ASFAKBHAI	9169146097	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.42	2026-05-30 09:59:31.42
cmps6ip25009bi21jlw9yom36	MARU SAMIRBHAI	7341297059	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.422	2026-05-30 09:59:31.422
cmps6ip27009di21jd3t9u5l4	MASI	7035551953	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.423	2026-05-30 09:59:31.423
cmps6ip28009fi21jbahgxpw7	MAYANKBHAI	9079189139	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.425	2026-05-30 09:59:31.425
cmps6ip29009hi21jo851hibq	MBHAIYA DELHI WORK SMITH	7364746215	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.426	2026-05-30 09:59:31.426
cmps6ip2b009ji21jljzp41up	MEHULBHAI AKODA NJ	7233499306	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.427	2026-05-30 09:59:31.427
cmps6ip2c009li21j2xu027rv	MIHIRBHAI MASARU	9870134620	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.428	2026-05-30 09:59:31.428
cmps6ip2d009ni21j7y3a6l8v	MILABHAI PENDAVADA	9330984729	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.429	2026-05-30 09:59:31.429
cmps6ip2e009pi21jshumw6pi	MITESHBHAI MASARU MASHIN	9878530782	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.431	2026-05-30 09:59:31.431
cmps6ip2f009ri21j6aldho1f	MM PENDING ENTRY	8591835381	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.432	2026-05-30 09:59:31.432
cmps6ip2h009ti21joob4t9a4	MOHANBHAI TIMBA	7171833745	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.433	2026-05-30 09:59:31.433
cmps6ip2i009vi21jn8oj5fse	MUKESHBHAI CHANDRDAIRY	8906725607	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.435	2026-05-30 09:59:31.435
cmps6ip2k009xi21jofcmnhkd	MUKUNDBHAI SANTILAL LALAJI	8895271720	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.437	2026-05-30 09:59:31.437
cmps6ip2m009zi21jdk8qejej	NAMITBHAI SOLANKI	7532469533	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.439	2026-05-30 09:59:31.439
cmps6ip2o00a1i21jbw92ed9r	NAMU LEVANU	8718283573	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.44	2026-05-30 09:59:31.44
cmps6ip2p00a3i21janul8mbu	NANDANBHAI BM ENT	9269528544	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.442	2026-05-30 09:59:31.442
cmps6ip2r00a5i21j31j4zbqi	NATIONAL TOOLS SAJIDBHAI	7881414170	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.443	2026-05-30 09:59:31.443
cmps6ip2t00a7i21j637w8m16	NAYANBHAI MARU	8752371819	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.445	2026-05-30 09:59:31.445
cmps6ip2u00a9i21j97gnihkl	NCHETANBHAI FALDU	7360656216	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.446	2026-05-30 09:59:31.446
cmps6ip2v00abi21jbijo1x6i	NGAURAVBHAI RUPATELIYA	9591122532	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.447	2026-05-30 09:59:31.447
cmps6ip2w00adi21jz07ny801	NILESHBHAI RAJA	8580048970	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.449	2026-05-30 09:59:31.449
cmps6ip2x00afi21jk72tyhuz	NIMESH SHREE AGADIYA	7074107473	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.45	2026-05-30 09:59:31.45
cmps6ip3000ahi21jaaz8mstu	NIRENBHAI SONI	8980638659	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.452	2026-05-30 09:59:31.452
cmps6ip3300aji21j8hej4ovr	NISHIT PATEL	9341750275	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.455	2026-05-30 09:59:31.455
cmps6ip3500ali21jv4f7jid4	NJ	8259296943	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.457	2026-05-30 09:59:31.457
cmps6ip3600ani21jcq9uhzt9	NJAMINESH LODHIYA	7221131373	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.459	2026-05-30 09:59:31.459
cmps6ip3700api21j1rmaomkl	NJASHVINBHAI MALI	9269662479	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.46	2026-05-30 09:59:31.46
cmps6ip3900ari21jo3oqc02k	NJBHARAT MUMBAI	8148248566	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.461	2026-05-30 09:59:31.461
cmps6ip3a00ati21j3csqxui8	NJCHANUDBHAI VIRANI	8637165185	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.462	2026-05-30 09:59:31.462
cmps6ip3b00avi21jiulrsaob	NJCHETANBHAI FALDU CK	9292352692	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.464	2026-05-30 09:59:31.464
cmps6ip3c00axi21joxcr5jzm	NJCHIRAGBHAI PAREKH	9519942292	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.465	2026-05-30 09:59:31.465
cmps6ip3e00azi21jp2fmdpym	NJD	9712316825	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.466	2026-05-30 09:59:31.466
cmps6ip3f00b1i21jf7l4hkdg	NJDAVE SHAILESH	8446790742	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.467	2026-05-30 09:59:31.467
cmps6ip3h00b3i21jzeistyi7	NJDHARMESHBHAI	9665355012	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.47	2026-05-30 09:59:31.47
cmps6ip3j00b5i21jwqgxc75c	NJDHARMIKBHAI	9880243245	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.472	2026-05-30 09:59:31.472
cmps6ip3l00b7i21jdhjk3oiz	NJGAGAN DELHI	8718073243	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.473	2026-05-30 09:59:31.473
cmps6ip3m00b9i21jk30alr4l	NJHITESHBHAI POPAT	9369771129	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.474	2026-05-30 09:59:31.474
cmps6ip3n00bbi21j3ksdcdfr	NJJAYDIPBHAI DELHI	8754752401	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.476	2026-05-30 09:59:31.476
cmps6ip3o00bdi21j809vbznu	NJJITUBHAI	7633047756	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.477	2026-05-30 09:59:31.477
cmps6ip3q00bfi21jgh01s5bl	NJK TOKAN	9071505469	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.478	2026-05-30 09:59:31.478
cmps6ip3r00bhi21jdlv75r8k	NJKALPESH JK AMD	9814473878	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.479	2026-05-30 09:59:31.479
cmps6ip3s00bji21jxbua5815	NJKANOBHAI	8776604357	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.48	2026-05-30 09:59:31.48
cmps6ip3t00bli21j7f4h7q2z	NJKETAN RAJPARA	9957803939	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.482	2026-05-30 09:59:31.482
cmps6ip3u00bni21j2bq13taf	NJKETAN ROYAL	8908644852	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.483	2026-05-30 09:59:31.483
cmps6ip3w00bpi21j3iu50j3h	NJKUNJ	9692122089	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.485	2026-05-30 09:59:31.485
cmps6ip4000bri21j63v3foy3	NJMAHESHBHAI	9611140846	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.488	2026-05-30 09:59:31.488
cmps6ip4100bti21j8f6vdkh2	NJMAHESHBHAI TANK	9852394540	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.49	2026-05-30 09:59:31.49
cmps6ip4300bvi21jii18fvgg	NJMAHIPATBHAI RAJKOT	7702972672	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.491	2026-05-30 09:59:31.491
cmps6ip4400bxi21jxw9o0fvd	NJMANISHBHAI VADNAGARA	9091161023	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.493	2026-05-30 09:59:31.493
cmps6ip4600bzi21jjej6pb1g	NJMANUJPAR MAHESH	7936758859	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.494	2026-05-30 09:59:31.494
cmps6ip4700c1i21jtjzhg4j4	NJMAULIK PARMAR	8687428372	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.495	2026-05-30 09:59:31.495
cmps6ip4800c3i21jrthvhdkd	NJMITHIYA DHARMESHBHAI	7790749233	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.497	2026-05-30 09:59:31.497
cmps6ip4900c5i21jpqmqiauu	NJMOINBHAI	9177049538	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.498	2026-05-30 09:59:31.498
cmps6ip4b00c7i21jfqohxw5z	NJMUNABHAI BROKER	8305457842	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.499	2026-05-30 09:59:31.499
cmps6ip4c00c9i21j59s4tyy1	NJNAYAN 2	8922097538	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.5	2026-05-30 09:59:31.5
cmps6ip4e00cbi21j99pmp68i	NJNILESHBHAI DHULESHIYA	7482607665	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.502	2026-05-30 09:59:31.502
cmps6ip4g00cdi21j224eog4y	NJNIRAVBHAI UNDAKAT	7001397292	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.504	2026-05-30 09:59:31.504
cmps6ip4h00cfi21jtvphgomp	NJPRATIKBHAI RAJ RAJKOT	9886156477	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.505	2026-05-30 09:59:31.505
cmps6ip4j00chi21jdc29o0hi	NJPUNITBHAI	9325988488	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.507	2026-05-30 09:59:31.507
cmps6ip4k00cji21jd45zjp0z	NJRAJANBHAI DOLARBHAI	9810915026	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.509	2026-05-30 09:59:31.509
cmps6ip4m00cli21j7zv9wm71	NJROHITBHAI DHANDAL	8863388233	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.51	2026-05-30 09:59:31.51
cmps6ip4n00cni21jxz0v8a8m	NJSACHINBHAI AMD	8232249543	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.512	2026-05-30 09:59:31.512
cmps6ip4p00cpi21jwex1l9ik	NJSAIYALI HAIR PARLORE	9687948971	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.513	2026-05-30 09:59:31.513
cmps6ip4q00cri21ja3c18a69	NJTEJASHBHAI RAJDEVA	8389924613	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.515	2026-05-30 09:59:31.515
cmps6ip4s00cti21ji2l8of0j	NJTIKUBHAI MARBEL	9119825685	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.516	2026-05-30 09:59:31.516
cmps6ip4v00cvi21jqo1uxzx0	NJVIHABHAI H RD	9784413145	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.519	2026-05-30 09:59:31.519
cmps6ip4x00cxi21jsoezduhp	NJVISHAL DHANDAL	7145814054	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.522	2026-05-30 09:59:31.522
cmps6ip4z00czi21j2pp8l71q	NJVP	8370166780	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.523	2026-05-30 09:59:31.523
cmps6ip5000d1i21jl2pj8xti	NJYATIN KOTECHA	7875856603	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.525	2026-05-30 09:59:31.525
cmps6ip5200d3i21jekpxsgkk	NJYOGESHBAHI TANK	8707338079	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.527	2026-05-30 09:59:31.527
cmps6ip5400d5i21jrxw7o731	NJYOGESHBHAI MUMBAI	9450336697	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.528	2026-05-30 09:59:31.528
cmps6ip5500d7i21j3pnek6z5	NK SETH LOTUS HOTEL	9973191410	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.53	2026-05-30 09:59:31.53
cmps6ip5700d9i21jonr8x4mu	NMANDABHAI HUN	7313095045	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.531	2026-05-30 09:59:31.531
cmps6ip5800dbi21j7iun3xcv	NO	8337590156	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.532	2026-05-30 09:59:31.532
cmps6ip5900ddi21jazb8p9ym	NPRATHAMESHBHAI	7653436414	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.534	2026-05-30 09:59:31.534
cmps6ip5c00dfi21jkrmluxuz	NR AGADIYA TALAV	7964972391	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.536	2026-05-30 09:59:31.536
cmps6ip5e00dhi21jq1btvk6w	NSURESH DATANI	9671010210	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.538	2026-05-30 09:59:31.538
cmps6ip5f00dji21jy5xugj11	OFFICE RENT	7295379980	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.54	2026-05-30 09:59:31.54
cmps6ip5g00dli21jw2zvujqx	OLD LBL	9198206265	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.541	2026-05-30 09:59:31.541
cmps6ip5i00dni21jxgjj97ih	PAN INDIA TKN	9537290493	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.542	2026-05-30 09:59:31.542
cmps6ip5j00dpi21jm5zhzubf	PANKAJBHAI SHREEJI STEEL	8632943712	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.543	2026-05-30 09:59:31.543
cmps6ip5k00dri21jsgletouk	PARESBHAI GIRIRAJ VASAN	9330973030	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.544	2026-05-30 09:59:31.544
cmps6ip5l00dti21jgona9u8z	PARMAR KETANBHAI	7010539580	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.546	2026-05-30 09:59:31.546
cmps6ip5n00dvi21jw670tfuj	PARTH PARMAR	7915580598	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.547	2026-05-30 09:59:31.547
cmps6ip5o00dxi21jyndszp36	PATEL RESTAURANTS SANTILAL	7420879090	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.549	2026-05-30 09:59:31.549
cmps6ip5q00dzi21jshh7d337	PINTUBHAI RAJKOT	8446205678	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.55	2026-05-30 09:59:31.55
cmps6ip5r00e1i21jiria2p1s	PJ	7584177931	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.551	2026-05-30 09:59:31.551
cmps6ip5t00e3i21jb4nwovzy	PM3 YARD	9501360650	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.553	2026-05-30 09:59:31.553
cmps6ip5v00e5i21jse9ativy	POPAT NAYANBHAI	9841458033	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.555	2026-05-30 09:59:31.555
cmps6ip5w00e7i21jc7h6jpfa	PRASANTBHAI RAJKO	9182963968	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.557	2026-05-30 09:59:31.557
cmps6ip5y00e9i21jbnmmmqco	PRATAPSING SHYAM AGNESY	8246960971	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.558	2026-05-30 09:59:31.558
cmps6ip5z00ebi21jbmvx6nl9	PRIME DK {DHARMIKBHAI}	8998534352	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.559	2026-05-30 09:59:31.559
cmps6ip6000edi21jdind5uny	PVIJAY AGADIYA	7358525112	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.561	2026-05-30 09:59:31.561
cmps6ip6100efi21jcjlijgom	RAJENDRBHAI KHUMAN	9057831845	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.562	2026-05-30 09:59:31.562
cmps6ip6300ehi21jzv5rn8h5	RAJESH MAGAN JITUBHAI	7015596055	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.563	2026-05-30 09:59:31.563
cmps6ip6400eji21j3vzaec2a	RAM BROKER	7598853089	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.565	2026-05-30 09:59:31.565
cmps6ip6600eli21jrgoft6ee	RAMANIK POPAT	9927942127	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.566	2026-05-30 09:59:31.566
cmps6ip6800eni21j32tz6jm0	RAMESHBHAI JAMARIYA	9761363963	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.569	2026-05-30 09:59:31.569
cmps6ip6b00epi21jezrxm4zf	RASHIKBHAI POPAT	9076609396	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.571	2026-05-30 09:59:31.571
cmps6ip6c00eri21jr3p0cka4	RASMINBHAI PRIME AG	9127713652	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.573	2026-05-30 09:59:31.573
cmps6ip6e00eti21j3yplgdds	RATADIYA FARM	8547322767	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.574	2026-05-30 09:59:31.574
cmps6ip6g00evi21jhuqorgv1	RATANSHI MAVAJI	9511890501	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.576	2026-05-30 09:59:31.576
cmps6ip6h00exi21ju085yf5a	RAVIBHAI KARIYA	7202763261	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.578	2026-05-30 09:59:31.578
cmps6ip6j00ezi21jk6uwus2u	RAYON	7268721024	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.579	2026-05-30 09:59:31.579
cmps6ip6l00f1i21j3hckkzss	RJ ACC	7701809035	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.581	2026-05-30 09:59:31.581
cmps6ip6m00f3i21jbrzrmqrc	RK ENT BAPU	8570160661	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.583	2026-05-30 09:59:31.583
cmps6ip6o00f5i21j6z59e191	ROCKYBHAI DELHI	8373796745	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.585	2026-05-30 09:59:31.585
cmps6ip6r00f7i21juituy1ln	ROHANBHAI THAKAR	9883867055	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.587	2026-05-30 09:59:31.587
cmps6ip6s00f9i21jtpvx61tk	ROMIBHAI TALATI	8686558102	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.589	2026-05-30 09:59:31.589
cmps6ip6u00fbi21jczvjl39j	ROYAL GOA	7849129244	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.59	2026-05-30 09:59:31.59
cmps6ip6v00fdi21jmx28dbmf	RPTALAV	7579898397	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.592	2026-05-30 09:59:31.592
cmps6ip6x00ffi21jseck6j4t	RS GROUP	9937347987	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.593	2026-05-30 09:59:31.593
cmps6ip6y00fhi21jc0b35bw6	SAGAR HOTEL AMINBHAI	9018297597	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.595	2026-05-30 09:59:31.595
cmps6ip6z00fji21j48on0sdi	SAMIR TREDING AKIBBHAI	8498066063	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.596	2026-05-30 09:59:31.596
cmps6ip7100fli21j3sxzxx0m	SANDIPBHAI PARMA	7572422026	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.597	2026-05-30 09:59:31.597
cmps6ip7200fni21j6ws7z1c7	SANDIPBHAI RUPARELIYA	7315725030	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.599	2026-05-30 09:59:31.599
cmps6ip7400fpi21jxt2aviha	SANDY INDOR	8707144889	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.6	2026-05-30 09:59:31.6
cmps6ip7700fri21jlajfykj9	SANGHAVI MANISBHAI	8264719201	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.603	2026-05-30 09:59:31.603
cmps6ip7800fti21ja3weu7mf	SANJAY BHAI	9650518183	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.605	2026-05-30 09:59:31.605
cmps6ip7a00fvi21j0mrb3urj	SANKALP NJ	8720555722	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.607	2026-05-30 09:59:31.607
cmps6ip7b00fxi21jh1iun3fk	SARTHAKBHAI MARAVADI	7284688816	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.608	2026-05-30 09:59:31.608
cmps6ip7d00fzi21jqepm7a9g	SEKHADABHAI	7154363331	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.609	2026-05-30 09:59:31.609
cmps6ip7e00g1i21j6myjdex0	SHAILESHBHAI BADIYANI	7125837797	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.61	2026-05-30 09:59:31.61
cmps6ip7f00g3i21jpshxd5qa	SHAILESHBHAI PANDIA	8400794053	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.612	2026-05-30 09:59:31.612
cmps6ip7h00g5i21jocp1wieo	SHAKTIBHAI NJ	9379949075	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.613	2026-05-30 09:59:31.613
cmps6ip7i00g7i21jdx8l52n0	SHOBHA NIDHI CREATION NJ	8707712018	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.614	2026-05-30 09:59:31.614
cmps6ip7j00g9i21jkz570f75	SHREEJI GRUH UDHAYOG	9549871902	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.616	2026-05-30 09:59:31.616
cmps6ip7l00gbi21jdmr3jfkw	SHREYANSHBHAI(DC)	9346806058	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.617	2026-05-30 09:59:31.617
cmps6ip7n00gdi21jwk7qwbe0	SK GOA	7188555999	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.619	2026-05-30 09:59:31.619
cmps6ip7p00gfi21jb40tab17	SMITH WORK 2	7532108611	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.621	2026-05-30 09:59:31.621
cmps6ip7q00ghi21jhiz9yv0f	SOMA KANCHAN AGADIYA	7888253856	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.623	2026-05-30 09:59:31.623
cmps6ip7s00gji21jv4agmfoi	SONIBAJAR PRIME	8989032097	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.624	2026-05-30 09:59:31.624
cmps6ip7t00gli21jz2b00o2c	SOYEBBHAI VAJA KHEDUT	8568798656	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.625	2026-05-30 09:59:31.625
cmps6ip7u00gni21j547fmh6w	SP AGADIYA TALAV	7235484787	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.627	2026-05-30 09:59:31.627
cmps6ip7w00gpi21j00iulzam	SRCHADRESBHAI RAJKOT	9447840052	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.628	2026-05-30 09:59:31.628
cmps6ip7x00gri21jz3q6is0x	SRJALAYN KIRANA	7273191835	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.629	2026-05-30 09:59:31.629
cmps6ip7y00gti21jwt2ky3mw	SRJAYESH PROVI	9709956649	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.631	2026-05-30 09:59:31.631
cmps6ip8000gvi21jwn04oypp	SRKISANBHAI	9965194670	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.632	2026-05-30 09:59:31.632
cmps6ip8100gxi21jpqrsff7h	SRMOHITBHAI	8883709228	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.633	2026-05-30 09:59:31.633
cmps6ip8200gzi21j3t16kqgr	SRVIPULBHAI RAJA	7415400130	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.635	2026-05-30 09:59:31.635
cmps6ip8400h1i21j7foplqgi	SSG	7955209708	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.637	2026-05-30 09:59:31.637
cmps6ip8600h3i21jij94tinc	TARUNBHAI DELHI	8858531053	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.638	2026-05-30 09:59:31.638
cmps6ip8700h5i21jqt4c82l4	TEJASHBHAI SANGANI	8550104006	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.639	2026-05-30 09:59:31.639
cmps6ip8800h7i21jgplry56y	TEJUBHAI BADANI	9936325745	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.641	2026-05-30 09:59:31.641
cmps6ip8a00h9i21j85fsoa9u	TJ TKN	9565829946	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.642	2026-05-30 09:59:31.642
cmps6ip8b00hbi21j495acyg4	TRADA JAYESHBHAI	9536949632	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.643	2026-05-30 09:59:31.643
cmps6ip8c00hdi21jgyfecffu	UDAYBHAI DHANESA	9845861510	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.645	2026-05-30 09:59:31.645
cmps6ip8d00hfi21jn4ki1vei	UDHAR PARCHURAN	7314409936	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.646	2026-05-30 09:59:31.646
cmps6ip8f00hhi21ji4puth3k	UPADHYEY SHAILESHBHAI PUMP	7879969901	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.647	2026-05-30 09:59:31.647
cmps6ip8g00hji21j48z2ybyc	URVIBEN{SANDIPBHAI NEW}	7992567678	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.648	2026-05-30 09:59:31.648
cmps6ip8h00hli21joknxuls5	VARSH IND GOPALBHAI	8679198259	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.65	2026-05-30 09:59:31.65
cmps6ip8j00hni21ji8hk2ijp	VASANT TRADING JATINBHAI	8835558164	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.651	2026-05-30 09:59:31.651
cmps6ip8l00hpi21j723gtyjm	VIJAYBHAI RAJA BHAGVATI	7836283230	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.654	2026-05-30 09:59:31.654
cmps6ip8n00hri21jukho7qtq	VINAY IND	9370241314	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.655	2026-05-30 09:59:31.655
cmps6ip8o00hti21j9i0kkbyh	VISHNU KANTI AGADIYA	7077360013	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.657	2026-05-30 09:59:31.657
cmps6ip8q00hvi21jkqitrkba	VIVEK KISHORKAKA	8685870384	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.658	2026-05-30 09:59:31.658
cmps6ip8r00hxi21j1e38vm1o	VK DELHI	7892407818	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.659	2026-05-30 09:59:31.659
cmps6ip8s00hzi21j6gyog6pc	VPATEL AGADIYA	8363217978	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.661	2026-05-30 09:59:31.661
cmps6ip8u00i1i21joyfp7hbw	WEDDING COLLECITON	8850309972	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.662	2026-05-30 09:59:31.662
cmps6ip8v00i3i21jquztwcpc	YASHINBHAI SITARA PAN	7246939863	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.663	2026-05-30 09:59:31.663
cmps6ip8w00i5i21jlwmg3zt2	ZANZARDA PM	7552143645	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.665	2026-05-30 09:59:31.665
cmps6ip8x00i7i21jl20b6wnp	ZJ ZALA JITUBHAI	7393684624	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.666	2026-05-30 09:59:31.666
cmps6ip8z00i9i21jyvgae0nm	ANG TKN NAGPUR	992253946	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.667	2026-05-30 09:59:31.667
cmps6ip9100ibi21j3v5vkv92	romil	\N	\N	\N	\N	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.669	2026-05-30 09:59:31.669
cmps6iov10001i21jw7oyt8jf	3K(KKK)	9778860854	\N	\N	jnd	\N	\N	cmps2l3x3000011oto35qgrdq	t	f	2026-05-30 09:59:31.164	2026-05-30 11:06:23.563
cmps8x2730007mf1n3i77dibx	AAA	8780670096	\N	\N	jnd	\N	\N	cmps2l3x3000011oto35qgrdq	f	t	2026-05-30 11:06:40.862	2026-05-30 11:15:03.202
cmps995cp000bo8kexskw2564	romil	7777777777	\N	\N	JND	\N	\N	cmps2l3yb000111otsxcjhs5f	t	f	2026-05-30 11:16:04.826	2026-05-30 11:16:14.603
cmps99qrb000fo8keotp4dclq	rocky	9099916300	\N	\N	jnd	\N	\N	cmps2l3yb000111otsxcjhs5f	f	t	2026-05-30 11:16:32.566	2026-05-30 11:16:38.315
cmps9bb6t000lo8ke2chl8t58	jack	1234567890	\N	\N	JND	\N	\N	cmps2l3yb000111otsxcjhs5f	t	f	2026-05-30 11:17:45.7	2026-05-30 11:17:45.7
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, permissions, "isActive", "isDeleted", "createdAt", "updatedAt") FROM stdin;
cmpp3z1qe0001knarkjvco2np	Admin	Administrative access with most permissions	{"hawala": "all", "reports": {"report_1": true, "report_2": true, "report_3": true, "report_4": true, "report_5": true, "report_6": true, "report_7": true}, "dashboard": {"view": true}, "accounting": "all", "masterData": "full_access", "balanceSheet": "all", "specialEntry": "all", "transactions": {"inward": true, "outward": true}}	t	f	2026-05-28 06:24:56.967	2026-05-28 06:24:56.967
cmpp3z1qa0000knarziwakbcj	Super Admin	Super Admin role	{"hawala": "all", "master": {"roles": "all", "users": "all", "cities": "all", "clients": "all", "branches": "all"}, "reports": {"report_1": true, "report_2": true, "report_3": true, "report_4": true, "report_5": true, "report_6": true, "report_7": true}, "dashboard": {"view": true}, "accounting": "all", "masterData": "full_access", "balanceSheet": "all", "specialEntry": "all", "transactions": {"inward": true, "outward": true}}	t	f	2026-05-28 06:24:56.962	2026-05-30 08:09:25.576
cmps2l3yi000311otj1n0umnz	PM2	PM2 role	{"hawala": "all", "master": {"roles": "none", "users": "none", "cities": "all", "clients": "all", "branches": "none"}, "reports": {"report_1": true, "report_2": true, "report_3": true, "report_4": true, "report_5": true, "report_6": true, "report_7": true}, "dashboard": {"view": true}, "accounting": "all", "masterData": "role_based_access", "balanceSheet": "all", "specialEntry": "all", "transactions": {"inward": true, "outward": true}}	t	f	2026-05-30 08:09:25.579	2026-05-30 08:09:25.579
cmps2l3yk000411otijuv6y8i	Vpatel	Vpatel role	{"hawala": "all", "master": {"roles": "none", "users": "none", "cities": "all", "clients": "all", "branches": "none"}, "reports": {"report_1": true, "report_2": true, "report_3": true, "report_4": true, "report_5": true, "report_6": true, "report_7": true}, "dashboard": {"view": true}, "accounting": "all", "masterData": "role_based_access", "balanceSheet": "all", "specialEntry": "all", "transactions": {"inward": true, "outward": true}}	t	f	2026-05-30 08:09:25.581	2026-05-30 08:09:25.581
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_sessions (id, "userId", "refreshToken", "ipAddress", "userAgent", "isActive", "isDeleted", "createdAt", "updatedAt", "expiresAt") FROM stdin;
cmps31psv0001aq9bu4759lxx	cmps2l47s000611ota04mqbzo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0N3MwMDA2MTFvdGEwNG1xYnpvIiwiZW1haWwiOiJyb21pbC1zdXBlcmR1cGVyQG1haWwucm9tIiwidXNlcm5hbWUiOiJyb21pbC5zdXBlcmFkbWluIiwiaWF0IjoxNzgwMTI5MzQwLCJleHAiOjE3ODA3MzQxNDB9.ZLXr1nwF2swtJWFLuipdiZbKBCxKbVgs_nNqDFdpp2A	\N	\N	t	f	2026-05-30 08:22:20.384	2026-05-30 08:22:20.384	2026-06-06 08:22:20.382
cmps36ksm0004aq9bomxu0fi0	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDEyOTU2NywiZXhwIjoxNzgwNzM0MzY3fQ.R93eEF5gcr-cFCpEUiWMepwPPxmuc2jFTKSnJKs6Llc	\N	\N	t	f	2026-05-30 08:26:07.174	2026-05-30 08:26:07.174	2026-06-06 08:26:07.173
cmps38geu0006aq9bc7lehy50	cmps2l4qb000a11otxq281suw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0cWIwMDBhMTFvdHhxMjgxc3V3IiwiZW1haWwiOiJwYXJpbmJoYWlAbWFpbC5jb20iLCJ1c2VybmFtZSI6InBhcmluYmhhaS52cCIsImlhdCI6MTc4MDEyOTY1NCwiZXhwIjoxNzgwNzM0NDU0fQ.cCa-AOareBDEnkgzjwdD-1JChsFKB_cZurDSROszqRA	\N	\N	t	f	2026-05-30 08:27:34.806	2026-05-30 08:27:34.806	2026-06-06 08:27:34.805
cmps4ezsl0008aq9blkzff9ug	cmps2l4qb000a11otxq281suw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0cWIwMDBhMTFvdHhxMjgxc3V3IiwiZW1haWwiOiJwYXJpbmJoYWlAbWFpbC5jb20iLCJ1c2VybmFtZSI6InBhcmluYmhhaS52cCIsImlhdCI6MTc4MDEzMTYzOSwiZXhwIjoxNzgwNzM2NDM5fQ.KE7rzdJck3q-oMBWHL2v0Ts86RMnVbGG0U-_2ytJJps	\N	\N	t	f	2026-05-30 09:00:39.477	2026-05-30 09:00:39.477	2026-06-06 09:00:39.475
cmps7n90w0001l07emxvv9d47	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiaWF0IjoxNzgwMTM3MDYzLCJleHAiOjE3ODA3NDE4NjN9.SMiJnuC3MLRR9xavvmuCzhv3JhR7h1Qbu2zCWTyouag	\N	\N	t	f	2026-05-30 10:31:03.537	2026-05-30 10:31:03.537	2026-06-06 10:31:03.531
cmps7qngr000111ox7na4sku5	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDEzNzIyMiwiZXhwIjoxNzgwNzQyMDIyfQ.L9ggxh9B-8PfySdPo3KDhKDXmXbOvdoe51LBgiVxk38	\N	\N	t	f	2026-05-30 10:33:42.219	2026-05-30 10:33:42.219	2026-06-06 10:33:42.209
cmps7wbqq0001emulwv2i4lu5	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDEzNzQ4NiwiZXhwIjoxNzgwNzQyMjg2fQ.pKyqevFDjv8GWGoILA8M9O7JFp3Wo5bASEQyLNeZfZU	\N	\N	t	f	2026-05-30 10:38:06.958	2026-05-30 10:38:06.958	2026-06-06 10:38:06.95
cmps7wtwe0003emuldqb7rtr1	cmps2l4qb000a11otxq281suw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0cWIwMDBhMTFvdHhxMjgxc3V3IiwiZW1haWwiOiJwYXJpbmJoYWlAbWFpbC5jb20iLCJ1c2VybmFtZSI6InBhcmluYmhhaS52cCIsImlhdCI6MTc4MDEzNzUxMCwiZXhwIjoxNzgwNzQyMzEwfQ.FfGq88Tjw0nznePo-WJUigetzdxt3aJG1sldZYbjmbU	\N	\N	t	f	2026-05-30 10:38:30.494	2026-05-30 10:38:30.494	2026-06-06 10:38:30.486
cmps8n44h0001mf1nqmlbbk8s	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDEzODczNiwiZXhwIjoxNzgwNzQzNTM2fQ.gEcFs6xCbU_y6dh-hFqb2_MRwVTEg1BsMV5KegStE2Y	\N	\N	t	f	2026-05-30 10:58:56.795	2026-05-30 10:58:56.795	2026-06-06 10:58:56.791
cmps8ydfa0009mf1nbdnsagy2	cmps2l4qb000a11otxq281suw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0cWIwMDBhMTFvdHhxMjgxc3V3IiwiZW1haWwiOiJwYXJpbmJoYWlAbWFpbC5jb20iLCJ1c2VybmFtZSI6InBhcmluYmhhaS52cCIsImlhdCI6MTc4MDEzOTI2MiwiZXhwIjoxNzgwNzQ0MDYyfQ.nzHoJUFYwM8K5C5OT3So356xMka2tqFqXJnCCCjx6KQ	\N	\N	t	f	2026-05-30 11:07:42.07	2026-05-30 11:07:42.07	2026-06-06 11:07:42.069
cmps978gl0001o8kewolh71el	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDEzOTY3NSwiZXhwIjoxNzgwNzQ0NDc1fQ.-7dKxcG9Qde0B-2C03gK9UGbfT7wGilJ0Y0aAFBfLlU	\N	\N	t	f	2026-05-30 11:14:35.538	2026-05-30 11:14:35.538	2026-06-06 11:14:35.53
cmps98g2w0007o8kee7jlovz2	cmps2l4qb000a11otxq281suw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0cWIwMDBhMTFvdHhxMjgxc3V3IiwiZW1haWwiOiJwYXJpbmJoYWlAbWFpbC5jb20iLCJ1c2VybmFtZSI6InBhcmluYmhhaS52cCIsImlhdCI6MTc4MDEzOTczMiwiZXhwIjoxNzgwNzQ0NTMyfQ.d4NQ3yoHKkY_rpVUSN3L_jpnMC9-ABaNPmsaZhUlYo0	\N	\N	t	f	2026-05-30 11:15:32.072	2026-05-30 11:15:32.072	2026-06-06 11:15:32.065
cmps9acem000jo8keey1hikir	cmps2l47s000611ota04mqbzo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0N3MwMDA2MTFvdGEwNG1xYnpvIiwiZW1haWwiOiJyb21pbC1zdXBlcmR1cGVyQG1haWwucm9tIiwidXNlcm5hbWUiOiJyb21pbC5zdXBlcmFkbWluIiwiaWF0IjoxNzgwMTM5ODIwLCJleHAiOjE3ODA3NDQ2MjB9.DeefN59KL26gJ0vFRZ4HQhG1gS60MflA6TNNTAQrO9E	\N	\N	t	f	2026-05-30 11:17:00.623	2026-05-30 11:17:00.623	2026-06-06 11:17:00.621
cmps9c81n000po8kerot9hsx5	cmps2l4qb000a11otxq281suw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0cWIwMDBhMTFvdHhxMjgxc3V3IiwiZW1haWwiOiJwYXJpbmJoYWlAbWFpbC5jb20iLCJ1c2VybmFtZSI6InBhcmluYmhhaS52cCIsImlhdCI6MTc4MDEzOTkwOCwiZXhwIjoxNzgwNzQ0NzA4fQ.O2EqEpWkEKQT3qP_yoIXC69yMuF2h24itcw386lGfTU	\N	\N	t	f	2026-05-30 11:18:28.283	2026-05-30 11:18:28.283	2026-06-06 11:18:28.282
cmps9yhkw0001bcr84kgn7oj9	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDE0MDk0NywiZXhwIjoxNzgwNzQ1NzQ3fQ.m1Ja-ewxcWDq82H7h2t4KmhI1HglZzsRaslzSoO6mhA	\N	\N	t	f	2026-05-30 11:35:47.067	2026-05-30 11:35:47.067	2026-06-06 11:35:47.055
cmpsajt5m000148wm0kgw9lnw	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDE0MTk0MSwiZXhwIjoxNzgwNzQ2NzQxfQ.RJMicTekt5bfZVbSLKT2PFT-DDnL39M3FAUKYpY64iE	\N	\N	t	f	2026-05-30 11:52:21.85	2026-05-30 11:52:21.85	2026-06-06 11:52:21.848
cmpsb1pq70001l24jjo9oy527	cmps2l4hc000811otw0qw2n4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0aGMwMDA4MTFvdHcwcXcybjRrIiwiZW1haWwiOiJuaXNoaXRAcG0yLmNvbSIsInVzZXJuYW1lIjoibmlzaGl0LnBtMiIsImlhdCI6MTc4MDE0Mjc3NywiZXhwIjoxNzgwNzQ3NTc3fQ.MSgr1GjWIDDIZON5dRa0qdVmUPSWkscbF2X4-pRf-Rc	\N	\N	t	f	2026-05-30 12:06:17.215	2026-05-30 12:06:17.215	2026-06-06 12:06:17.211
cmpsbas5a000il24j85xev005	cmps2l4qb000a11otxq281suw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXBzMmw0cWIwMDBhMTFvdHhxMjgxc3V3IiwiZW1haWwiOiJwYXJpbmJoYWlAbWFpbC5jb20iLCJ1c2VybmFtZSI6InBhcmluYmhhaS52cCIsImlhdCI6MTc4MDE0MzIwMCwiZXhwIjoxNzgwNzQ4MDAwfQ.tP60sDnHACcrLriEUFLG12hFeU5DHQ6rgnWzxq36-8A	\N	\N	t	f	2026-05-30 12:13:20.254	2026-05-30 12:13:20.254	2026-06-06 12:13:20.25
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, password, "firstName", "lastName", phone, "isActive", "isDeleted", "createdAt", "updatedAt", "roleId", "branchId") FROM stdin;
cmpp47abo0001ii2knuh2yues	archived.cmpp47abo0001ii2knuh2yues@deleted.local	archived_cmpp47abo0001ii2knuh2yues	$2b$10$EmINaupGiyfqj5Lae.eH9Of1/XCpmLMprXX.CaMlEHnmaPo8pQX/e	System	Administrator	+91-9876543210	f	t	2026-05-28 06:31:21.348	2026-05-30 08:09:25.52	cmpp3z1qe0001knarkjvco2np	\N
cmps2l47s000611ota04mqbzo	romil-superduper@mail.rom	romil.superadmin	$2b$12$7JdI26deS5cUa6YOG2ejKO/6aJ66BlB/6QDC05WNj7D/xHVknINEm	Romil	Super Admin	+91-9000000001	t	f	2026-05-30 08:09:25.912	2026-05-30 08:09:25.912	cmpp3z1qa0000knarziwakbcj	\N
cmps2l4hc000811otw0qw2n4k	nishit@pm2.com	nishit.pm2	$2b$12$MAQ9qiGUwJ54IkSWps0hZ.fUs3t07LQ8Eyua77VB0WxD7vCrpszBa	Nishit	PM2	+91-9000000002	t	f	2026-05-30 08:09:26.256	2026-05-30 08:09:26.256	cmps2l3yi000311otj1n0umnz	cmps2l3x3000011oto35qgrdq
cmps2l4qb000a11otxq281suw	parinbhai@mail.com	parinbhai.vp	$2b$12$6QQAmBDwMDir5XhQ/dpgLuD3rglP9MZYabyBRp5MPe2Q8ahRVSxvi	Parin	Vpatel	+91-9000000003	t	f	2026-05-30 08:09:26.58	2026-05-30 08:09:26.58	cmps2l3yk000411otijuv6y8i	cmps2l3yb000111otsxcjhs5f
cmps79tb30001144npd8cwyc2	admin@mail.com	admin	$2b$10$COVCB6YcLOq3mFbdRvfddejlOM7jhWdSLad3e6urOEQymMGn5t8Zu	System	Administrator	+91-9876543210	t	f	2026-05-30 10:20:36.639	2026-05-30 10:20:36.639	cmpp3z1qe0001knarkjvco2np	\N
\.


--
-- Name: Hawala Hawala_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Hawala"
    ADD CONSTRAINT "Hawala_pkey" PRIMARY KEY (id);


--
-- Name: SpecialEntry SpecialEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpecialEntry"
    ADD CONSTRAINT "SpecialEntry_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: account_categories account_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_categories
    ADD CONSTRAINT account_categories_pkey PRIMARY KEY (id);


--
-- Name: account_entries account_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_entries
    ADD CONSTRAINT account_entries_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: balance_sheets balance_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_sheets
    ADD CONSTRAINT balance_sheets_pkey PRIMARY KEY (id);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: client_ledgers client_ledgers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_ledgers
    ADD CONSTRAINT client_ledgers_pkey PRIMARY KEY (id);


--
-- Name: commission_rates commission_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_rates
    ADD CONSTRAINT commission_rates_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: parties parties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT parties_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Hawala_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Hawala_createdBy_idx" ON public."Hawala" USING btree ("createdBy");


--
-- Name: Hawala_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Hawala_date_idx" ON public."Hawala" USING btree (date);


--
-- Name: Hawala_partyA_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Hawala_partyA_idx" ON public."Hawala" USING btree ("partyA");


--
-- Name: Hawala_partyB_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Hawala_partyB_idx" ON public."Hawala" USING btree ("partyB");


--
-- Name: Hawala_transactionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Hawala_transactionId_idx" ON public."Hawala" USING btree ("transactionId");


--
-- Name: Hawala_transactionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Hawala_transactionId_key" ON public."Hawala" USING btree ("transactionId");


--
-- Name: SpecialEntry_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpecialEntry_createdBy_idx" ON public."SpecialEntry" USING btree ("createdBy");


--
-- Name: SpecialEntry_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpecialEntry_date_idx" ON public."SpecialEntry" USING btree (date);


--
-- Name: SpecialEntry_partyA_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpecialEntry_partyA_idx" ON public."SpecialEntry" USING btree ("partyA");


--
-- Name: SpecialEntry_partyB_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpecialEntry_partyB_idx" ON public."SpecialEntry" USING btree ("partyB");


--
-- Name: SpecialEntry_partyC_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpecialEntry_partyC_idx" ON public."SpecialEntry" USING btree ("partyC");


--
-- Name: SpecialEntry_transactionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpecialEntry_transactionId_idx" ON public."SpecialEntry" USING btree ("transactionId");


--
-- Name: SpecialEntry_transactionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SpecialEntry_transactionId_key" ON public."SpecialEntry" USING btree ("transactionId");


--
-- Name: Transaction_centerId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_centerId_date_idx" ON public."Transaction" USING btree ("centerId", date);


--
-- Name: Transaction_centerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_centerId_idx" ON public."Transaction" USING btree ("centerId");


--
-- Name: Transaction_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_createdBy_idx" ON public."Transaction" USING btree ("createdBy");


--
-- Name: Transaction_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_date_idx" ON public."Transaction" USING btree (date);


--
-- Name: Transaction_date_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_date_type_idx" ON public."Transaction" USING btree (date, type);


--
-- Name: Transaction_date_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_date_type_status_idx" ON public."Transaction" USING btree (date, type, status);


--
-- Name: Transaction_isActive_isDeleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_isActive_isDeleted_idx" ON public."Transaction" USING btree ("isActive", "isDeleted");


--
-- Name: Transaction_transactionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_transactionId_idx" ON public."Transaction" USING btree ("transactionId");


--
-- Name: Transaction_transactionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Transaction_transactionId_key" ON public."Transaction" USING btree ("transactionId");


--
-- Name: Transaction_type_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transaction_type_status_idx" ON public."Transaction" USING btree (type, status);


--
-- Name: account_categories_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_categories_createdAt_idx" ON public.account_categories USING btree ("createdAt");


--
-- Name: account_categories_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_categories_parentId_idx" ON public.account_categories USING btree ("parentId");


--
-- Name: account_categories_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_categories_type_idx ON public.account_categories USING btree (type);


--
-- Name: account_entries_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_entries_branchId_idx" ON public.account_entries USING btree ("branchId");


--
-- Name: account_entries_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_entries_categoryId_idx" ON public.account_entries USING btree ("categoryId");


--
-- Name: account_entries_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_entries_createdAt_idx" ON public.account_entries USING btree ("createdAt");


--
-- Name: account_entries_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_entries_createdBy_idx" ON public.account_entries USING btree ("createdBy");


--
-- Name: account_entries_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_entries_date_idx ON public.account_entries USING btree (date);


--
-- Name: account_entries_entryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_entries_entryId_idx" ON public.account_entries USING btree ("entryId");


--
-- Name: account_entries_entryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "account_entries_entryId_key" ON public.account_entries USING btree ("entryId");


--
-- Name: account_entries_partyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "account_entries_partyId_idx" ON public.account_entries USING btree ("partyId");


--
-- Name: account_entries_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX account_entries_type_idx ON public.account_entries USING btree (type);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_createdAt_idx" ON public.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_createdBy_idx" ON public.audit_logs USING btree ("createdBy");


--
-- Name: audit_logs_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "audit_logs_entityId_idx" ON public.audit_logs USING btree ("entityId");


--
-- Name: audit_logs_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity);


--
-- Name: balance_sheets_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "balance_sheets_branchId_idx" ON public.balance_sheets USING btree ("branchId");


--
-- Name: balance_sheets_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "balance_sheets_createdAt_idx" ON public.balance_sheets USING btree ("createdAt");


--
-- Name: balance_sheets_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX balance_sheets_date_idx ON public.balance_sheets USING btree (date);


--
-- Name: branches_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX branches_code_idx ON public.branches USING btree (code);


--
-- Name: branches_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX branches_code_key ON public.branches USING btree (code);


--
-- Name: branches_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "branches_createdAt_idx" ON public.branches USING btree ("createdAt");


--
-- Name: cities_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cities_branchId_idx" ON public.cities USING btree ("branchId");


--
-- Name: cities_code_branchid_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cities_code_branchid_key ON public.cities USING btree (code, "branchId");


--
-- Name: cities_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_code_idx ON public.cities USING btree (code);


--
-- Name: cities_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cities_code_key ON public.cities USING btree (code);


--
-- Name: cities_isActive_isDeleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "cities_isActive_isDeleted_idx" ON public.cities USING btree ("isActive", "isDeleted");


--
-- Name: cities_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_name_idx ON public.cities USING btree (name);


--
-- Name: client_ledgers_balanceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "client_ledgers_balanceType_idx" ON public.client_ledgers USING btree ("balanceType");


--
-- Name: client_ledgers_clientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "client_ledgers_clientId_idx" ON public.client_ledgers USING btree ("clientId");


--
-- Name: client_ledgers_clientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "client_ledgers_clientId_key" ON public.client_ledgers USING btree ("clientId");


--
-- Name: client_ledgers_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "client_ledgers_createdAt_idx" ON public.client_ledgers USING btree ("createdAt");


--
-- Name: client_ledgers_financialYear_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "client_ledgers_financialYear_idx" ON public.client_ledgers USING btree ("financialYear");


--
-- Name: commission_rates_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "commission_rates_createdAt_idx" ON public.commission_rates USING btree ("createdAt");


--
-- Name: commission_rates_fromCityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "commission_rates_fromCityId_idx" ON public.commission_rates USING btree ("fromCityId");


--
-- Name: commission_rates_rateType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "commission_rates_rateType_idx" ON public.commission_rates USING btree ("rateType");


--
-- Name: commission_rates_toCityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "commission_rates_toCityId_idx" ON public.commission_rates USING btree ("toCityId");


--
-- Name: ledger_entries_accountEntryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ledger_entries_accountEntryId_idx" ON public.ledger_entries USING btree ("accountEntryId");


--
-- Name: ledger_entries_accountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ledger_entries_accountId_idx" ON public.ledger_entries USING btree ("accountId");


--
-- Name: ledger_entries_accountType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ledger_entries_accountType_idx" ON public.ledger_entries USING btree ("accountType");


--
-- Name: ledger_entries_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ledger_entries_branchId_idx" ON public.ledger_entries USING btree ("branchId");


--
-- Name: ledger_entries_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ledger_entries_createdAt_idx" ON public.ledger_entries USING btree ("createdAt");


--
-- Name: ledger_entries_createdBy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ledger_entries_createdBy_idx" ON public.ledger_entries USING btree ("createdBy");


--
-- Name: ledger_entries_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ledger_entries_date_idx ON public.ledger_entries USING btree (date);


--
-- Name: ledger_entries_transactionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ledger_entries_transactionId_idx" ON public.ledger_entries USING btree ("transactionId");


--
-- Name: parties_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "parties_branchId_idx" ON public.parties USING btree ("branchId");


--
-- Name: parties_city_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parties_city_idx ON public.parties USING btree (city);


--
-- Name: parties_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "parties_createdAt_idx" ON public.parties USING btree ("createdAt");


--
-- Name: parties_isActive_isDeleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "parties_isActive_isDeleted_idx" ON public.parties USING btree ("isActive", "isDeleted");


--
-- Name: parties_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX parties_name_idx ON public.parties USING btree (name);


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: user_sessions_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_sessions_createdAt_idx" ON public.user_sessions USING btree ("createdAt");


--
-- Name: user_sessions_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_sessions_expiresAt_idx" ON public.user_sessions USING btree ("expiresAt");


--
-- Name: user_sessions_refreshToken_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_sessions_refreshToken_idx" ON public.user_sessions USING btree ("refreshToken");


--
-- Name: user_sessions_refreshToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_sessions_refreshToken_key" ON public.user_sessions USING btree ("refreshToken");


--
-- Name: user_sessions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_sessions_userId_idx" ON public.user_sessions USING btree ("userId");


--
-- Name: users_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_branchId_idx" ON public.users USING btree ("branchId");


--
-- Name: users_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_createdAt_idx" ON public.users USING btree ("createdAt");


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "users_roleId_idx" ON public.users USING btree ("roleId");


--
-- Name: users_username_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_username_idx ON public.users USING btree (username);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: account_categories account_categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_categories
    ADD CONSTRAINT "account_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.account_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: account_entries account_entries_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_entries
    ADD CONSTRAINT "account_entries_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.account_categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: account_entries account_entries_partyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_entries
    ADD CONSTRAINT "account_entries_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES public.parties(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "audit_logs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: balance_sheets balance_sheets_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balance_sheets
    ADD CONSTRAINT "balance_sheets_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cities cities_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT "cities_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: client_ledgers client_ledgers_clientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_ledgers
    ADD CONSTRAINT "client_ledgers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.parties(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ledger_entries ledger_entries_accountEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT "ledger_entries_accountEntryId_fkey" FOREIGN KEY ("accountEntryId") REFERENCES public.account_entries(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ledger_entries ledger_entries_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT "ledger_entries_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ledger_entries ledger_entries_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT "ledger_entries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: parties parties_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parties
    ADD CONSTRAINT "parties_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: user_sessions user_sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public.branches(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict f3QcHthW2J3CK2D7cu3Jk1cQtzFhRdFPWT15iOrgD75zFxv7WxsVbR9vkS0fbgA

