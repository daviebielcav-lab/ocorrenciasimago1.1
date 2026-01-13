import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Building2, Shield, Save, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AvatarUpload } from "@/components/profile/AvatarUpload";

const profileSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Perfil = () => {
  const { profile, tenant, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: data.full_name })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card with Avatar */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  userName={profile?.full_name || "Usuário"}
                  onAvatarUpdated={setAvatarUrl}
                />
                <div className="text-center sm:text-left">
                  <CardTitle className="text-xl">{profile?.full_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                    <Mail className="h-4 w-4" />
                    {profile?.email}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <Badge variant={isAdmin ? "default" : "secondary"} className="gap-1">
                      <Shield className="h-3 w-3" />
                      {isAdmin ? "Administrador" : "Usuário"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Edit Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Email</FormLabel>
                    <Input value={profile?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organização
              </CardTitle>
              <CardDescription>
                Informações sobre sua organização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Nome da Organização</span>
                <span className="font-medium">{tenant?.name || "—"}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Identificador</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">{tenant?.slug || "—"}</code>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade da Conta</CardTitle>
              <CardDescription>
                Informações sobre sua atividade no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Membro desde</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">
                    {profile?.last_login_at
                      ? new Date(profile.last_login_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Último acesso</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg col-span-2 md:col-span-1">
                  <p className="text-2xl font-bold text-primary">
                    {profile?.is_active ? "Sim" : "Não"}
                  </p>
                  <p className="text-sm text-muted-foreground">Conta ativa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Perfil;