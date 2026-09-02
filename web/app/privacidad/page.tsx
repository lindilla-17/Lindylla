import { Page, PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-static";

export const metadata = {
  title: "Política de privacidad · Lindilla",
};

export default function PrivacidadPage() {
  return (
    <Page>
      <PageHeader
        title="Política de privacidad"
        subtitle="Lindilla · Gestión — herramienta interna de Lindilla S.L."
      />
      <Panel title="Uso de la aplicación">
        <div className="flex flex-col gap-4 text-[14px] leading-relaxed max-w-[700px]">
          <p>
            Esta aplicación es una herramienta de gestión interna de Lindilla S.L., de uso
            exclusivo de su titular, para llevar la contabilidad y facturación de sus dos
            actividades (gorros quirúrgicos y la actividad sanitaria Centroveo).
          </p>
          <p>
            La aplicación se conecta con la cuenta de Google Drive de su titular únicamente
            para guardar automáticamente copia de las facturas y justificantes de gasto que se
            generan desde la propia aplicación, en las carpetas de contabilidad ya existentes en
            esa cuenta. No se comparte, vende ni cede ningún dato a terceros bajo ninguna
            circunstancia.
          </p>
          <p>
            Los datos de negocio (facturas, gastos, clientes) se almacenan en una base de datos
            privada y no son accesibles públicamente.
          </p>
          <p>Contacto: info@lindilla.com</p>
        </div>
      </Panel>
    </Page>
  );
}
