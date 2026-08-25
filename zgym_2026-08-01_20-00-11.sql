--
-- PostgreSQL database dump
--

\restrict mKL5lCdgPnyg5GvoxiznintSmqdm2lk5LNA7hRqzMDBElT7IxN3NShjneg614OH

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg13+1)
-- Dumped by pg_dump version 18.4 (Debian 18.4-1.pgdg12+1)

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

ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Setting" DROP CONSTRAINT IF EXISTS "Setting_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Schedule" DROP CONSTRAINT IF EXISTS "Schedule_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Schedule" DROP CONSTRAINT IF EXISTS "Schedule_instructorId_fkey";
ALTER TABLE IF EXISTS ONLY public."Schedule" DROP CONSTRAINT IF EXISTS "Schedule_classId_fkey";
ALTER TABLE IF EXISTS ONLY public."PtSession" DROP CONSTRAINT IF EXISTS "PtSession_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."PtSession" DROP CONSTRAINT IF EXISTS "PtSession_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."PtSession" DROP CONSTRAINT IF EXISTS "PtSession_instructorId_fkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_ptSessionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_membershipId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."Membership" DROP CONSTRAINT IF EXISTS "Membership_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Membership" DROP CONSTRAINT IF EXISTS "Membership_planId_fkey";
ALTER TABLE IF EXISTS ONLY public."Membership" DROP CONSTRAINT IF EXISTS "Membership_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."MembershipPlan" DROP CONSTRAINT IF EXISTS "MembershipPlan_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Member" DROP CONSTRAINT IF EXISTS "Member_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Instructor" DROP CONSTRAINT IF EXISTS "Instructor_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."GymClass" DROP CONSTRAINT IF EXISTS "GymClass_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."GymClass" DROP CONSTRAINT IF EXISTS "GymClass_instructorId_fkey";
ALTER TABLE IF EXISTS ONLY public."Booking" DROP CONSTRAINT IF EXISTS "Booking_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Booking" DROP CONSTRAINT IF EXISTS "Booking_memberId_fkey";
ALTER TABLE IF EXISTS ONLY public."Booking" DROP CONSTRAINT IF EXISTS "Booking_classId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_memberId_fkey";
DROP INDEX IF EXISTS public."User_tenantId_faceId_key";
DROP INDEX IF EXISTS public."User_tenantId_email_key";
DROP INDEX IF EXISTS public."Tenant_slug_key";
DROP INDEX IF EXISTS public."Setting_tenantId_key_key";
DROP INDEX IF EXISTS public."Member_tenantId_memberNumber_key";
DROP INDEX IF EXISTS public."Member_tenantId_email_key";
DROP INDEX IF EXISTS public."Instructor_tenantId_email_key";
DROP INDEX IF EXISTS public."Booking_tenantId_memberId_classId_date_key";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Tenant" DROP CONSTRAINT IF EXISTS "Tenant_pkey";
ALTER TABLE IF EXISTS ONLY public."Setting" DROP CONSTRAINT IF EXISTS "Setting_pkey";
ALTER TABLE IF EXISTS ONLY public."Schedule" DROP CONSTRAINT IF EXISTS "Schedule_pkey";
ALTER TABLE IF EXISTS ONLY public."PtSession" DROP CONSTRAINT IF EXISTS "PtSession_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."Payment" DROP CONSTRAINT IF EXISTS "Payment_pkey";
ALTER TABLE IF EXISTS ONLY public."Membership" DROP CONSTRAINT IF EXISTS "Membership_pkey";
ALTER TABLE IF EXISTS ONLY public."MembershipPlan" DROP CONSTRAINT IF EXISTS "MembershipPlan_pkey";
ALTER TABLE IF EXISTS ONLY public."Member" DROP CONSTRAINT IF EXISTS "Member_pkey";
ALTER TABLE IF EXISTS ONLY public."Instructor" DROP CONSTRAINT IF EXISTS "Instructor_pkey";
ALTER TABLE IF EXISTS ONLY public."GymClass" DROP CONSTRAINT IF EXISTS "GymClass_pkey";
ALTER TABLE IF EXISTS ONLY public."Booking" DROP CONSTRAINT IF EXISTS "Booking_pkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_pkey";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."Tenant";
DROP TABLE IF EXISTS public."Setting";
DROP TABLE IF EXISTS public."Schedule";
DROP TABLE IF EXISTS public."PtSession";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."Payment";
DROP TABLE IF EXISTS public."MembershipPlan";
DROP TABLE IF EXISTS public."Membership";
DROP TABLE IF EXISTS public."Member";
DROP TABLE IF EXISTS public."Instructor";
DROP TABLE IF EXISTS public."GymClass";
DROP TABLE IF EXISTS public."Booking";
DROP TABLE IF EXISTS public."Attendance";
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "checkIn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "checkOut" timestamp(3) without time zone,
    method text DEFAULT 'manual'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Booking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "classId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'booked'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GymClass; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GymClass" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "instructorId" text,
    capacity integer DEFAULT 20 NOT NULL,
    duration integer NOT NULL,
    color text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Instructor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Instructor" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    specialty text,
    bio text,
    photo text,
    "isActive" boolean DEFAULT true NOT NULL,
    "hourlyRate" numeric(10,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Member" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberNumber" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    gender text,
    "dateOfBirth" timestamp(3) without time zone,
    "joinDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiryDate" timestamp(3) without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    photo text,
    "emergencyContact" text,
    "emergencyPhone" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Membership; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Membership" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "planId" text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "autoRenew" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MembershipPlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MembershipPlan" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    duration integer NOT NULL,
    price numeric(12,2) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "membershipId" text,
    "ptSessionId" text,
    type text NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    method text DEFAULT 'cash'::text NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    "paidAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PtSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PtSession" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "instructorId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    "sessionType" text DEFAULT 'regular'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Schedule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Schedule" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "classId" text NOT NULL,
    "instructorId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "isRecurring" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "group" text DEFAULT 'general'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    logo text,
    plan text DEFAULT 'free'::text NOT NULL,
    "planExpires" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "maxMembers" integer DEFAULT 50 NOT NULL,
    "maxInstructors" integer DEFAULT 3 NOT NULL,
    "maxClasses" integer DEFAULT 5 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isDemo" boolean DEFAULT false NOT NULL,
    "demoExpiresAt" timestamp(3) without time zone
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'staff'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "faceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "emailVerified" timestamp(3) without time zone
);


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Attendance" (id, "tenantId", "memberId", "checkIn", "checkOut", method, "createdAt") FROM stdin;
cms9ly9ud01dfme8tvd7c4105	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	2026-07-26 08:00:00	2026-07-26 09:30:00	manual	2026-08-01 00:03:02.102
cms9ly9um01dhme8ttiu4ybii	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	2026-07-26 10:00:00	2026-07-26 11:30:00	manual	2026-08-01 00:03:02.11
cms9ly9uq01djme8tbw1pctqp	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	2026-07-26 12:00:00	2026-07-26 13:30:00	manual	2026-08-01 00:03:02.115
cms9ly9ux01dlme8tt09xo8st	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bwme8tysq6f881	2026-07-26 14:00:00	2026-07-26 15:30:00	manual	2026-08-01 00:03:02.121
cms9ly9v401dnme8tdc9wexy5	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bxme8tvxzfd2b3	2026-07-26 16:00:00	2026-07-26 17:30:00	manual	2026-08-01 00:03:02.129
cms9ly9vf01dpme8twzbj42mo	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sm01brme8tcjumjyz2	2026-07-27 08:00:00	2026-07-27 09:30:00	manual	2026-08-01 00:03:02.139
cms9ly9vm01drme8to3efn01s	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	2026-07-27 10:00:00	2026-07-27 11:30:00	manual	2026-08-01 00:03:02.147
cms9ly9vu01dtme8ta03r41wa	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	2026-07-27 12:00:00	2026-07-27 13:30:00	manual	2026-08-01 00:03:02.155
cms9ly9w401dvme8tw37x1wac	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	2026-07-27 14:00:00	2026-07-27 15:30:00	manual	2026-08-01 00:03:02.165
cms9ly9w901dxme8tl93ipsby	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	2026-07-27 16:00:00	2026-07-27 17:30:00	manual	2026-08-01 00:03:02.17
cms9ly9wf01dzme8t0305n6s5	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	2026-07-28 08:00:00	2026-07-28 09:30:00	manual	2026-08-01 00:03:02.175
cms9ly9wk01e1me8tlangdssb	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bwme8tysq6f881	2026-07-28 10:00:00	2026-07-28 11:30:00	manual	2026-08-01 00:03:02.18
cms9ly9wq01e3me8t3z1iwbe7	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bxme8tvxzfd2b3	2026-07-28 12:00:00	2026-07-28 13:30:00	manual	2026-08-01 00:03:02.186
cms9ly9wx01e5me8t0rgdrypt	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sm01brme8tcjumjyz2	2026-07-28 14:00:00	2026-07-28 15:30:00	manual	2026-08-01 00:03:02.193
cms9ly9x201e7me8tjspuiftl	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	2026-07-28 16:00:00	2026-07-28 17:30:00	manual	2026-08-01 00:03:02.198
cms9ly9x801e9me8t8ky2puaz	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	2026-07-29 08:00:00	2026-07-29 09:30:00	manual	2026-08-01 00:03:02.204
cms9ly9xd01ebme8txsw8vir8	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	2026-07-29 10:00:00	2026-07-29 11:30:00	manual	2026-08-01 00:03:02.209
cms9ly9xj01edme8tqdao3d5o	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	2026-07-29 12:00:00	2026-07-29 13:30:00	manual	2026-08-01 00:03:02.215
cms9ly9xt01efme8t701svjfk	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	2026-07-29 14:00:00	2026-07-29 15:30:00	manual	2026-08-01 00:03:02.225
cms9ly9y001ehme8tihcqhh4g	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bwme8tysq6f881	2026-07-29 16:00:00	2026-07-29 17:30:00	manual	2026-08-01 00:03:02.233
cms9ly9y601ejme8tmivayozq	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bxme8tvxzfd2b3	2026-07-30 08:00:00	2026-07-30 09:30:00	manual	2026-08-01 00:03:02.238
cms9ly9yc01elme8t2i7qi24a	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sm01brme8tcjumjyz2	2026-07-30 10:00:00	2026-07-30 11:30:00	manual	2026-08-01 00:03:02.244
cms9ly9yj01enme8t9wsnj7d8	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	2026-07-30 12:00:00	2026-07-30 13:30:00	manual	2026-08-01 00:03:02.251
cms9ly9yp01epme8t2d9c8b5c	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	2026-07-30 14:00:00	2026-07-30 15:30:00	manual	2026-08-01 00:03:02.257
cms9ly9yy01erme8tho7u2uwk	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	2026-07-30 16:00:00	2026-07-30 17:30:00	manual	2026-08-01 00:03:02.266
cms9ly9z301etme8tsx94e6c2	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	2026-07-31 08:00:00	2026-07-31 09:30:00	manual	2026-08-01 00:03:02.271
cms9ly9z801evme8tf1uls1g2	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	2026-07-31 10:00:00	2026-07-31 11:30:00	manual	2026-08-01 00:03:02.277
cms9ly9zd01exme8ty9b1kof9	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bwme8tysq6f881	2026-07-31 12:00:00	2026-07-31 13:30:00	manual	2026-08-01 00:03:02.281
cms9ly9zh01ezme8tv9t0wiad	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bxme8tvxzfd2b3	2026-07-31 14:00:00	2026-07-31 15:30:00	manual	2026-08-01 00:03:02.286
cms9ly9zo01f1me8txai9qnbk	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sm01brme8tcjumjyz2	2026-07-31 16:00:00	2026-07-31 17:30:00	manual	2026-08-01 00:03:02.292
cms9ly9zt01f3me8tjgxw14lq	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	2026-08-01 08:00:00	2026-08-01 09:30:00	manual	2026-08-01 00:03:02.297
cms9ly9zy01f5me8thbpjs4dc	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	2026-08-01 10:00:00	2026-08-01 11:30:00	manual	2026-08-01 00:03:02.303
cms9lya0301f7me8t5u0oatg6	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	2026-08-01 12:00:00	2026-08-01 13:30:00	manual	2026-08-01 00:03:02.307
cms9lya0701f9me8t2ve4ufui	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	2026-08-01 14:00:00	2026-08-01 15:30:00	manual	2026-08-01 00:03:02.311
cms9lya0d01fbme8t2ra02x97	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	2026-08-01 16:00:00	2026-08-01 17:30:00	manual	2026-08-01 00:03:02.317
\.


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Booking" (id, "tenantId", "memberId", "classId", date, status, "createdAt", "updatedAt") FROM stdin;
cms9ly9u301d2me8t6mufilmf	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	cms9ly9tg01cfme8ta0zb9ala	2026-07-28 00:03:02.09	attended	2026-08-01 00:03:02.092	2026-08-01 00:03:02.092
cms9ly9u401d6me8t22bflz28	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	cms9ly9th01clme8tjt2qiefx	2026-07-31 00:03:02.09	attended	2026-08-01 00:03:02.092	2026-08-01 00:03:02.092
cms9ly9u401dbme8tp64x8mp4	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	cms9ly9tg01chme8t5cbc2ncd	2026-07-27 00:03:02.09	attended	2026-08-01 00:03:02.093	2026-08-01 00:03:02.093
cms9ly9u301czme8tz87eoqtw	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	cms9ly9tg01cfme8ta0zb9ala	2026-07-26 00:03:02.09	attended	2026-08-01 00:03:02.091	2026-08-01 00:03:02.091
cms9ly9u401d3me8t6cjw7nuf	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	cms9ly9th01cjme8tce969jk7	2026-07-29 00:03:02.09	attended	2026-08-01 00:03:02.092	2026-08-01 00:03:02.092
cms9ly9u401d9me8tb24y2k4n	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bwme8tysq6f881	cms9ly9tg01cfme8ta0zb9ala	2026-08-01 00:03:02.09	booked	2026-08-01 00:03:02.092	2026-08-01 00:03:02.092
cms9ly9u401d7me8tevcf7xvm	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	cms9ly9th01cjme8tce969jk7	2026-08-01 00:03:02.09	booked	2026-08-01 00:03:02.092	2026-08-01 00:03:02.092
cms9ly9u501ddme8t8n3gbndr	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	cms9ly9tg01chme8t5cbc2ncd	2026-07-30 00:03:02.09	attended	2026-08-01 00:03:02.094	2026-08-01 00:03:02.094
\.


