// frontend/src/components/UsersScreen.tsx
import { FormEvent, JSX } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
} from "./ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "./ui/table";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

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

              <div className="flex flex-col gap-2">
                <div className="space-y-1">
                  <Label htmlFor="u-role" className="text-xs">
                    Perfil
                  </Label>
                  <select
                    id="u-role"
                    name="role"
                    defaultValue="user"
                    className="w-full h-9 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={creatingUser}
                  className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold disabled:opacity-60"
                >
                  {creatingUser ? "Criando..." : "Criar usuário"}
                </Button>
              </div>
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
                    <TableCell className="px-4 py-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={isSelf}
                        onClick={function () {
                          onDeleteUser(user);
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
    </div>
  );
}

export default UsersScreen;
