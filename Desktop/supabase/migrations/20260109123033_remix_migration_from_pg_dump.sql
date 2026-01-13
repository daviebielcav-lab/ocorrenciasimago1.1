CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: capa_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.capa_status AS ENUM (
    'pendente',
    'em_andamento',
    'concluida',
    'verificada'
);


--
-- Name: occurrence_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.occurrence_status AS ENUM (
    'registrada',
    'em_triagem',
    'em_analise',
    'acao_em_andamento',
    'concluida',
    'improcedente'
);


--
-- Name: occurrence_subtype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.occurrence_subtype AS ENUM (
    'erro_identificacao',
    'medicacao_contraste',
    'quedas_traumas',
    'qualidade_imagem_laudo',
    'radiacao_seguranca',
    'atendimento_recepcao',
    'agendamento',
    'entrega_resultados',
    'faturamento',
    'equipamentos',
    'sistemas',
    'predial',
    'extravasamento',
    'revisao_exame'
);


--
-- Name: occurrence_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.occurrence_type AS ENUM (
    'assistencial',
    'administrativa',
    'tecnica'
);


--
-- Name: outcome_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.outcome_type AS ENUM (
    'imediato_correcao',
    'orientacao',
    'treinamento',
    'alteracao_processo',
    'manutencao_corretiva',
    'notificacao_externa',
    'improcedente'
);


--
-- Name: triage_classification; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.triage_classification AS ENUM (
    'circunstancia_risco',
    'near_miss',
    'incidente_sem_dano',
    'evento_adverso',
    'evento_sentinela'
);


--
-- Name: generate_protocol_number(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_protocol_number(p_tenant_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
DECLARE
  tenant_slug TEXT;
  today_date TEXT;
  sequence_num INTEGER;
  protocol TEXT;
BEGIN
  -- Get tenant slug
  SELECT slug INTO tenant_slug FROM public.tenants WHERE id = p_tenant_id;
  
  -- Get today's date
  today_date := to_char(now(), 'YYYYMMDD');
  
  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    NULLIF(
      regexp_replace(protocolo, '.*-(\d+)$', '\1'),
      protocolo
    )::INTEGER
  ), 0) + 1
  INTO sequence_num
  FROM public.occurrences
  WHERE tenant_id = p_tenant_id
  AND protocolo LIKE UPPER(tenant_slug) || '-' || today_date || '-%';
  
  -- Generate protocol
  protocol := UPPER(tenant_slug) || '-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN protocol;
END;
$_$;


