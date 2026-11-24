import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AtSign, History, MapPin, Phone, UserRound } from "lucide-react";
import { SinEmpresa } from "@/components/app/SinEmpresa";
import { AnotarVisita } from "@/components/dominio/AnotarVisita";
import { BotonWhatsapp } from "@/components/dominio/BotonWhatsapp";
import { TarjetaOportunidad } from "@/components/dominio/TarjetaOportunidad";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Vacio } from "@/components/ui/Vacio";
import {
  actividadesDeCliente,
  clienteFicha,
  clientesCortos,
  miembrosActivos,
  oportunidadesDeCliente,
  productosActivos,
} from "@/lib/datos";
import { mostrarWhatsapp } from "@/lib/dominio/whatsapp";
import { cobrosLista, planesActivos } from "@/lib/datos-cobros";
import { Dinero } from "@/components/ui/Dinero";
import { obtenerContexto } from "@/lib/sesion";
import { EditarCliente } from "./EditarCliente";
import { Vendedores } from "./Vendedores";
import { UbicacionNegocio } from "./UbicacionNegocio";

export const metadata: Metadata = { title: "Cliente" };

const fechaHora = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default async function FichaCliente({ params }: PageProps<"/clientes/[id]">) {
  const ctx = await obtenerContexto();
  if (!ctx) return <SinEmpresa />;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const cliente = await clienteFicha(ctx.empresa.id, id);
  if (!cliente) notFound(); // no existe o RLS no lo deja ver

  const esGerente = ctx.rol === "gerente";
  const [ventas, actividades, productos, cortos, miembros, planes, cobros] = await Promise.all([
    oportunidadesDeCliente(ctx.empresa.id, id),
    actividadesDeCliente(ctx.empresa.id, id),
    productosActivos(ctx.empresa.id),
    clientesCortos(ctx.empresa.id),
    esGerente ? miembrosActivos(ctx.empresa.id) : Promise.resolve([]),
    esGerente ? planesActivos(ctx.empresa.id) : Promise.resolve([]),
    esGerente ? cobrosLista(ctx.empresa.id, id) : Promise.resolve([]),
  ]);
  // Saldo: solo el gerente (una ayudante no ve montos de cobros, por RLS y aquí).
  const saldo = cobros.reduce((s, c) => s + c.saldo, 0);
  const vencido = cobros.filter((c) => c.estado === "vencido").reduce((s, c) => s + c.saldo, 0);
  const puedeEditar = esGerente || cliente.creado_por === ctx.miembroId;
  const quien = ctx.nombre.split(" ")[0]!;
  const whatsapp = mostrarWhatsapp(cliente.contacto_whatsapp);

  return (
    <div className="flex flex-col gap-5">
      <Link href="/clientes" className="inline-flex min-h-11 items-center gap-1 self-start font-semibold text-tinta-suave">
        <ArrowLeft size={20} strokeWidth={1.75} aria-hidden /> Clientes
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-titulo text-titulo leading-tight sm:text-grande">{cliente.nombre_negocio}</h1>
          <p className="text-tinta-suave">{[cliente.tipo_negocio, cliente.barrio].filter(Boolean).join(" · ") || "Negocio"}</p>
        </div>
        {puedeEditar && <EditarCliente cliente={cliente} />}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Tarjeta titulo="Datos">
          <dl className="flex flex-col gap-3">
            <Dato icono={UserRound} etiqueta="Dueño o contacto" valor={cliente.contacto_nombre} />
            <Dato icono={Phone} etiqueta="WhatsApp" valor={whatsapp} />
            <Dato icono={MapPin} etiqueta="Dirección" valor={[cliente.direccion, cliente.barrio].filter(Boolean).join(", ") || null} />
            <Dato icono={AtSign} etiqueta="Instagram" valor={cliente.instagram ? `@${cliente.instagram}` : null} />
          </dl>
          {cliente.notas && <p className="mt-3 whitespace-pre-line border-t border-borde pt-3">{cliente.notas}</p>}
          <UbicacionNegocio clienteId={cliente.id} lat={cliente.lat} lng={cliente.lng} fuente={cliente.ubicacion_fuente} />
          {esGerente && cobros.length > 0 && (
            <div className="mt-3 border-t border-borde pt-3" data-testid="saldo-cliente">
              <p className="text-chico text-tinta-suave">Saldo por cobrar</p>
              <Dinero pesos={saldo} tamano="grande" />
              {vencido > 0 && (
                <p className="font-semibold text-error">
                  Vencido: <Dinero pesos={vencido} className="!text-base" />
                </p>
              )}
            </div>
          )}
          {ventas[0] && (
            <div className="mt-4">
              <BotonWhatsapp
                whatsapp={cliente.contacto_whatsapp}
                contacto={cliente.contacto_nombre}
                negocio={cliente.nombre_negocio}
                producto={ventas[0].producto.nombre}
                quien={quien}
              />
            </div>
          )}
        </Tarjeta>

        <section className="flex flex-col gap-3" aria-labelledby="ventas-cliente">
          <h2 id="ventas-cliente" className="text-medio font-bold">
            Ventas
          </h2>
          {ventas.length === 0 ? (
            <p className="text-tinta-suave">Sin ventas todavía.</p>
          ) : (
            ventas.map((o) => (
              <div key={o.id} className="flex flex-col gap-2">
                <TarjetaOportunidad o={o} quien={quien} mostrarCliente={false} gerencia={esGerente ? { planes, miembros } : undefined} />
                {esGerente && <Vendedores oportunidadId={o.id} vendedores={o.vendedores} miembros={miembros} />}
              </div>
            ))
          )}
        </section>
      </div>

      <Tarjeta titulo="Historial">
        {actividades.length === 0 ? (
          <Vacio icono={History} titulo="Sin actividades" />
        ) : (
          <ol className="flex flex-col divide-y divide-borde">
            {actividades.map((a) => (
              <li key={a.id} className="py-3">
                <p className="font-semibold">
                  {a.tipo === "visita" ? "Visita" : a.tipo}
                  {a.producto && ` · ${a.producto}`}
                  {a.hablo_con_dueno && <span className="text-bien"> · habló con el dueño</span>}
                </p>
                {a.resultado && <p>{a.resultado}</p>}
                <p className="text-chico text-tinta-suave">
                  {fechaHora.format(new Date(a.fecha))}
                  {a.miembro && ` · ${a.miembro}`}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Tarjeta>

      <AnotarVisita
        clientes={cortos}
        productos={productos}
        clienteFijo={{ id: cliente.id, nombre: cliente.nombre_negocio }}
      />
    </div>
  );
}

function Dato({
  icono: Icono,
  etiqueta,
  valor,
}: {
  icono: typeof Phone;
  etiqueta: string;
  valor: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icono size={20} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-tinta-suave" />
      <div>
        <dt className="text-chico text-tinta-suave">{etiqueta}</dt>
        <dd className={valor ? "font-semibold" : "text-tinta-suave"}>{valor ?? "—"}</dd>
      </div>
    </div>
  );
}
