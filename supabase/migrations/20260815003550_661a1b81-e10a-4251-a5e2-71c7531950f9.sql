
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, documento)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome',''), NEW.email,
          NEW.raw_user_meta_data->>'telefone', NEW.raw_user_meta_data->>'documento')
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'gestor@cufa.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'gestor') ON CONFLICT DO NOTHING;
  ELSIF NEW.raw_user_meta_data->>'role' IN ('responsavel','professor','aluno') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
