"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

const CATEGORICAL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  );
}

type TooltipEntry = { value?: number | string; name?: string };
type TooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };

function CurrencyTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium text-popover-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-muted-foreground">
          <span className="font-medium text-popover-foreground">
            {formatCurrency(entry.value ?? 0)}
          </span>
          {entry.name ? ` · ${entry.name}` : ""}
        </p>
      ))}
    </div>
  );
}

export function SalesTrendChart({ data }: { data: { date: string; total: number }[] }) {
  return (
    <ChartCard title="Ventas · últimos 7 días">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis hide />
          <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopProductsChart({
  data,
}: {
  data: { name: string; quantity: number }[];
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Productos más vendidos">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Sin ventas registradas este mes.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Productos más vendidos">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <span className="font-medium text-popover-foreground">
                    {payload[0].value} unidades
                  </span>
                </div>
              );
            }}
          />
          <Bar dataKey="quantity" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CategorySalesChart({ data }: { data: { name: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Ventas por categoría">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Sin ventas registradas este mes.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Ventas por categoría">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CurrencyTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PaymentMethodsChart({ data }: { data: { name: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Métodos de pago">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Sin pagos registrados este mes.
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Métodos de pago">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CurrencyTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
