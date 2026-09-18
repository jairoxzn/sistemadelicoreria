import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { Role } from "../src/generated/prisma/enums";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("Sembrando datos demo de LiquorFlow...");

  const branch = await prisma.branch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Sede Principal - Arequipa",
      address: "Av. Ejercito 123, Yanahuara, Arequipa",
      phone: "054-123456",
      isMain: true,
    },
  });

  await prisma.businessConfig.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      tradeName: "LiquorFlow",
      businessName: "Licorería LiquorFlow S.A.C.",
      ruc: "20123456789",
      address: "Av. Ejercito 123, Yanahuara, Arequipa",
      phone: "054-123456",
      whatsapp: "51987654321",
      currency: "PEN",
      igvPercent: 18,
      ticketFooter: "¡Gracias por su compra! Tome con responsabilidad.",
    },
  });

  const passwordHash = await bcrypt.hash("Admin123!", 10);
  const cajeroHash = await bcrypt.hash("Cajero123!", 10);
  const almacenHash = await bcrypt.hash("Almacen123!", 10);
  const supervisorHash = await bcrypt.hash("Supervisor123!", 10);

  const [admin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@liquorflow.pe" },
      update: {},
      create: {
        name: "Administrador General",
        email: "admin@liquorflow.pe",
        passwordHash,
        role: Role.ADMINISTRADOR,
        branchId: branch.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "cajero@liquorflow.pe" },
      update: {},
      create: {
        name: "Juan Cajero",
        email: "cajero@liquorflow.pe",
        passwordHash: cajeroHash,
        role: Role.CAJERO,
        branchId: branch.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "almacen@liquorflow.pe" },
      update: {},
      create: {
        name: "Pedro Almacenero",
        email: "almacen@liquorflow.pe",
        passwordHash: almacenHash,
        role: Role.ALMACENERO,
        branchId: branch.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "supervisor@liquorflow.pe" },
      update: {},
      create: {
        name: "María Supervisora",
        email: "supervisor@liquorflow.pe",
        passwordHash: supervisorHash,
        role: Role.SUPERVISOR,
        branchId: branch.id,
      },
    }),
  ]);

  const categoryNames = [
    "Cervezas",
    "Whisky",
    "Ron",
    "Vodka",
    "Tequila",
    "Vinos",
    "Pisco",
    "Espumantes",
    "Cremas",
    "Energizantes",
    "Gaseosas",
    "Agua",
    "Hielo",
    "Snacks",
    "Otros",
  ];

  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories[name] = cat.id;
  }

  const brandNames = [
    "Cusqueña",
    "Pilsen",
    "Cristal",
    "Johnnie Walker",
    "Chivas Regal",
    "Cartavio",
    "Absolut",
    "Smirnoff",
    "Tabernero",
    "Tacama",
  ];

  const brands: Record<string, string> = {};
  for (const name of brandNames) {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    brands[name] = brand.id;
  }

  const supplier1 = await prisma.supplier.upsert({
    where: { ruc: "20456789123" },
    update: {},
    create: {
      businessName: "Distribuidora Backus y Johnston S.A.A.",
      tradeName: "Backus",
      ruc: "20456789123",
      contactName: "Carlos Ramírez",
      phone: "054-654321",
      whatsapp: "51912345678",
      address: "Parque Industrial, Arequipa",
      email: "ventas@backus-arequipa.pe",
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { ruc: "20567891234" },
    update: {},
    create: {
      businessName: "Licores del Sur E.I.R.L.",
      tradeName: "Licores del Sur",
      ruc: "20567891234",
      contactName: "Ana Torres",
      phone: "054-789123",
      whatsapp: "51923456789",
      address: "Mercado Mayorista, Arequipa",
      email: "contacto@licoresdelsur.pe",
    },
  });

  type SeedProduct = {
    code: string;
    barcode: string;
    name: string;
    category: string;
    brand?: string;
    presentation: string;
    content: string;
    purchasePrice: number;
    salePrice: number;
    wholesalePrice?: number;
    supplierId: string;
    stock: number;
    stockMin: number;
  };

  const products: SeedProduct[] = [
    {
      code: "P0001",
      barcode: "7751271001",
      name: "Cusqueña Dorada 620ml",
      category: "Cervezas",
      brand: "Cusqueña",
      presentation: "Botella",
      content: "620 ml",
      purchasePrice: 5.5,
      salePrice: 8.5,
      wholesalePrice: 7.5,
      supplierId: supplier1.id,
      stock: 120,
      stockMin: 24,
    },
    {
      code: "P0002",
      barcode: "7751271002",
      name: "Pilsen Callao 620ml",
      category: "Cervezas",
      brand: "Pilsen",
      presentation: "Botella",
      content: "620 ml",
      purchasePrice: 4.8,
      salePrice: 7.5,
      wholesalePrice: 6.5,
      supplierId: supplier1.id,
      stock: 150,
      stockMin: 24,
    },
    {
      code: "P0003",
      barcode: "7751271003",
      name: "Cristal 620ml",
      category: "Cervezas",
      brand: "Cristal",
      presentation: "Botella",
      content: "620 ml",
      purchasePrice: 4.5,
      salePrice: 7.0,
      wholesalePrice: 6.0,
      supplierId: supplier1.id,
      stock: 8,
      stockMin: 24,
    },
    {
      code: "P0004",
      barcode: "7751271004",
      name: "Johnnie Walker Etiqueta Roja 750ml",
      category: "Whisky",
      brand: "Johnnie Walker",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 55,
      salePrice: 85,
      supplierId: supplier2.id,
      stock: 15,
      stockMin: 5,
    },
    {
      code: "P0005",
      barcode: "7751271005",
      name: "Chivas Regal 12 años 750ml",
      category: "Whisky",
      brand: "Chivas Regal",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 90,
      salePrice: 135,
      supplierId: supplier2.id,
      stock: 3,
      stockMin: 5,
    },
    {
      code: "P0006",
      barcode: "7751271006",
      name: "Ron Cartavio Añejo 750ml",
      category: "Ron",
      brand: "Cartavio",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 28,
      salePrice: 42,
      supplierId: supplier2.id,
      stock: 20,
      stockMin: 6,
    },
    {
      code: "P0007",
      barcode: "7751271007",
      name: "Vodka Absolut Blue 750ml",
      category: "Vodka",
      brand: "Absolut",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 45,
      salePrice: 68,
      supplierId: supplier2.id,
      stock: 12,
      stockMin: 5,
    },
    {
      code: "P0008",
      barcode: "7751271008",
      name: "Vodka Smirnoff 750ml",
      category: "Vodka",
      brand: "Smirnoff",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 30,
      salePrice: 48,
      supplierId: supplier2.id,
      stock: 18,
      stockMin: 6,
    },
    {
      code: "P0009",
      barcode: "7751271009",
      name: "Pisco Tabernero Quebranta 750ml",
      category: "Pisco",
      brand: "Tabernero",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 22,
      salePrice: 35,
      supplierId: supplier2.id,
      stock: 25,
      stockMin: 8,
    },
    {
      code: "P0010",
      barcode: "7751271010",
      name: "Vino Tacama Blanco 750ml",
      category: "Vinos",
      brand: "Tacama",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 20,
      salePrice: 32,
      supplierId: supplier2.id,
      stock: 16,
      stockMin: 6,
    },
    {
      code: "P0011",
      barcode: "7751271011",
      name: "Vino Tabernero Borgoña 750ml",
      category: "Vinos",
      brand: "Tabernero",
      presentation: "Botella",
      content: "750 ml",
      purchasePrice: 18,
      salePrice: 28,
      supplierId: supplier2.id,
      stock: 0,
      stockMin: 6,
    },
    {
      code: "P0012",
      barcode: "7751271012",
      name: "Red Bull Energizante 250ml",
      category: "Energizantes",
      presentation: "Lata",
      content: "250 ml",
      purchasePrice: 5.5,
      salePrice: 9.0,
      supplierId: supplier1.id,
      stock: 40,
      stockMin: 12,
    },
    {
      code: "P0013",
      barcode: "7751271013",
      name: "Coca-Cola 1.5L",
      category: "Gaseosas",
      presentation: "Botella",
      content: "1.5 L",
      purchasePrice: 4.5,
      salePrice: 7.0,
      supplierId: supplier1.id,
      stock: 60,
      stockMin: 12,
    },
    {
      code: "P0014",
      barcode: "7751271014",
      name: "Agua San Luis 625ml",
      category: "Agua",
      presentation: "Botella",
      content: "625 ml",
      purchasePrice: 1.5,
      salePrice: 3.0,
      supplierId: supplier1.id,
      stock: 80,
      stockMin: 20,
    },
    {
      code: "P0015",
      barcode: "7751271015",
      name: "Bolsa de Hielo 5kg",
      category: "Hielo",
      presentation: "Bolsa",
      content: "5 kg",
      purchasePrice: 4.0,
      salePrice: 8.0,
      supplierId: supplier1.id,
      stock: 30,
      stockMin: 10,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { internalCode: p.code },
      update: {},
      create: {
        internalCode: p.code,
        barcode: p.barcode,
        name: p.name,
        categoryId: categories[p.category],
        brandId: p.brand ? brands[p.brand] : undefined,
        presentation: p.presentation,
        content: p.content,
        purchasePrice: p.purchasePrice,
        salePrice: p.salePrice,
        wholesalePrice: p.wholesalePrice,
        stockMin: p.stockMin,
        supplierId: p.supplierId,
      },
    });

    await prisma.inventory.upsert({
      where: { productId_branchId: { productId: product.id, branchId: branch.id } },
      update: { stock: p.stock },
      create: { productId: product.id, branchId: branch.id, stock: p.stock },
    });
  }

  const customerData = [
    {
      name: "Cliente Genérico",
      documentType: "DNI",
      documentNumber: "00000000",
    },
    {
      name: "Roberto Fernández",
      documentType: "DNI",
      documentNumber: "45678912",
      phone: "51945678912",
    },
    {
      name: "Restaurante El Sillar S.A.C.",
      documentType: "RUC",
      documentNumber: "20678912345",
      phone: "54234567",
    },
  ];

  for (const c of customerData) {
    await prisma.customer.upsert({
      where: { documentNumber: c.documentNumber },
      update: {},
      create: c,
    });
  }

  console.log("Seed completado.");
  console.log("Usuarios demo:");
  console.log("  admin@liquorflow.pe / Admin123!");
  console.log("  supervisor@liquorflow.pe / Supervisor123!");
  console.log("  cajero@liquorflow.pe / Cajero123!");
  console.log("  almacen@liquorflow.pe / Almacen123!");
  console.log(`Admin creado con id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
