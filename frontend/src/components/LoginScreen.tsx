/* eslint-disable no-irregular-whitespace */
// frontend/src/components/LoginScreen.tsx
import { FormEvent, JSX } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

type LoginScreenProps = {
  error: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function LoginScreen(props: LoginScreenProps): JSX.Element {
  const error = props.error;
  const onSubmit = props.onSubmit;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <Card className="w-full max-w-sm bg-slate-900/80 border-slate-800">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl text-center text-slate-50">
            GDASH Climate Dashboard
          </CardTitle>
          <CardDescription className="text-xs text-center">
            Faça login para acessar o painel de clima.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert
              variant="destructive"
              className="mb-4 border-red-500/60 bg-red-500/10"
            >
              <AlertTitle>Erro ao entrar</AlertTitle>
              <AlertDescription className="text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs">
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                className="h-9 bg-slate-950 border-slate-700 text-sm !text-slate-50 placeholder:!text-slate-500"
                defaultValue="admin@gdash.dev"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs">
                Senha
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                className="h-9 bg-slate-950 border-slate-700 text-sm !text-slate-50 placeholder:!text-slate-500"
                defaultValue="123456"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2 h-9 text-sm font-semibold"
            >
              Entrar
            </Button>

            <p className="mt-2 text-[10px] text-slate-500 text-center">
              Usuário padrão: admin@gdash.dev / 123456
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginScreen;