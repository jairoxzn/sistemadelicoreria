import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { BusinessConfigForm } from "./business-config-form";
import { CatalogQrCard } from "@/components/configuracion/catalog-qr-card";
import { getCatalogUrl } from "@/lib/site-url";

export default async function ConfiguracionPage() {
  const config = await prisma.businessConfig.findFirst();
  const catalogUrl = getCatalogUrl();
  const qrDataUrl = await QRCode.toDataURL(catalogUrl, {
    width: 480,
    margin: 1,
    color: { dark: "#111111ff", light: "#ffffffff" },
  });

  return (
    <div>
      <PageHeader title="Configuración" description="Datos del negocio y del ticket de venta." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <BusinessConfigForm
          config={
            config
              ? {
                  tradeName: config.tradeName,
                  businessName: config.businessName,
                  ruc: config.ruc,
                  address: config.address,
                  phone: config.phone,
                  whatsapp: config.whatsapp,
                  logoUrl: config.logoUrl,
                  bannerUrl: config.bannerUrl,
                  igvPercent: Number(config.igvPercent),
                  ticketFooter: config.ticketFooter,
                }
              : null
          }
        />
        <CatalogQrCard catalogUrl={catalogUrl} qrDataUrl={qrDataUrl} />
      </div>
    </div>
  );
}