--
-- Data for Name: GymClass; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GymClass" (id, "tenantId", name, description, "instructorId", capacity, duration, color, "isActive", "createdAt", "updatedAt") FROM stdin;
cms9ly9tg01chme8t5cbc2ncd	cmr01m6ek0000uqkl1o6xt4tm	HIIT Blast	High-intensity interval training	cms9ly9r601b9me8tv0gvqrlr	20	45	#F44336	t	2026-08-01 00:03:02.069	2026-08-01 00:03:02.069
cms9ly9tg01cfme8ta0zb9ala	cmr01m6ek0000uqkl1o6xt4tm	Yoga Flow	Relaxing yoga for all levels	cms9ly9r601b7me8tz5wc5mvu	20	60	#4CAF50	t	2026-08-01 00:03:02.069	2026-08-01 00:03:02.069
cms9ly9th01clme8tjt2qiefx	cmr01m6ek0000uqkl1o6xt4tm	Strength Training	Functional strength exercises	cms9ly9r601b9me8tv0gvqrlr	20	60	#FF9800	t	2026-08-01 00:03:02.07	2026-08-01 00:03:02.07
cms9ly9th01cjme8tce969jk7	cmr01m6ek0000uqkl1o6xt4tm	Spin Class	Indoor cycling workout	cms9ly9r601b9me8tv0gvqrlr	20	50	#2196F3	t	2026-08-01 00:03:02.069	2026-08-01 00:03:02.069
\.


