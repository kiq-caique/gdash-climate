// frontend/src/components/DashboardScreen.tsx
import { JSX } from "react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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

import {
  WeatherLog,
  WeatherInsights,
  formatDateTime,
  formatNumber,
} from "../types";

type DashboardScreenProps = {
  logs: WeatherLog[];
  insights: WeatherInsights | null;
  loading: boolean;
  creating: boolean;
  loadingInsights: boolean;
  error: string | null;
  onReload: () => void;
  onCreateFake: () => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
};

function DashboardScreen(props: DashboardScreenProps): JSX.Element {
  const logs = props.logs;
  const insights = props.insights;
  const loading = props.loading;
  const creating = props.creating;
  const loadingInsights = props.loadingInsights;
  const error = props.error;

  const onReload = props.onReload;
  const onCreateFake = props.onCreateFake;
  const onExportCsv = props.onExportCsv;
  const onExportXlsx = props.onExportXlsx;

  return (
    <div>
      {error && (
        <Alert
          variant="destructive"
          className="mb-4 border-red-500/60 bg-red-500/10"
        >
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription className="text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          type="button"
          onClick={onReload}
          disabled={loading || loadingInsights}
          className="text-sm"
          variant="secondary"
        >
          {loading || loadingInsights ? "Atualizando..." : "Recarregar dados"}
        </Button>

        <Button
          type="button"
          onClick={onCreateFake}
          disabled={creating}
          className="bg-emerald-500 hover:bg-emerald-600 text-sm"
        >
          {creating ? "Criando..." : "Criar registro fake"}
        </Button>

        <Button
          type="button"
          onClick={onExportCsv}
          variant="outline"
          className="border-slate-700 bg-slate-900 text-slate-100 text-sm"
        >
          Exportar CSV
        </Button>

        <Button
          type="button"
          onClick={onExportXlsx}
          variant="outline"
          className="border-slate-700 bg-slate-900 text-slate-100 text-sm"
        >
          Exportar XLSX
        </Button>
      </div>

      <section className="mb-6">
  <h2 className="text-sm font-semibold text-slate-200 mb-3">
    Insights do clima (IA simples)
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
    <Card className="bg-slate-950/40 border-slate-800 text-slate-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-normal text-slate-400">
          Registros
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold text-slate-50">
          {insights ? insights.count : 0}
        </p>
      </CardContent>
    </Card>

    <Card className="bg-slate-950/40 border-slate-800 text-slate-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-normal text-slate-400">
          Temp. média (°C)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold text-slate-50">
          {formatNumber(
            insights ? insights.averageTemperature : null,
            1
          )}
        </p>
      </CardContent>
    </Card>

    <Card className="bg-slate-950/40 border-slate-800 text-slate-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-normal text-slate-400">
          Umidade média (%)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold text-slate-50">
          {formatNumber(
            insights ? insights.averageHumidity : null,
            0
          )}
        </p>
      </CardContent>
    </Card>

    <Card className="bg-slate-950/40 border-slate-800 text-slate-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-normal text-slate-400">
          Índice de conforto
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-2xl font-semibold text-slate-50">
          {formatNumber(
            insights ? insights.comfortIndex : null,
            1
          )}
        </p>
      </CardContent>
    </Card>
  </div>

  <Card className="bg-slate-950/40 border-slate-800 text-slate-100">
    <CardContent className="p-3 text-sm text-slate-300">
      {loadingInsights && !insights && <p>Calculando insights...</p>}
      {!loadingInsights && insights && <p>{insights.summary}</p>}
      {!loadingInsights && !insights && (
        <p>Nenhum insight disponível ainda.</p>
      )}
    </CardContent>
  </Card>
</section>


      <section className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">
            Últimos registros
          </h2>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-full text-sm">
            <TableHeader className="bg-slate-900/70">
              <TableRow>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Data/Hora
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Cidade
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Temp (°C)
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Umidade (%)
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Vento (km/h)
                </TableHead>
                <TableHead className="px-4 py-2 text-left font-semibold border-b border-slate-800">
                  Condição
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-4 text-slate-400 border-t border-slate-800/80"
                  >
                    Nenhum registro encontrado. Clique em{" "}
                    <span className="font-semibold">Criar registro fake</span>{" "}
                    para testar.
                  </TableCell>
                </TableRow>
              )}

              {logs.map(function (log) {
                const key = log.id || log._id;

                return (
                  <TableRow
                    key={key}
                    className="border-t border-slate-800/80 hover:bg-slate-900/60 transition"
                  >
                    <TableCell className="px-4 py-2">
                      {formatDateTime(log.timestamp)}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {log.location ? log.location : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {log.temperature !== undefined &&
                      log.temperature !== null
                        ? log.temperature.toFixed(1).replace(".", ",")
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {log.humidity !== undefined && log.humidity !== null
                        ? log.humidity.toFixed(0)
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {log.windSpeed !== undefined && log.windSpeed !== null
                        ? log.windSpeed.toFixed(1)
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {log.condition ? log.condition : "—"}
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

export default DashboardScreen;
