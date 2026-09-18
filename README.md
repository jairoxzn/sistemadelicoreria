# LiquorFlow

Sistema de gestión integral para licorerías, desarrollado inicialmente para una
licorería ubicada en Arequipa, Perú, y preparado para operar en otras licorerías
del país (multi-sucursal).

## Características

- **Dashboard** con ventas del día/mes, ganancia estimada, alertas de stock y
  gráficos (ventas últimos 7 días, top productos, ventas por categoría, métodos
  de pago).
- **Punto de Venta (POS)** rápido con búsqueda de productos, lectura de código
  de barras, combos, cliente opcional, descuentos autorizados, pago en
  efectivo/Yape/Plin/tarjeta/transferencia o mixto, cálculo de vuelto y ticket
  imprimible. Atajos de teclado: `F2` buscar, `F4` cobrar, `Esc` cerrar modal.
- **Inventario** con stock por sucursal, estados (normal/bajo/agotado),
  movimientos manuales (entrada/salida/ajuste) con motivo obligatorio.
- **Productos, Categorías, Marcas, Proveedores, Clientes** con CRUD completo.
- **Compras** con flujo borrador → confirmada (aumenta stock) → anulada.
- **Caja**: apertura, ingresos/retiros/gastos, cierre con cálculo de diferencia
  entre efectivo esperado y contado.
- **Ventas**: historial, anulación (repone stock) y devoluciones parciales por
  producto.
- **Combos**: paquetes de productos con precio especial, vendibles desde el POS.
- **Promociones**: descuentos por porcentaje, monto fijo, precio promocional o
  2x1, vigentes por rango de fechas/horario (gestión; ver nota de alcance).
- **Reportes** de ventas, inventario, compras y caja con filtro de fechas y
  exportación a CSV / impresión.
- **Usuarios y roles (RBAC)**: Administrador, Supervisor, Cajero, Almacenero.
- **Sucursales**, **Configuración del negocio** y **Auditoría** de acciones.

### Nota de alcance

Las promociones se pueden crear y gestionar, pero por ahora el POS no aplica su
descuento automáticamente al vender (usa el campo "precio promocional" del
producto para descuentos rápidos manuales). Priorizar la integración completa
del motor de promociones en el POS queda como siguiente paso natural.

## Tecnologías

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + React 19
- [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
  (base Radix) + [Lucide React](https://lucide.dev/)
- [Prisma ORM 7](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/)
  ([Neon](https://neon.tech/))
- [Auth.js (NextAuth) v5](https://authjs.dev/) — Credentials + JWT + RBAC
- [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/)
- [Recharts](https://recharts.org/) para los gráficos del dashboard

## Requisitos

- Node.js 20+
- Una base de datos PostgreSQL (se usó [Neon](https://neon.tech/))

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```env
# Conexion pooled (pgbouncer) - usada por la app en runtime
DATABASE_URL="postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?channel_binding=require&sslmode=verify-full"

# Conexion directa (sin pgbouncer) - usada por Prisma para migraciones
DIRECT_URL="postgresql://user:password@host.region.aws.neon.tech/dbname?sslmode=verify-full"

# Auth.js - genera un valor con: openssl rand -base64 33
AUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

NEXT_PUBLIC_APP_NAME="LiquorFlow"
```

> Con Neon (o cualquier Postgres detrás de pgbouncer), usa la URL **pooled**
> para `DATABASE_URL` (runtime) y la URL **directa** para `DIRECT_URL`
> (migraciones de Prisma). Prisma 7 gestiona la URL de conexión desde
> `prisma.config.ts`, no desde `schema.prisma`.

## Instalación y ejecución local

```bash
npm install

npx prisma generate
npx prisma migrate dev
npx prisma db seed

npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Usuarios de prueba (creados por el seed)

| Rol            | Correo                     | Contraseña      |
| -------------- | --------------------------- | --------------- |
| Administrador  | admin@liquorflow.pe         | `Admin123!`      |
| Supervisor     | supervisor@liquorflow.pe    | `Supervisor123!` |
| Cajero         | cajero@liquorflow.pe        | `Cajero123!`     |
| Almacenero     | almacen@liquorflow.pe       | `Almacen123!`    |

El seed también crea la sucursal principal, categorías, marcas, proveedores,
~15 productos de ejemplo y clientes demo.

## Build de producción

```bash
npm run build
npm run start
```

## Estructura del proyecto

```text
prisma/
  schema.prisma       Modelo de datos completo
  seed.ts              Datos demo
src/
  app/
    login/
    (app)/             Rutas protegidas (layout con sidebar + header)
      dashboard/  pos/  ventas/  productos/  inventario/
      compras/  proveedores/  clientes/  promociones/  caja/
      reportes/  sucursales/  usuarios/  auditoria/  configuracion/
    api/auth/[...nextauth]/
  components/
    ui/                Componentes shadcn/ui
    layout/            Sidebar, header, navegación
    dashboard/  pos/  auth/  shared/
  lib/                 prisma, auth, rbac, format, dates, audit, numbering...
  validations/         Esquemas Zod compartidos cliente/servidor
  generated/prisma/    Cliente de Prisma generado (no versionado)
```

Cada módulo de negocio sigue el mismo patrón: `page.tsx` (Server Component que
consulta Prisma), un componente cliente con la tabla/formulario, y un
`actions.ts` con Server Actions que validan con Zod, verifican el rol del
usuario (`requireRole`) y registran auditoría (`logAudit`). Las operaciones
críticas (venta, compra, apertura/cierre de caja, devoluciones) usan
`prisma.$transaction`.

## Deploy

Cualquier plataforma compatible con Next.js (Vercel, Docker, etc.) sirve. Antes
de desplegar:

1. Configura `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` y `NEXTAUTH_URL` (con
   la URL pública del sitio) en el entorno de producción.
2. Corre `npx prisma migrate deploy` contra la base de datos de producción.
3. `npm run build && npm run start` (o el equivalente de tu plataforma).