--
-- Data for Name: Instructor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Instructor" (id, "tenantId", name, email, phone, specialty, bio, photo, "isActive", "hourlyRate", "createdAt", "updatedAt") FROM stdin;
cms9ly9r601b9me8tv0gvqrlr	cmr01m6ek0000uqkl1o6xt4tm	Hendra Setiawan	hendra@demo.com	\N	HIIT, Strength	\N	\N	t	175000.00	2026-08-01 00:03:01.986	2026-08-01 00:03:01.986
cms9ly9r601b7me8tz5wc5mvu	cmr01m6ek0000uqkl1o6xt4tm	Fitri Handayani	fitri@demo.com	\N	Yoga, Pilates	\N	\N	t	150000.00	2026-08-01 00:03:01.986	2026-08-01 00:03:01.986
\.


--
-- Data for Name: Member; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Member" (id, "tenantId", "memberNumber", name, email, phone, address, gender, "dateOfBirth", "joinDate", "expiryDate", status, photo, "emergencyContact", "emergencyPhone", notes, "createdAt", "updatedAt") FROM stdin;
cms9ly9rk01bcme8tcayw312x	cmr01m6ek0000uqkl1o6xt4tm	GYM-00001	Andi Wijaya	andi.wijaya@demo.com	081234567890	\N	\N	\N	2026-07-22 00:03:01.998	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02	2026-08-01 00:03:02
cms9ly9rk01bdme8tjb8whkzq	cmr01m6ek0000uqkl1o6xt4tm	GYM-00002	Siti Nurhaliza	siti.demo@demo.com	082345678901	\N	\N	\N	2026-07-17 00:03:01.998	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02	2026-08-01 00:03:02
cms9ly9si01bjme8tuh6tlzhy	cmr01m6ek0000uqkl1o6xt4tm	GYM-00003	Budi Santoso	budi.demo@demo.com	083456789012	\N	\N	\N	2026-07-12 00:03:01.998	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02	2026-08-01 00:03:02
cms9ly9sk01bpme8t7n70pgn5	cmr01m6ek0000uqkl1o6xt4tm	GYM-00004	Lisa Mona	lisa.demo@demo.com	084567890123	\N	\N	\N	2026-07-07 00:03:01.998	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02	2026-08-01 00:03:02
cms9ly9sm01brme8tcjumjyz2	cmr01m6ek0000uqkl1o6xt4tm	GYM-00008	Desi Ramadhani	desi.demo@demo.com	088901234567	\N	\N	\N	2026-06-17 00:03:01.999	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02	2026-08-01 00:03:02
cms9ly9sn01bwme8tysq6f881	cmr01m6ek0000uqkl1o6xt4tm	GYM-00006	Nina Kusuma	nina.demo@demo.com	086789012345	\N	\N	\N	2026-06-27 00:03:01.999	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02.001	2026-08-01 00:03:02.001
cms9ly9sn01bume8txdrvfp55	cmr01m6ek0000uqkl1o6xt4tm	GYM-00005	Ahmad Ridho	ahmad.demo@demo.com	085678901234	\N	\N	\N	2026-07-02 00:03:01.999	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02	2026-08-01 00:03:02
cms9ly9sn01bxme8tvxzfd2b3	cmr01m6ek0000uqkl1o6xt4tm	GYM-00007	Reza Pratama	reza.demo@demo.com	087890123456	\N	\N	\N	2026-06-22 00:03:01.999	\N	active	\N	\N	\N	\N	2026-08-01 00:03:02	2026-08-01 00:03:02
\.