--
-- Name: generate_public_token(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_public_token() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  token text;
BEGIN
  -- Generate a 64-character random hex token
  token := encode(gen_random_bytes(32), 'hex');
  RETURN token;
END;
$$;


--
-- Name: get_user_tenant_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_tenant_id(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT tenant_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;


--
-- Name: handle_atualizado_em(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_atualizado_em() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Get or create the default tenant
  SELECT id INTO default_tenant_id FROM public.tenants WHERE slug = 'imago' LIMIT 1;
  
  -- If no tenant exists, create one
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug, is_active)
    VALUES ('Clínica Imago', 'imago', true)
    RETURNING id INTO default_tenant_id;
  END IF;
  
  -- Create profile for the new user
  INSERT INTO public.profiles (id, tenant_id, full_name, email)
  VALUES (
    NEW.id,
    default_tenant_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  -- Create admin role for the first user, otherwise user role
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (
    NEW.id,
    default_tenant_id,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles WHERE tenant_id = default_tenant_id) = 1 THEN 'admin'::app_role
      ELSE 'user'::app_role
    END
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;


--
-- Name: is_tenant_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_tenant_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  );
$$;


--
-- Name: log_audit_event(text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_audit_event(_action text, _entity_type text DEFAULT NULL::text, _entity_id uuid DEFAULT NULL::uuid, _details jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _tenant_id UUID;
  _log_id UUID;
BEGIN
  SELECT public.get_user_tenant_id(auth.uid()) INTO _tenant_id;
  
  INSERT INTO public.audit_logs (tenant_id, user_id, action, entity_type, entity_id, details)
  VALUES (_tenant_id, auth.uid(), _action, _entity_type, _entity_id, _details)
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;


--
-- Name: user_belongs_to_tenant(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_belongs_to_tenant(_user_id uuid, _tenant_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND tenant_id = _tenant_id
  );
$$;


SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: occurrence_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.occurrence_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    occurrence_id uuid NOT NULL,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    file_size integer,
    uploaded_by uuid NOT NULL,
    uploaded_em timestamp with time zone DEFAULT now() NOT NULL,
    is_image boolean DEFAULT false
);


--
-- Name: occurrence_capas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.occurrence_capas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    occurrence_id uuid NOT NULL,
    causa_raiz text NOT NULL,
    acao text NOT NULL,
    responsavel text NOT NULL,
    prazo date NOT NULL,
    evidencia_url text,
    verificacao_eficacia text,
    verificado_por uuid,
    verificado_em timestamp with time zone,
    status public.capa_status DEFAULT 'pendente'::public.capa_status NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: occurrence_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.occurrence_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    occurrence_id uuid NOT NULL,
    content text NOT NULL,
    criado_por uuid NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: occurrence_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.occurrence_status_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    occurrence_id uuid NOT NULL,
    status_de public.occurrence_status NOT NULL,
    status_para public.occurrence_status NOT NULL,
    alterado_por uuid NOT NULL,
    alterado_em timestamp with time zone DEFAULT now() NOT NULL,
    motivo text
);


--
-- Name: occurrences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.occurrences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    protocolo text NOT NULL,
    tipo public.occurrence_type NOT NULL,
    subtipo public.occurrence_subtype NOT NULL,
    paciente_nome_completo text,
    paciente_telefone text,
    paciente_id text,
    paciente_data_nascimento date,
    paciente_tipo_exame text,
    paciente_unidade_local text,
    paciente_data_hora_evento timestamp with time zone,
    descricao_detalhada text NOT NULL,
    acao_imediata text,
    impacto_percebido text,
    pessoas_envolvidas text,
    contem_dado_sensivel boolean DEFAULT false,
    status public.occurrence_status DEFAULT 'registrada'::public.occurrence_status NOT NULL,
    triagem public.triage_classification,
    triagem_por uuid,
    triagem_em timestamp with time zone,
    desfecho_tipos public.outcome_type[] DEFAULT '{}'::public.outcome_type[],
    desfecho_justificativa text,
    desfecho_principal public.outcome_type,
    desfecho_definido_por uuid,
    desfecho_definido_em timestamp with time zone,
    notificacao_orgao text,
    notificacao_data date,
    notificacao_responsavel text,
    notificacao_anexo_url text,
    criado_por uuid NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    pdf_conclusao_url text,
    pdf_gerado_em timestamp with time zone,
    dados_especificos jsonb DEFAULT '{}'::jsonb,
    registrador_setor text,
    registrador_cargo text,
    houve_dano boolean DEFAULT false,
    descricao_dano text,
    pessoas_comunicadas jsonb DEFAULT '[]'::jsonb,
    observacoes text,
    acoes_imediatas_checklist jsonb DEFAULT '[]'::jsonb,
    public_token text,
    medico_destino text,
    mensagem_admin_medico text,
    mensagem_medico text,
    encaminhada_em timestamp with time zone,
    finalizada_em timestamp with time zone
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    last_login_ip text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    avatar_url text
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#0066CC'::text,
    is_active boolean DEFAULT true,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: occurrence_attachments occurrence_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_attachments
    ADD CONSTRAINT occurrence_attachments_pkey PRIMARY KEY (id);


--
-- Name: occurrence_capas occurrence_capas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_capas
    ADD CONSTRAINT occurrence_capas_pkey PRIMARY KEY (id);


--
-- Name: occurrence_comments occurrence_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_comments
    ADD CONSTRAINT occurrence_comments_pkey PRIMARY KEY (id);


--
-- Name: occurrence_status_history occurrence_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_status_history
    ADD CONSTRAINT occurrence_status_history_pkey PRIMARY KEY (id);


--
-- Name: occurrences occurrences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_pkey PRIMARY KEY (id);


--
-- Name: occurrences occurrences_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_protocolo_key UNIQUE (protocolo);


--
-- Name: occurrences occurrences_public_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_public_token_key UNIQUE (public_token);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_tenant_id_key UNIQUE (user_id, tenant_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_occurrence_attachments_occurrence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrence_attachments_occurrence_id ON public.occurrence_attachments USING btree (occurrence_id);


--
-- Name: idx_occurrence_capas_occurrence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrence_capas_occurrence_id ON public.occurrence_capas USING btree (occurrence_id);


--
-- Name: idx_occurrence_comments_occurrence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrence_comments_occurrence_id ON public.occurrence_comments USING btree (occurrence_id);


--
-- Name: idx_occurrence_status_history_occurrence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrence_status_history_occurrence_id ON public.occurrence_status_history USING btree (occurrence_id);


--
-- Name: idx_occurrences_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_criado_em ON public.occurrences USING btree (criado_em DESC);


--
-- Name: idx_occurrences_dados_especificos; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_dados_especificos ON public.occurrences USING gin (dados_especificos);


--
-- Name: idx_occurrences_public_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_public_token ON public.occurrences USING btree (public_token) WHERE (public_token IS NOT NULL);


--
-- Name: idx_occurrences_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_status ON public.occurrences USING btree (status);


--
-- Name: idx_occurrences_subtipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_subtipo ON public.occurrences USING btree (subtipo);


--
-- Name: idx_occurrences_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_tenant_id ON public.occurrences USING btree (tenant_id);


--
-- Name: idx_occurrences_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_tipo ON public.occurrences USING btree (tipo);


--
-- Name: idx_occurrences_triagem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_occurrences_triagem ON public.occurrences USING btree (triagem);


--
-- Name: idx_profiles_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);


--
-- Name: idx_profiles_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_tenant_id ON public.profiles USING btree (tenant_id);


--
-- Name: idx_tenants_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tenants_slug ON public.tenants USING btree (slug);


--
-- Name: idx_user_roles_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_tenant_id ON public.user_roles USING btree (tenant_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: profiles set_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: tenants set_tenants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: occurrence_capas update_occurrence_capas_atualizado_em; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_occurrence_capas_atualizado_em BEFORE UPDATE ON public.occurrence_capas FOR EACH ROW EXECUTE FUNCTION public.handle_atualizado_em();


--
-- Name: occurrence_comments update_occurrence_comments_atualizado_em; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_occurrence_comments_atualizado_em BEFORE UPDATE ON public.occurrence_comments FOR EACH ROW EXECUTE FUNCTION public.handle_atualizado_em();


--
-- Name: occurrences update_occurrences_atualizado_em; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_occurrences_atualizado_em BEFORE UPDATE ON public.occurrences FOR EACH ROW EXECUTE FUNCTION public.handle_atualizado_em();


--
-- Name: audit_logs audit_logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: occurrence_attachments occurrence_attachments_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_attachments
    ADD CONSTRAINT occurrence_attachments_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(id) ON DELETE CASCADE;


--
-- Name: occurrence_attachments occurrence_attachments_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_attachments
    ADD CONSTRAINT occurrence_attachments_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);


--
-- Name: occurrence_capas occurrence_capas_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_capas
    ADD CONSTRAINT occurrence_capas_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(id) ON DELETE CASCADE;


--
-- Name: occurrence_capas occurrence_capas_verificado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_capas
    ADD CONSTRAINT occurrence_capas_verificado_por_fkey FOREIGN KEY (verificado_por) REFERENCES public.profiles(id);


--
-- Name: occurrence_comments occurrence_comments_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_comments
    ADD CONSTRAINT occurrence_comments_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.profiles(id);


--
-- Name: occurrence_comments occurrence_comments_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_comments
    ADD CONSTRAINT occurrence_comments_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(id) ON DELETE CASCADE;


--
-- Name: occurrence_status_history occurrence_status_history_alterado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_status_history
    ADD CONSTRAINT occurrence_status_history_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES public.profiles(id);


--
-- Name: occurrence_status_history occurrence_status_history_occurrence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrence_status_history
    ADD CONSTRAINT occurrence_status_history_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES public.occurrences(id) ON DELETE CASCADE;


--
-- Name: occurrences occurrences_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.profiles(id);


--
-- Name: occurrences occurrences_desfecho_definido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_desfecho_definido_por_fkey FOREIGN KEY (desfecho_definido_por) REFERENCES public.profiles(id);


--
-- Name: occurrences occurrences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: occurrences occurrences_triagem_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_triagem_por_fkey FOREIGN KEY (triagem_por) REFERENCES public.profiles(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: occurrences Admins can delete occurrences in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete occurrences in their tenant" ON public.occurrences FOR DELETE USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.is_tenant_admin(auth.uid())));


--
-- Name: profiles Admins can insert profiles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert profiles in their tenant" ON public.profiles FOR INSERT TO authenticated WITH CHECK (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.is_tenant_admin(auth.uid())));


--
-- Name: user_roles Admins can manage roles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles in their tenant" ON public.user_roles TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.is_tenant_admin(auth.uid())));


--
-- Name: profiles Admins can update profiles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update profiles in their tenant" ON public.profiles FOR UPDATE TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.is_tenant_admin(auth.uid())));


--
-- Name: tenants Admins can update their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update their own tenant" ON public.tenants FOR UPDATE TO authenticated USING (((id = public.get_user_tenant_id(auth.uid())) AND public.is_tenant_admin(auth.uid())));


--
-- Name: audit_logs Admins can view audit logs in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view audit logs in their tenant" ON public.audit_logs FOR SELECT TO authenticated USING (((tenant_id = public.get_user_tenant_id(auth.uid())) AND public.is_tenant_admin(auth.uid())));


--
-- Name: occurrences Public can update mensagem_medico by valid token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can update mensagem_medico by valid token" ON public.occurrences FOR UPDATE USING (((public_token IS NOT NULL) AND (subtipo = 'revisao_exame'::public.occurrence_subtype))) WITH CHECK (((public_token IS NOT NULL) AND (subtipo = 'revisao_exame'::public.occurrence_subtype)));


--
-- Name: occurrences Public can view occurrence by valid token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view occurrence by valid token" ON public.occurrences FOR SELECT USING (((public_token IS NOT NULL) AND (subtipo = 'revisao_exame'::public.occurrence_subtype)));


--
-- Name: audit_logs System can insert audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: occurrences Users can create occurrences in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create occurrences in their tenant" ON public.occurrences FOR INSERT WITH CHECK ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: occurrence_status_history Users can insert status history for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert status history for their tenant occurrences" ON public.occurrence_status_history FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_status_history.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: occurrence_capas Users can manage CAPAs for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage CAPAs for their tenant occurrences" ON public.occurrence_capas USING ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_capas.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: occurrence_attachments Users can manage attachments for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage attachments for their tenant occurrences" ON public.occurrence_attachments USING ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_attachments.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: occurrence_comments Users can manage comments for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage comments for their tenant occurrences" ON public.occurrence_comments USING ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_comments.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: occurrences Users can update occurrences in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update occurrences in their tenant" ON public.occurrences FOR UPDATE USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid()));


--
-- Name: occurrence_capas Users can view CAPAs for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view CAPAs for their tenant occurrences" ON public.occurrence_capas FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_capas.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: occurrence_attachments Users can view attachments for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view attachments for their tenant occurrences" ON public.occurrence_attachments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_attachments.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: occurrence_comments Users can view comments for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view comments for their tenant occurrences" ON public.occurrence_comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_comments.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: occurrences Users can view occurrences in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view occurrences in their tenant" ON public.occurrences FOR SELECT USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: profiles Users can view profiles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profiles in their tenant" ON public.profiles FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: user_roles Users can view roles in their tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view roles in their tenant" ON public.user_roles FOR SELECT TO authenticated USING ((tenant_id = public.get_user_tenant_id(auth.uid())));


--
-- Name: occurrence_status_history Users can view status history for their tenant occurrences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view status history for their tenant occurrences" ON public.occurrence_status_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.occurrences o
  WHERE ((o.id = occurrence_status_history.occurrence_id) AND (o.tenant_id = public.get_user_tenant_id(auth.uid()))))));


--
-- Name: tenants Users can view their own tenant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tenant" ON public.tenants FOR SELECT TO authenticated USING ((id = public.get_user_tenant_id(auth.uid())));


--
-- Name: password_reset_tokens Users can view their own tokens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tokens" ON public.password_reset_tokens FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: occurrence_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.occurrence_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: occurrence_capas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.occurrence_capas ENABLE ROW LEVEL SECURITY;

--
-- Name: occurrence_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.occurrence_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: occurrence_status_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.occurrence_status_history ENABLE ROW LEVEL SECURITY;

--
-- Name: occurrences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;

--
-- Name: password_reset_tokens; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;