"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  AppUser,
  UserRole,
  subscribeToClinicTeam,
  registerWithFirebase,
  updateUserRoleInFirestore,
  deleteUserFromClinic,
  isClinicAdminEmail,
} from "@/lib/auth-service";

export function TeamSection() {
  const [members, setMembers] = useState<AppUser[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<AppUser | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("funcionaria");

  // Assinatura em tempo real da equipe no Firestore
  useEffect(() => {
    const unsubscribe = subscribeToClinicTeam((teamList) => {
      setMembers(teamList);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (formPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await registerWithFirebase(
        formName.trim(),
        formEmail.trim(),
        formPassword.trim(),
        formRole
      );

      setIsSubmitting(false);

      if (res.success) {
        toast.success(`Colaboradora ${formName.trim()} cadastrada com sucesso!`, {
          description: `O acesso (${formRole === "admin" ? "Administradora" : "Atendimento"}) já está disponível no Firebase.`,
        });
        setFormName("");
        setFormEmail("");
        setFormPassword("");
        setFormRole("funcionaria");
        setIsAddModalOpen(false);
      } else {
        toast.error(res.error || "Erro ao registrar colaboradora.");
      }
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err?.message || "Erro inesperado ao registrar colaboradora.");
    }
  };

  const handleToggleRole = async (member: AppUser) => {
    if (isClinicAdminEmail(member.email)) {
      toast.info("A conta principal da clínica é permanentemente Administradora.");
      return;
    }

    const nextRole: UserRole = member.role === "admin" ? "funcionaria" : "admin";
    const ok = await updateUserRoleInFirestore(member.uid, nextRole);

    if (ok) {
      toast.success(
        `Nível de ${member.name} alterado para ${nextRole === "admin" ? "Administradora" : "Atendimento"}`
      );
    } else {
      toast.error("Não foi possível atualizar o nível no Firestore.");
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    if (isClinicAdminEmail(memberToDelete.email)) {
      toast.error("A conta principal da Dra. Sâmara não pode ser removida.");
      setMemberToDelete(null);
      return;
    }

    const ok = await deleteUserFromClinic(memberToDelete.uid);

    if (ok) {
      toast.success(`Acesso de ${memberToDelete.name} removido da clínica.`);
    } else {
      toast.error("Erro ao remover colaboradora do Firestore.");
    }

    setMemberToDelete(null);
  };

  const totalMembers = members.length;
  const adminCount = members.filter((m) => m.role === "admin").length;
  const staffCount = members.filter((m) => m.role === "funcionaria").length;

  return (
    <div
      data-dashboard-section="team"
      className="w-full min-w-0 max-w-5xl mx-auto space-y-6 pb-24 md:pb-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#767676] dark:text-[#a1a1aa] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A8B29A]" />
            <span>Segurança & Controle de Acessos (RBAC)</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-bold text-black dark:text-white">
            Equipe da Clínica & Permissões
          </h1>
          <p className="text-xs sm:text-sm text-[#6c6c6c] dark:text-[#a1a1aa]">
            Controle quem acessa o painel da clínica, com distinção segura entre
            Administradora (acesso integral) e Atendimento (operacional).
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="h-10 px-4 rounded-xl text-xs font-semibold gap-2 active:scale-95 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Colaboradora</span>
        </Button>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#767676] dark:text-[#8D9B7F] font-medium block">
                Total de Usuárias
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-black dark:text-white mt-1 block">
                {totalMembers}
              </span>
              <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">
                Contas ativas com login
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-black/5 dark:bg-white/10 text-black dark:text-white flex items-center justify-center">
              <Users className="w-5 h-5 text-[#A8B29A]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#767676] dark:text-[#8D9B7F] font-medium block">
                Administradoras
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-black dark:text-white mt-1 block">
                {adminCount}
              </span>
              <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">
                Acesso integral e relatórios
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#A8B29A]/15 text-[#A8B29A] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-[#767676] dark:text-[#8D9B7F] font-medium block">
                Equipe de Atendimento
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-black dark:text-white mt-1 block">
                {staffCount}
              </span>
              <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">
                Agendamentos, pacientes e catálogo
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-[#8D9B7F]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regras e Diferenciais de Acesso */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#A8B29A]" />
            <span>Matriz de Acessos & Privacidade Médica</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Como o sistema protege os dados clínicos e financeiros da clínica:
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-[#767676] dark:text-[#a1a1aa]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <div className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#A8B29A]" />
                <span>Nível Administradora (Dra. Sâmara)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Acesso irrestrito a Relatórios Financeiros, Faturamento, Gestão da Equipe,
                edição de tabela de procedimentos/preços e permissão para excluir prontuários.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-1">
              <div className="font-semibold text-black dark:text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8D9B7F]" />
                <span>Nível Atendimento / Recepção</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Acesso aos Agendamentos (Kanban e Retorno de 15 dias), Fichas de Pacientes,
                Anamnese e Catálogo de Procedimentos. Menu financeiro e equipe ocultos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Colaboradoras */}
      <div className="w-full bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-black/[0.06] dark:border-white/[0.06] bg-[#fafafa]/80 dark:bg-[#18181b]/80">
              <TableHead className="font-semibold text-black dark:text-white whitespace-nowrap">
                Colaboradora
              </TableHead>
              <TableHead className="font-semibold text-black dark:text-white whitespace-nowrap">
                E-mail de Acesso
              </TableHead>
              <TableHead className="font-semibold text-black dark:text-white whitespace-nowrap">
                Nível de Permissão
              </TableHead>
              <TableHead className="font-semibold text-black dark:text-white whitespace-nowrap">
                Cadastro
              </TableHead>
              <TableHead className="font-semibold text-black dark:text-white text-right whitespace-nowrap">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-xs text-[#767676] dark:text-[#a1a1aa]"
                >
                  Carregando equipe do Firebase...
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const isMainAdmin = isClinicAdminEmail(member.email);

                return (
                  <TableRow
                    key={member.uid}
                    className="hover:bg-[#fbfbfb] dark:hover:bg-[#1a1a1c] transition-colors duration-150"
                  >
                    {/* Nome & Avatar */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-black dark:bg-[#A8B29A] text-white dark:text-[#111111] font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <div className="font-semibold text-black dark:text-white text-sm">
                            {member.name}
                          </div>
                          <div className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa]">
                            {member.title || (member.role === "admin" ? "Responsável Técnica" : "Recepção / Atendimento")}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="whitespace-nowrap text-xs text-[#525252] dark:text-[#d4d4d8]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#8f8f8f]" />
                        <span>{member.email}</span>
                      </div>
                    </TableCell>

                    {/* Nível de Permissão */}
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant={member.role === "admin" ? "sage" : "secondary"}
                        className="text-[11px] font-semibold gap-1.5"
                      >
                        {member.role === "admin" ? (
                          <>
                            <Shield className="w-3 h-3" />
                            <span>Administradora</span>
                          </>
                        ) : (
                          <>
                            <Users className="w-3 h-3" />
                            <span>Atendimento</span>
                          </>
                        )}
                      </Badge>
                    </TableCell>

                    {/* Data de Cadastro */}
                    <TableCell className="whitespace-nowrap text-xs text-[#767676] dark:text-[#a1a1aa]">
                      {member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString("pt-BR")
                        : "Principal"}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-right whitespace-nowrap">
                      {isMainAdmin ? (
                        <span className="text-[11px] text-[#8f8f8f] dark:text-[#a1a1aa] italic pr-2">
                          Conta Titular
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRole(member)}
                            className="h-8 px-2.5 text-xs rounded-lg active:scale-95"
                            title="Alternar entre Administradora e Atendimento"
                          >
                            {member.role === "admin"
                              ? "Tornar Atendimento"
                              : "Promover Admin"}
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setMemberToDelete(member)}
                            className="w-8 h-8 rounded-lg active:scale-95"
                            title="Remover acesso da colaboradora"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Cadastro de Nova Colaboradora */}
      <ModalPortal isOpen={isAddModalOpen}>
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 select-none"
          onClick={() => !isSubmitting && setIsAddModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1a1a] rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] dark:border-white/[0.08] shadow-2xl w-full max-w-[480px] p-6 space-y-5 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#A8B29A]/15 text-[#A8B29A] flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Cadastrar Nova Colaboradora
                </h3>
                <p className="text-xs text-[#767676] dark:text-[#a1a1aa] mt-0.5">
                  Crie uma credencial de acesso oficial vinculada ao Firebase Auth da clínica.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="memName" className="font-semibold text-black dark:text-white">
                  Nome Completo
                </Label>
                <Input
                  id="memName"
                  placeholder="Ex: Maria Eduarda Silva"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="memEmail" className="font-semibold text-black dark:text-white">
                  E-mail de Login
                </Label>
                <Input
                  id="memEmail"
                  type="email"
                  placeholder="colaboradora@samaraestetica.com.br"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="memPass" className="font-semibold text-black dark:text-white">
                  Senha Provisória
                </Label>
                <Input
                  id="memPass"
                  type="password"
                  placeholder="Mínimo de 6 caracteres"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="rounded-xl h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-black dark:text-white">
                  Nível de Permissão
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormRole("funcionaria")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formRole === "funcionaria"
                        ? "bg-[#A8B29A]/15 border-[#A8B29A] text-black dark:text-white"
                        : "bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.08] text-[#767676] dark:text-[#a1a1aa]"
                    }`}
                  >
                    <div className="font-semibold text-xs text-black dark:text-white">
                      Atendimento
                    </div>
                    <div className="text-[10px] mt-0.5">Operacional (Agendamentos e Fichas)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole("admin")}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      formRole === "admin"
                        ? "bg-[#A8B29A]/15 border-[#A8B29A] text-black dark:text-white"
                        : "bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.08] dark:border-white/[0.08] text-[#767676] dark:text-[#a1a1aa]"
                    }`}
                  >
                    <div className="font-semibold text-xs text-black dark:text-white">
                      Administradora
                    </div>
                    <div className="text-[10px] mt-0.5">Acesso integral + Financeiro</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs h-10 px-5 font-semibold"
                >
                  {isSubmitting ? "Criando no Firebase..." : "Criar Colaboradora"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>

      {/* Modal de Exclusão de Acesso */}
      <ModalPortal isOpen={!!memberToDelete}>
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 select-none"
          onClick={() => setMemberToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1a1a1a] rounded-t-[28px] sm:rounded-[24px] border-t sm:border border-black/[0.08] dark:border-white/[0.08] shadow-2xl w-full max-w-[420px] p-6 space-y-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Remover Acesso da Colaboradora?
                </h3>
                <p className="text-xs text-[#767676] dark:text-[#a1a1aa] mt-1">
                  Tem certeza que deseja revogar o acesso de{" "}
                  <strong className="text-black dark:text-white">
                    {memberToDelete?.name}
                  </strong>
                  ? Esta colaboradora não conseguirá mais entrar na plataforma da clínica.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMemberToDelete(null)}
                className="rounded-xl text-xs h-9 px-4"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMember}
                className="rounded-xl text-xs h-9 px-4 font-semibold"
              >
                Sim, Remover Acesso
              </Button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
