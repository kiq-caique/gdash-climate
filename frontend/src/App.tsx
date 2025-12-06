/* eslint-disable @typescript-eslint/no-unused-vars */
// frontend/src/App.tsx
import {
  FormEvent,
  JSX,
  useCallback,
  useEffect,
  useState,
} from "react";

import "./index.css";

import {
  API_BASE_URL,
  AUTH_STORAGE_KEY,
  AuthState,
  WeatherLog,
  WeatherInsights,
  UserListItem,
} from "./types";

import { Button } from "./components/ui/button";
import LoginScreen from "./components/LoginScreen";
import DashboardScreen from "./components/DashboardScreen";
import UsersScreen from "./components/UsersScreen";

type ActivePage = "dashboard" | "users";

function App(): JSX.Element {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [activePage, setActivePage] = useState<ActivePage>("dashboard");

  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [insights, setInsights] = useState<WeatherInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  // --------------------------------------------------
  // Auth
  // --------------------------------------------------
  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthState;
        setAuth(parsed);
      } catch (_error) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    setAuthLoaded(true);
  }, []);

  const saveAuth = (state: AuthState | null): void => {
    setAuth(state);
    if (state) {
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(state),
      );
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const getAuthHeaders = useCallback((): HeadersInit => {
    if (!auth || !auth.token) {
      return {};
    }

    return {
      Authorization: "Bearer " + auth.token,
    };
  }, [auth]);

  // --------------------------------------------------
  // Weather
  // --------------------------------------------------
  const carregarLogs = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_BASE_URL + "/weather", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          "Falha ao buscar dados (" +
            String(response.status) +
            ")",
        );
      }

      const data = (await response.json()) as WeatherLog[];
      setLogs(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar dados";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const carregarInsights = useCallback(async (): Promise<void> => {
    setLoadingInsights(true);
    setError(null);

    try {
      const response = await fetch(
        API_BASE_URL + "/weather/insights",
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Falha ao buscar insights (" +
            String(response.status) +
            ")",
        );
      }

      const data = (await response.json()) as WeatherInsights;
      setInsights(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar insights";
      setError(message);
    } finally {
      setLoadingInsights(false);
    }
  }, [getAuthHeaders]);

  const criarRegistroFake = useCallback(async (): Promise<void> => {
    setCreating(true);
    setError(null);

    try {
      const payload = {
        location: "Fortaleza, BR",
        temperature: Number((30 + Math.random() * 3).toFixed(1)),
        humidity: Number((60 + Math.random() * 15).toFixed(0)),
        windSpeed: Number((5 + Math.random() * 10).toFixed(1)),
        condition: "clear",
        source: "frontend-manual",
      };

      const response = await fetch(API_BASE_URL + "/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          "Falha ao criar registro (" +
            String(response.status) +
            ")",
        );
      }

      await carregarLogs();
      await carregarInsights();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao criar registro";
      setError(message);
    } finally {
      setCreating(false);
    }
  }, [carregarInsights, carregarLogs, getAuthHeaders]);

  const handleDownloadCsv = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(
        API_BASE_URL + "/weather/export.csv",
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Falha ao exportar CSV (" +
            String(response.status) +
            ")",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "weather_logs.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao exportar CSV";
      window.alert(message);
    }
  }, [getAuthHeaders]);

  const handleDownloadXlsx = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(
        API_BASE_URL + "/weather/export.xlsx",
        {
          headers: getAuthHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Falha ao exportar XLSX (" +
            String(response.status) +
            ")",
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "weather_logs.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao exportar XLSX";
      window.alert(message);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    void carregarLogs();
    void carregarInsights();
  }, [auth, carregarLogs, carregarInsights]);

  // --------------------------------------------------
  // Users
  // --------------------------------------------------
  const carregarUsuarios = useCallback(async (): Promise<void> => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await fetch(API_BASE_URL + "/users", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          "Falha ao buscar usuários (" +
            String(response.status) +
            ")",
        );
      }

      const data = (await response.json()) as UserListItem[];
      setUsers(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao carregar usuários";
      setUsersError(message);
    } finally {
      setUsersLoading(false);
    }
  }, [getAuthHeaders]);

  const handleCreateUser = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setUsersError(null);
    setCreatingUser(true);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const role = String(
      formData.get("role") || "user",
    ) as "admin" | "user";

    try {
      const response = await fetch(API_BASE_URL + "/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: name,
          email: email,
          password: password,
          role: role,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          "Falha ao criar usuário (" +
            String(response.status) +
            ") " +
            text,
        );
      }

      event.currentTarget.reset();
      await carregarUsuarios();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao criar usuário";
      setUsersError(message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (
    user: UserListItem,
  ): Promise<void> => {
    const id = user.id || user._id;

    if (!id) {
      return;
    }

    if (auth && user.email === auth.user.email) {
      window.alert("Você não pode excluir o próprio usuário logado.");
      return;
    }

    const ok = window.confirm(
      "Tem certeza que deseja excluir o usuário " +
        user.email +
        "?",
    );

    if (!ok) {
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + "/users/" + id, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          "Falha ao excluir usuário (" +
            String(response.status) +
            ")",
        );
      }

      await carregarUsuarios();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao excluir usuário";
      setUsersError(message);
    }
  };

  useEffect(() => {
    if (!auth) {
      return;
    }

    if (activePage === "users") {
      void carregarUsuarios();
    }
  }, [activePage, auth, carregarUsuarios]);

  // --------------------------------------------------
  // Login / Logout
  // --------------------------------------------------
  const handleLoginSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch(API_BASE_URL + "/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email, password: password }),
      });

      if (!response.ok) {
        throw new Error("Credenciais inválidas");
      }

      const data = (await response.json()) as AuthState;
      saveAuth(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao tentar fazer login";
      setError(message);
    }
  };

  const handleLogout = (): void => {
    saveAuth(null);
    setLogs([]);
    setInsights(null);
    setUsers([]);
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!auth) {
    return (
      <LoginScreen
        error={error}
        onSubmit={handleLoginSubmit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-start justify-center py-10">
      <div className="w-full max-w-5xl bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl p-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              GDASH Climate Dashboard (MVP)
            </h1>
            <p className="text-sm text-slate-400">
              Logs de clima salvos no MongoDB Atlas via NestJS.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Logado como {auth.user.name} ({auth.user.email}) –{" "}
              {auth.user.role === "admin" ? "Admin" : "Usuário"}
            </p>
          </div>

          <div className="flex flex-col gap-2 items-stretch md:items-end">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={activePage === "dashboard" ? "default" : "outline"}
                className={
                  activePage === "dashboard"
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-800 text-slate-100 border-slate-700"
                }
                onClick={function () {
                  setActivePage("dashboard");
                }}
              >
                Dashboard
              </Button>

              {auth.user.role === "admin" && (
                <Button
                  type="button"
                  size="sm"
                  variant={activePage === "users" ? "default" : "outline"}
                  className={
                    activePage === "users"
                      ? "bg-slate-100 text-slate-900 border-slate-100"
                      : "bg-slate-800 text-slate-100 border-slate-700"
                  }
                  onClick={function () {
                    setActivePage("users");
                  }}
                >
                  Usuários
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="px-4 self-end"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        </header>

        {activePage === "dashboard" && (
          <DashboardScreen
            logs={logs}
            insights={insights}
            loading={loading}
            creating={creating}
            loadingInsights={loadingInsights}
            error={error}
            onReload={function () {
              void carregarLogs();
              void carregarInsights();
            }}
            onCreateFake={function () {
              void criarRegistroFake();
            }}
            onExportCsv={function () {
              void handleDownloadCsv();
            }}
            onExportXlsx={function () {
              void handleDownloadXlsx();
            }}
          />
        )}

        {activePage === "users" && auth.user.role === "admin" && (
          <UsersScreen
            users={users}
            usersError={usersError}
            usersLoading={usersLoading}
            creatingUser={creatingUser}
            authUserEmail={auth.user.email}
            onReloadUsers={function () {
              void carregarUsuarios();
            }}
            onCreateUser={handleCreateUser}
            onDeleteUser={function (user) {
              void handleDeleteUser(user);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