--
-- Data for Name: Membership; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Membership" (id, "tenantId", "memberId", "planId", "startDate", "endDate", status, "autoRenew", "createdAt", "updatedAt") FROM stdin;
cms9ly9s001bfme8tj4yvalos	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	cms9ly9qw01b5me8tvlrcck5i	2026-07-22 00:03:02.009	2027-07-22 00:03:02.009	active	f	2026-08-01 00:03:02.017	2026-08-01 00:03:02.017
cms9ly9s101bhme8t0e3wy6rm	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	cms9ly9q701b3me8til9mxy4x	2026-07-22 00:03:02.016	2026-08-21 00:03:02.016	active	f	2026-08-01 00:03:02.017	2026-08-01 00:03:02.017
cms9ly9st01c1me8tszp4qfsu	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	cms9ly9qw01b5me8tvlrcck5i	2026-07-22 00:03:02.045	2027-07-22 00:03:02.045	active	f	2026-08-01 00:03:02.046	2026-08-01 00:03:02.046
cms9ly9st01bzme8tfl8iar5b	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	cms9ly9q701b3me8til9mxy4x	2026-07-22 00:03:02.044	2026-08-21 00:03:02.044	active	f	2026-08-01 00:03:02.045	2026-08-01 00:03:02.045
cms9ly9su01c3me8t7r3k0yc3	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bwme8tysq6f881	cms9ly9q701b3me8til9mxy4x	2026-07-22 00:03:02.046	2026-08-21 00:03:02.046	active	f	2026-08-01 00:03:02.047	2026-08-01 00:03:02.047
cms9ly9sw01c5me8tcjek03y7	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	cms9ly9q701b3me8til9mxy4x	2026-07-22 00:03:02.047	2026-08-21 00:03:02.047	active	f	2026-08-01 00:03:02.048	2026-08-01 00:03:02.048
\.


--
-- Data for Name: MembershipPlan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MembershipPlan" (id, "tenantId", name, description, duration, price, "isActive", "createdAt", "updatedAt") FROM stdin;
cms9ly9q701b3me8til9mxy4x	cmr01m6ek0000uqkl1o6xt4tm	Basic Monthly	\N	30	199000.00	t	2026-08-01 00:03:01.952	2026-08-01 00:03:01.952
cms9ly9qw01b5me8tvlrcck5i	cmr01m6ek0000uqkl1o6xt4tm	Premium Yearly	\N	365	1999000.00	t	2026-08-01 00:03:01.952	2026-08-01 00:03:01.952
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payment" (id, "tenantId", "memberId", "membershipId", "ptSessionId", type, description, amount, method, status, "paidAt", notes, "createdAt") FROM stdin;
cms9ly9si01blme8t4a5de8nd	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bcme8tcayw312x	cms9ly9s001bfme8tj4yvalos	\N	membership	Pembayaran Premium Yearly — Andi Wijaya	1999000.00	transfer	paid	2026-07-22 00:03:02.033	\N	2026-08-01 00:03:02.035
cms9ly9t001c7me8tf735wyb8	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9si01bjme8tuh6tlzhy	cms9ly9st01bzme8tfl8iar5b	\N	membership	Pembayaran Basic Monthly — Budi Santoso	199000.00	transfer	paid	2026-07-22 00:03:02.051	\N	2026-08-01 00:03:02.052
cms9ly9t201cbme8tvjm7clm3	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bwme8tysq6f881	cms9ly9su01c3me8t7r3k0yc3	\N	membership	Pembayaran Basic Monthly — Nina Kusuma	199000.00	cash	paid	2026-07-22 00:03:02.054	\N	2026-08-01 00:03:02.055
cms9ly9sj01bnme8tngjmgfgu	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9rk01bdme8tjb8whkzq	cms9ly9s101bhme8t0e3wy6rm	\N	membership	Pembayaran Basic Monthly — Siti Nurhaliza	199000.00	cash	paid	2026-07-22 00:03:02.034	\N	2026-08-01 00:03:02.035
cms9ly9t101c9me8thztgbra8	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sk01bpme8t7n70pgn5	cms9ly9st01c1me8tszp4qfsu	\N	membership	Pembayaran Premium Yearly — Lisa Mona	1999000.00	cash	paid	2026-07-22 00:03:02.052	\N	2026-08-01 00:03:02.053
cms9ly9t401cdme8tcuifdi6y	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9sn01bume8txdrvfp55	cms9ly9sw01c5me8tcjek03y7	\N	membership	Pembayaran Basic Monthly — Ahmad Ridho	199000.00	transfer	paid	2026-07-22 00:03:02.055	\N	2026-08-01 00:03:02.056
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, "tenantId", name, description, category, price, stock, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PtSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PtSession" (id, "tenantId", "memberId", "instructorId", date, "startTime", "endTime", status, notes, "sessionType", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Schedule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Schedule" (id, "tenantId", "classId", "instructorId", "dayOfWeek", "startTime", "endTime", "isRecurring", "createdAt") FROM stdin;
cms9ly9tq01crme8t3f32g6v0	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9tg01cfme8ta0zb9ala	cms9ly9r601b7me8tz5wc5mvu	1	08:00	09:00	t	2026-08-01 00:03:02.079
cms9ly9tq01cqme8t8ogfidiu	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9tg01cfme8ta0zb9ala	cms9ly9r601b7me8tz5wc5mvu	4	08:00	09:00	t	2026-08-01 00:03:02.079
cms9ly9tr01cxme8t2bloixgw	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9th01clme8tjt2qiefx	cms9ly9r601b9me8tv0gvqrlr	6	09:00	10:00	t	2026-08-01 00:03:02.079
cms9ly9tr01cwme8tvehkqn49	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9tg01chme8t5cbc2ncd	cms9ly9r601b9me8tv0gvqrlr	5	06:00	06:45	t	2026-08-01 00:03:02.079
cms9ly9tr01ctme8tn5d4p8yl	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9th01cjme8tce969jk7	cms9ly9r601b9me8tv0gvqrlr	3	17:00	17:50	t	2026-08-01 00:03:02.079
cms9ly9tq01cpme8tkg16pomn	cmr01m6ek0000uqkl1o6xt4tm	cms9ly9tg01chme8t5cbc2ncd	cms9ly9r601b9me8tv0gvqrlr	2	06:00	06:45	t	2026-08-01 00:03:02.079
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Setting" (id, "tenantId", key, value, "group", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tenant" (id, name, slug, email, phone, address, logo, plan, "planExpires", "isActive", "maxMembers", "maxInstructors", "maxClasses", "createdAt", "updatedAt", "isDemo", "demoExpiresAt") FROM stdin;
cmqti6alc00014yr7te1jharq	ZGym System	system	admin@zgym.id	\N	\N	\N	enterprise	\N	t	99999	999	999	2026-06-25 12:53:16.704	2026-06-25 12:53:16.704	f	\N
cmr01m6ek0000uqkl1o6xt4tm	Demo	demo	admin+demo@zgym.zomet.my.id	\N	\N	\N	free	\N	t	50	3	5	2026-06-30 02:44:07.532	2026-07-15 00:30:03.516	t	2026-07-15 02:30:03.515
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, "tenantId", name, email, password, role, "isActive", "faceId", "createdAt", "updatedAt", "emailVerified") FROM stdin;
cmr0b9dql0001mtczz9ds2uub	cmqti6alc00014yr7te1jharq	Andi	sentarummedia@gmail.com	$2b$10$9a9EE9v7NqnG8iI.ygFRHeGutDOGGspEWVvwdgr/7zLzRNiAf1v2a	superadmin	t	\N	2026-06-30 07:14:06.669	2026-06-30 07:14:06.669	\N
cmr01m6i90002uqklnj4hn7ta	cmr01m6ek0000uqkl1o6xt4tm	Demo	demo@zomet.my.id	$2b$10$UrpPKdjYibs25yKoauf9Xef7m69cExBbz8EbEeH0vcqUmRa4Bqtg6	ADMIN	t	\N	2026-06-30 02:44:07.665	2026-06-30 03:02:44.457	2026-07-11 14:09:33.958
\.


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: GymClass GymClass_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GymClass"
    ADD CONSTRAINT "GymClass_pkey" PRIMARY KEY (id);


