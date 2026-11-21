// WhatsApp sin API (D-006): enlaces wa.me con el mensaje ya escrito; se envía a mano.

/** Deja solo dígitos con el 57 de Colombia adelante. null si no parece un celular. */
export function normalizarWhatsapp(texto: string | null | undefined): string | null {
  if (!texto) return null;
  let d = texto.replace(/\D/g, "");
  if (d.startsWith("0057")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("3")) d = `57${d}`;
  return /^573\d{9}$/.test(d) ? d : null;
}

/** Enlace que abre WhatsApp con el mensaje. Sin número abre WhatsApp para elegir el chat. */
export function enlaceWhatsapp(numero: string | null | undefined, mensaje: string): string {
  const n = normalizarWhatsapp(numero);
  const texto = encodeURIComponent(mensaje);
  return n ? `https://wa.me/${n}?text=${texto}` : `https://wa.me/?text=${texto}`;
}

/** "320 487 1882" para mostrar. */
export function mostrarWhatsapp(numero: string | null | undefined): string | null {
  const n = normalizarWhatsapp(numero);
  if (!n) return null;
  const local = n.slice(2);
  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

type Seguimiento = { contacto?: string | null; negocio: string; producto: string; quien: string };

/** Plantilla del seguimiento (editable antes de abrir WhatsApp). */
export function mensajeSeguimiento({ contacto, negocio, producto, quien }: Seguimiento): string {
  const saludo = contacto ? `Hola ${contacto.split(" ")[0]}` : "Hola";
  return `${saludo}, te habla ${quien} de Mamut Herd. Te escribo por lo que hablamos de ${producto} para ${negocio}. ¿Cuándo te queda bien que pase?`;
}

type Recordatorio = { contacto?: string | null; negocio: string; concepto: string; saldo: string; vence: string; quien: string };

/** Recordatorio de cobro (editable antes de abrir WhatsApp). */
export function mensajeCobro({ contacto, negocio, concepto, saldo, vence, quien }: Recordatorio): string {
  const saludo = contacto ? `Hola ${contacto.split(" ")[0]}` : "Hola";
  return `${saludo}, te habla ${quien} de Mamut Herd. Te recuerdo el pago de ${concepto.toLowerCase()} de ${negocio}: ${saldo}, con fecha ${vence}. Puedes pagar por Nequi o Bancolombia. ¡Gracias!`;
}
