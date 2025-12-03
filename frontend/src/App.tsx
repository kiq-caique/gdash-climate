// frontend/src/App.tsx
import { FormEvent, JSX, useEffect, useState } from "react";

import "./index.css";

const API_BASE_URL = "http://localhost:3000";
const AUTH_STORAGE_KEY = "gdash_auth";

// ---------------------- Tipos ----------------------

type AuthUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

type AuthState = {
  token: string;
  user: AuthUser;
};

type WeatherLog = {
  id?: string;
  _id?: string;
  timestamp?: string | Date | null;
  location?: string;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  condition?: string;
  source?: string;
};

type TemperatureTrend = "subindo" | "caindo" | "estavel" | null;

type WeatherInsights = {
  count: number;
  averageTemperature: number | null;
  averageHumidity: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  trend: TemperatureTrend;
  comfortIndex: number | null;
  summary: string;
};

type MaybeDate = string | Date | null | undefined;

type UserListItem = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "admin" | "user";
};

// ---------------------- Helpers ----------------------

const parseDate = (value: MaybeDate): Date | null => {
  if (!value) {
    return null;
  }

  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formatDateTime = (value: MaybeDate): string => {
  const date = parseDate(value);
  if (!date) {
    return "—";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (
  value: number | null | undefined,
  digits: number,
): string => {
  if (value === null || value === undefined) {
    return "—";
  }

  return value.toFixed(digits).replace(".", ",");
};

// ---------------------- App ----------------------

function App(): JSX.Element {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [activePage, setActivePage] = useState<"dashboard" | "users">(
    "dashboard",
  );

  // weather state
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [insights, setInsights] = useState<WeatherInsights | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // users state
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);

  // ------------ carregar auth do localStorage ------------

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthState;
        setAuth(parsed);
      } catch (e) {
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

  const getAuthHeaders = (): HeadersInit => {
    if (!auth?.token) {
      return {};
    }

    return {
      Authorization: "Bearer " + auth.token,
    };
  };

  // ------------ chamadas de API: weather ------------

  const carregarLogs = async (): Promise<void> => {
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
  };

  const carregarInsights = async (): Promise<void> => {
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
  };

  const criarRegistroFake = async (): Promise<void> => {
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
  };

  const handleDownloadCsv = (): void => {
    window.open(
      API_BASE_URL + "/weather/export.csv",
      "_blank",
    );
  };

  const handleDownloadXlsx = (): void => {
    window.open(
      API_BASE_URL + "/weather/export.xlsx",
      "_blank",
    );
  };

  // carregar logs/insights quando logar
  useEffect(() => {
    if (!auth) {
      return;
    }

    void carregarLogs();
    void carregarInsights();
  }, [auth?.token]);

  // ------------ chamadas de API: users ------------

  const carregarUsuarios = async (): Promise<void> => {
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
  };

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

    // evita apagar a si mesmo
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

  // carregar usuários quando abrir a aba "users"
  useEffect(() => {
    if (!auth) {
      return;
    }

    if (activePage === "users") {
      void carregarUsuarios();
    }
  }, [auth?.token, activePage]);

  // ------------ login / logout ------------

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

  // ------------ render ------------

  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!auth) {
    // TELA DE LOGIN
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="w-full max-w-sm bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-6">
          <h1 className="text-xl font-bold mb-2 text-center">
            GDASH Climate Dashboard
          </h1>
          <p className="text-xs text-slate-400 mb-4 text-center">
            Faça login para acessar o painel de clima.
          </p>

          {error && (
            <div className="mb-3 text-xs text-red-400 text-center">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLoginSubmit}
            className="space-y-4"
          >
            <div>
              <label
                className="block text-xs mb-1"
                htmlFor="email"
              >
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                defaultValue="admin@gdash.dev"
                required
              />
            </div>

            <div>
              <label
                className="block text-xs mb-1"
                htmlFor="password"
              >
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                defaultValue="123456"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 rounded-md bg-emerald-500 py-2 text-sm font-semibold hover:bg-emerald-600"
            >
              Entrar
            </button>

            <p className="mt-2 text-[10px] text-slate-500 text-center">
              Usuário padrão: admin@gdash.dev / 123456
            </p>
          </form>
        </div>
      </div>
    );
  }

  // DASHBOARD + USERS
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
              <button
                type="button"
                onClick={function () {
                  setActivePage("dashboard");
                }}
                className={
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border " +
                  (activePage === "dashboard"
                    ? "bg-slate-100 text-slate-900 border-slate-100"
                    : "bg-slate-800 text-slate-100 border-slate-700")
                }
              >
                Dashboard
              </button>

              {auth.user.role === "admin" && (
                <button
                  type="button"
                  onClick={function () {
                    setActivePage("users");
                  }}
                  className={
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border " +
                    (activePage === "users"
                      ? "bg-slate-100 text-slate-900 border-slate-100"
                      : "bg-slate-800 text-slate-100 border-slate-700")
                  }
                >
                  Usuários
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition self-end"
            >
              Sair
            </button>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL */}
        {activePage === "dashboard" && (
          <div>
            {error && (
              <div className="mb-4 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                type="button"
                onClick={function () {
                  void carregarLogs();
                  void carregarInsights();
                }}
                disabled={loading || loadingInsights}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-900 text-sm font-medium hover:bg-white transition disabled:opacity-60"
              >
                {loading || loadingInsights
                  ? "Atualizando..."
                  : "Recarregar dados"}
              </button>

              <button
                type="button"
                onClick={function () {
                  void criarRegistroFake();
                }}
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar registro fake"}
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 text-sm font-medium hover:bg-slate-700 transition"
              >
                Exportar CSV
              </button>

              <button
                type="button"
                onClick={handleDownloadXlsx}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 text-sm font-medium hover:bg-slate-700 transition"
              >
                Exportar XLSX
              </button>
            </div>

            {/* INSIGHTS */}
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">
                Insights do clima (IA simples)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400">
                    Registros
                  </p>
                  <p className="text-xl font-semibold">
                    {insights ? insights.count : 0}
                  </p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400">
                    Temp. média (°C)
                  </p>
                  <p className="text-xl font-semibold">
                    {formatNumber(
                      insights
                        ? insights.averageTemperature
                        : null,
                      1,
                    )}
                  </p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400">
                    Umidade média (%)
                  </p>
                  <p className="text-xl font-semibold">
                    {formatNumber(
                      insights ? insights.averageHumidity : null,
                      0,
                    )}
                  </p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-400">
                    Índice de conforto
                  </p>
                  <p className="text-xl font-semibold">
                    {formatNumber(
                      insights ? insights.comfortIndex : null,
                      1,
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 text-sm text-slate-300">
                {loadingInsights && !insights && (
                  <p>Calculando insights...</p>
                )}
                {!loadingInsights && insights && (
                  <p>{insights.summary}</p>
                )}
                {!loadingInsights && !insights && (
                  <p>Nenhum insight disponível ainda.</p>
                )}
              </div>
            </section>

            {/* TABELA */}
            <section className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-slate-200">
                  Últimos registros
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-900/70">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Data/Hora
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Cidade
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Temp (°C)
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Umidade (%)
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Vento (km/h)
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Condição
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 && (
                      <tr>
                        <td
                          className="px-4 py-4 text-slate-400"
                          colSpan={6}
                        >
                          Nenhum registro encontrado. Clique em{" "}
                          <span className="font-semibold">
                            Criar registro fake
                          </span>{" "}
                          para testar.
                        </td>
                      </tr>
                    )}

                    {logs.map((log) => (
                      <tr
                        key={log.id || log._id}
                        className="border-t border-slate-800/80 hover:bg-slate-900/60 transition"
                      >
                        <td className="px-4 py-2">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-4 py-2">
                          {log.location ? log.location : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {log.temperature !== undefined &&
                          log.temperature !== null
                            ? log.temperature
                                .toFixed(1)
                                .replace(".", ",")
                            : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {log.humidity !== undefined &&
                          log.humidity !== null
                            ? log.humidity.toFixed(0)
                            : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {log.windSpeed !== undefined &&
                          log.windSpeed !== null
                            ? log.windSpeed.toFixed(1)
                            : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {log.condition ? log.condition : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activePage === "users" && auth.user.role === "admin" && (
          <div>
            {usersError && (
              <div className="mb-4 text-sm text-red-400">
                {usersError}
              </div>
            )}

            <section className="mb-6">
              <h2 className="text-sm font-semibold text-slate-200 mb-3">
                Criar novo usuário
              </h2>

              <form
                onSubmit={handleCreateUser}
                className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
              >
                <div>
                  <label
                    className="block text-xs mb-1"
                    htmlFor="u-name"
                  >
                    Nome
                  </label>
                  <input
                    id="u-name"
                    name="name"
                    type="text"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs mb-1"
                    htmlFor="u-email"
                  >
                    E-mail
                  </label>
                  <input
                    id="u-email"
                    name="email"
                    type="email"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs mb-1"
                    htmlFor="u-password"
                  >
                    Senha
                  </label>
                  <input
                    id="u-password"
                    name="password"
                    type="password"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div>
                    <label
                      className="block text-xs mb-1"
                      htmlFor="u-role"
                    >
                      Perfil
                    </label>
                    <select
                      id="u-role"
                      name="role"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                      defaultValue="user"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="w-full rounded-md bg-emerald-500 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {creatingUser ? "Criando..." : "Criar usuário"}
                  </button>
                </div>
              </form>
            </section>

            <section className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">
                  Usuários cadastrados
                </h2>
                <button
                  type="button"
                  onClick={function () {
                    void carregarUsuarios();
                  }}
                  disabled={usersLoading}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-100 text-xs font-medium hover:bg-slate-700 transition disabled:opacity-60"
                >
                  {usersLoading ? "Atualizando..." : "Recarregar"}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-900/70">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Nome
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        E-mail
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Perfil
                      </th>
                      <th className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td
                          className="px-4 py-4 text-slate-400"
                          colSpan={4}
                        >
                          Nenhum usuário cadastrado.
                        </td>
                      </tr>
                    )}

                    {users.map((user) => (
                      <tr
                        key={user.id || user._id}
                        className="border-t border-slate-800/80 hover:bg-slate-900/60 transition"
                      >
                        <td className="px-4 py-2">
                          {user.name}
                        </td>
                        <td className="px-4 py-2">
                          {user.email}
                        </td>
                        <td className="px-4 py-2">
                          {user.role === "admin"
                            ? "Admin"
                            : "Usuário"}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={function () {
                              void handleDeleteUser(user);
                            }}
                            disabled={
                              auth.user.email === user.email
                            }
                            className="px-3 py-1 rounded-md bg-red-500 text-white text-xs font-medium hover:bg-red-600 disabled:opacity-50"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