--
-- Name: Instructor Instructor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Instructor"
    ADD CONSTRAINT "Instructor_pkey" PRIMARY KEY (id);


--
-- Name: Member Member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY (id);


--
-- Name: MembershipPlan MembershipPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY (id);


--
-- Name: Membership Membership_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: PtSession PtSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PtSession"
    ADD CONSTRAINT "PtSession_pkey" PRIMARY KEY (id);


--
-- Name: Schedule Schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Booking_tenantId_memberId_classId_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Booking_tenantId_memberId_classId_date_key" ON public."Booking" USING btree ("tenantId", "memberId", "classId", date);


--
-- Name: Instructor_tenantId_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Instructor_tenantId_email_key" ON public."Instructor" USING btree ("tenantId", email);


--
-- Name: Member_tenantId_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Member_tenantId_email_key" ON public."Member" USING btree ("tenantId", email);


--
-- Name: Member_tenantId_memberNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Member_tenantId_memberNumber_key" ON public."Member" USING btree ("tenantId", "memberNumber");


--
-- Name: Setting_tenantId_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Setting_tenantId_key_key" ON public."Setting" USING btree ("tenantId", key);


--
-- Name: Tenant_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tenant_slug_key" ON public."Tenant" USING btree (slug);


--
-- Name: User_tenantId_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_tenantId_email_key" ON public."User" USING btree ("tenantId", email);


--
-- Name: User_tenantId_faceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_tenantId_faceId_key" ON public."User" USING btree ("tenantId", "faceId");


--
-- Name: Attendance Attendance_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Booking Booking_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."GymClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Booking Booking_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Booking Booking_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GymClass GymClass_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GymClass"
    ADD CONSTRAINT "GymClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public."Instructor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GymClass GymClass_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GymClass"
    ADD CONSTRAINT "GymClass_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Instructor Instructor_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Instructor"
    ADD CONSTRAINT "Instructor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Member Member_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MembershipPlan MembershipPlan_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Membership Membership_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Membership Membership_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."MembershipPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Membership Membership_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Membership"
    ADD CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_membershipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES public."Membership"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_ptSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_ptSessionId_fkey" FOREIGN KEY ("ptSessionId") REFERENCES public."PtSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Payment Payment_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PtSession PtSession_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PtSession"
    ADD CONSTRAINT "PtSession_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public."Instructor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PtSession PtSession_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PtSession"
    ADD CONSTRAINT "PtSession_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PtSession PtSession_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PtSession"
    ADD CONSTRAINT "PtSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Schedule Schedule_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."GymClass"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Schedule Schedule_instructorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES public."Instructor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Schedule Schedule_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedule"
    ADD CONSTRAINT "Schedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Setting Setting_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict mKL5lCdgPnyg5GvoxiznintSmqdm2lk5LNA7hRqzMDBElT7IxN3NShjneg614OH

