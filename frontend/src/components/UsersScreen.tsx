/* eslint-disable no-irregular-whitespace */
import { FormEvent, JSX, useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "./ui/table";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";

import { UserListItem } from "../types";

type UsersScreenProps = {
  users: UserListItem[];
  usersError: string | null;
  usersLoading: boolean;
  creatingUser: boolean;
  authUserEmail: string;
  onReloadUsers: () => void;
  onCreateUser: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteUser: (user: UserListItem) => void;
  onUpdateUser: (
    userId: string,
    data: { name: string; email: string; password?: string },
  ) => Promise<void>;
};

function UsersScreen(props: UsersScreenProps): JSX.Element {
  const users = props.users;
  const usersError = props.usersError;
  const usersLoading = props.usersLoading;
  const creatingUser = props.creatingUser;
  const authUserEmail = props.authUserEmail;

  const onReloadUsers = props.onReloadUsers;
  const onCreateUser = props.onCreateUser;
  const onDeleteUser = props.onDeleteUser;
  const onUpdateUser = props.onUpdateUser;

  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);

  function handleOpenEdit(user: UserListItem): void {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPassword("");
  }

  function handleCloseEdit(): void {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
    setEditPassword("");
    setSavingEdit(false);
  }

  async function handleSubmitEdit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    const id = editingUser.id || editingUser._id;
    if (!id) {
      return;
    }

    setSavingEdit(true);

    try {
      const payload: { name: string; email: string; password?: string } = {
        name: editName,
        email: editEmail,
      };

      if (editPassword && editPassword.length > 0) {
        payload.password = editPassword;
      }

      await onUpdateUser(id, payload);
      handleCloseEdit();
    } finally {
      setSavingEdit(false);
    }
  }

  function handleAskDelete(user: UserListItem): void {
    setUserToDelete(user);
  }

  function handleCancelDelete(): void {
    setUserToDelete(null);
  }

  function handleConfirmDelete(): void {
    if (userToDelete) {
      onDeleteUser(userToDelete);
    }
    setUserToDelete(null);
  }

  return (
    <div>
      {usersError && (
        <Alert
          variant="destructive"
          className="mb-4 border-red-500/60 bg-red-500/10"
        >
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription className="text-sm">
            {usersError}
          </AlertDescription>
        </Alert>
      )}

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">
          Criar novo usuário
        </h2>

        <Card className="bg-slate-950/40 border-slate-800">
          <CardContent className="pt-4">
            <form
              onSubmit={onCreateUser}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div className="space-y-1">
                <Label htmlFor="u-name" className="text-xs">
                  Nome
                </Label>
                <Input
                  id="u-name"
                  name="name"
                  type="text"
                  required
                  className="h-9 bg-slate-950 border-slate-700 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="u-email" className="text-xs">
                  E-mail
                </Label>
                <Input
                  id="u-email"
                  name="email"
                  type="email"
                  required
                  className="h-9 bg-slate-950 border-slate-700 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="u-password" className="text-xs">
                  Senha
                </Label>
                <Input
                  id="u-password"
                  name="password"
                  type="password"
                  required
                  className="h-9 bg-slate-950 border-slate-700 text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={creatingUser}
                className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold disabled:opacity-60"
              >
                {creatingUser ? "Criando..." : "Criar usuário"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Usuários cadastrados
          </h2>
          <Button
            type="button"
            onClick={onReloadUsers}
            disabled={usersLoading}
            variant="outline"
            className="h-8 px-3 text-xs border-slate-700 bg-slate-900 text-slate-100 disabled:opacity-60"
          >
            {usersLoading ? "Atualizando..." : "Recarregar"}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-full text-sm">
            <TableHeader className="bg-slate-900/70">
              <TableRow>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Nome
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  E-mail
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Perfil
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="px-4 py-4 text-slate-400 border-t border-slate-800/80"
                  >
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              )}

              {users.map(function (user) {
                const key = user.id || user._id;
                const isSelf = authUserEmail === user.email;

                return (
                  <TableRow
                    key={key}
                    className="border-t border-slate-800/80 hover:bg-slate-900/60 transition"
                  >
                    <TableCell className="px-4 py-2">
                      {user.name}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {user.role === "admin" ? "Admin" : "Usuário"}
                    </TableCell>
                    <TableCell className="px-4 py-2 space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="default" // Usamos default para ter um fundo sólido
                        // Fundo branco, texto escuro. Hover suave (opacity)
                        className="h-7 text-xs bg-slate-50 text-slate-900 border border-slate-50 hover:bg-slate-200/90" 
                        onClick={function () {
                          handleOpenEdit(user);
                        }}
                      >
                        Editar
                      </Button>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        // Hover suave (opacity)
                        className="h-7 text-xs hover:bg-red-500/90" 
                        disabled={isSelf}
                        onClick={function () {
                          if (!isSelf) {
                            handleAskDelete(user);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog
        open={editingUser !== null}
        onOpenChange={function (open) {
          if (!open) {
            handleCloseEdit();
          }
        }}
      >
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Atualize os dados do usuário. A senha é opcional; deixe em
              branco para manter a senha atual.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-xs">
                Nome
              </Label>
              <Input
                id="edit-name"
                type="text"
                required
                value={editName}
                onChange={function (event) {
                  setEditName(event.target.value);
                }}
                className="h-9 bg-slate-950 border-slate-700 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-email" className="text-xs">
                E-mail
              </Label>
              <Input
                id="edit-email"
                type="email"
                required
                value={editEmail}
                onChange={function (event) {
                  setEditEmail(event.target.value);
                }}
                className="h-9 bg-slate-950 border-slate-700 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-password" className="text-xs">
                Nova senha (opcional)
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={function (event) {
                  setEditPassword(event.target.value);
                }}
                className="h-9 bg-slate-950 border-slate-700 text-sm"
                placeholder="Deixe em branco para não alterar"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={handleCloseEdit}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 bg-emerald-500 hover:bg-emerald-600"
                disabled={savingEdit}
              >
                {savingEdit ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={userToDelete !== null}
        onOpenChange={function (open) {
          if (!open) {
            handleCancelDelete();
          }
        }}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-300">
              Tem certeza de que deseja excluir o usuário{" "}
              {userToDelete ? userToDelete.email : ""}? Essa ação não
              poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-100 hover:bg-slate-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleConfirmDelete}
            >
              Excluir usuário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default UsersScreen;