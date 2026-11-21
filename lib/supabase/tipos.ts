// Generado con `supabase gen types` desde la base (no editar a mano). Ver package.json → tipos.


export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "actividades": {
                  Row: {
                    "cliente_id": string,"creado_en": string,"empresa_id": string,"fecha": string,"hablo_con_dueno": boolean,"id": string,"miembro_id": string | null,"oportunidad_id": string | null,"resultado": string | null,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cliente_id": string,"creado_en"?: string,"empresa_id": string,"fecha"?: string,"hablo_con_dueno"?: boolean,"id"?: string,"miembro_id"?: string | null,"oportunidad_id"?: string | null,"resultado"?: string | null,"tipo": string
                  }
                  Update: {
                    "cliente_id"?: string,"creado_en"?: string,"empresa_id"?: string,"fecha"?: string,"hablo_con_dueno"?: boolean,"id"?: string,"miembro_id"?: string | null,"oportunidad_id"?: string | null,"resultado"?: string | null,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "actividades_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "actividades_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "actividades_miembro_id_fkey"
      columns: ["miembro_id"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "actividades_oportunidad_id_fkey"
      columns: ["oportunidad_id"]
isOneToOne: false
      referencedRelation: "oportunidades"
      referencedColumns: ["id"]
    }
                  ]
                },"clientes": {
                  Row: {
                    "barrio": string | null,"borrado_en": string | null,"contacto_nombre": string | null,"contacto_whatsapp": string | null,"creado_en": string,"creado_por": string | null,"direccion": string | null,"empresa_id": string,"id": string,"instagram": string | null,"nombre_negocio": string,"notas": string | null,"origen": string,"tipo_negocio": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "barrio"?: string | null,"borrado_en"?: string | null,"contacto_nombre"?: string | null,"contacto_whatsapp"?: string | null,"creado_en"?: string,"creado_por"?: string | null,"direccion"?: string | null,"empresa_id": string,"id"?: string,"instagram"?: string | null,"nombre_negocio": string,"notas"?: string | null,"origen"?: string,"tipo_negocio"?: string | null
                  }
                  Update: {
                    "barrio"?: string | null,"borrado_en"?: string | null,"contacto_nombre"?: string | null,"contacto_whatsapp"?: string | null,"creado_en"?: string,"creado_por"?: string | null,"direccion"?: string | null,"empresa_id"?: string,"id"?: string,"instagram"?: string | null,"nombre_negocio"?: string,"notas"?: string | null,"origen"?: string,"tipo_negocio"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clientes_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clientes_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"cobros": {
                  Row: {
                    "anulado_en": string | null,"cliente_id": string,"concepto": string,"creado_en": string,"descripcion": string | null,"empresa_id": string,"id": string,"oportunidad_id": string | null,"periodo": string | null,"suscripcion_id": string | null,"valor": number,"vence": string
                  }
                  ComputedFields: never
                  Insert: {
                    "anulado_en"?: string | null,"cliente_id": string,"concepto": string,"creado_en"?: string,"descripcion"?: string | null,"empresa_id": string,"id"?: string,"oportunidad_id"?: string | null,"periodo"?: string | null,"suscripcion_id"?: string | null,"valor": number,"vence": string
                  }
                  Update: {
                    "anulado_en"?: string | null,"cliente_id"?: string,"concepto"?: string,"creado_en"?: string,"descripcion"?: string | null,"empresa_id"?: string,"id"?: string,"oportunidad_id"?: string | null,"periodo"?: string | null,"suscripcion_id"?: string | null,"valor"?: number,"vence"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cobros_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobros_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobros_oportunidad_id_fkey"
      columns: ["oportunidad_id"]
isOneToOne: false
      referencedRelation: "oportunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobros_suscripcion_id_fkey"
      columns: ["suscripcion_id"]
isOneToOne: false
      referencedRelation: "suscripciones"
      referencedColumns: ["id"]
    }
                  ]
                },"comisiones": {
                  Row: {
                    "ajustada_en": string | null,"base": number,"creado_en": string,"empresa_id": string,"estado": string,"id": string,"medio_pago": string | null,"miembro_id": string,"oportunidad_id": string,"pagada_en": string | null,"pago_id": string,"parte": number,"porcentaje": number,"regla_id": string,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "ajustada_en"?: string | null,"base": number,"creado_en"?: string,"empresa_id": string,"estado"?: string,"id"?: string,"medio_pago"?: string | null,"miembro_id": string,"oportunidad_id": string,"pagada_en"?: string | null,"pago_id": string,"parte": number,"porcentaje": number,"regla_id": string,"valor": number
                  }
                  Update: {
                    "ajustada_en"?: string | null,"base"?: number,"creado_en"?: string,"empresa_id"?: string,"estado"?: string,"id"?: string,"medio_pago"?: string | null,"miembro_id"?: string,"oportunidad_id"?: string,"pagada_en"?: string | null,"pago_id"?: string,"parte"?: number,"porcentaje"?: number,"regla_id"?: string,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "comisiones_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comisiones_miembro_id_fkey"
      columns: ["miembro_id"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comisiones_oportunidad_id_fkey"
      columns: ["oportunidad_id"]
isOneToOne: false
      referencedRelation: "oportunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comisiones_pago_id_fkey"
      columns: ["pago_id"]
isOneToOne: false
      referencedRelation: "pagos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comisiones_regla_id_fkey"
      columns: ["regla_id"]
isOneToOne: false
      referencedRelation: "reglas_comision"
      referencedColumns: ["id"]
    }
                  ]
                },"empresas": {
                  Row: {
                    "borrado_en": string | null,"creado_en": string,"id": string,"nombre": string,"slug": string,"zona_horaria": string
                  }
                  ComputedFields: never
                  Insert: {
                    "borrado_en"?: string | null,"creado_en"?: string,"id"?: string,"nombre": string,"slug": string,"zona_horaria"?: string
                  }
                  Update: {
                    "borrado_en"?: string | null,"creado_en"?: string,"id"?: string,"nombre"?: string,"slug"?: string,"zona_horaria"?: string
                  }
                  Relationships: [
                    
                  ]
                },"extractos": {
                  Row: {
                    "archivo": string,"banco": string,"empresa_id": string,"filas": number,"id": string,"nuevos": number,"subido_en": string,"subido_por": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archivo": string,"banco": string,"empresa_id": string,"filas"?: number,"id"?: string,"nuevos"?: number,"subido_en"?: string,"subido_por"?: string | null
                  }
                  Update: {
                    "archivo"?: string,"banco"?: string,"empresa_id"?: string,"filas"?: number,"id"?: string,"nuevos"?: number,"subido_en"?: string,"subido_por"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "extractos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "extractos_subido_por_fkey"
      columns: ["subido_por"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    }
                  ]
                },"inventario_items": {
                  Row: {
                    "activo": boolean,"costo_unitario": number | null,"empresa_id": string,"id": string,"nombre": string,"stock_minimo": number,"unidad": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"costo_unitario"?: number | null,"empresa_id": string,"id"?: string,"nombre": string,"stock_minimo"?: number,"unidad"?: string
                  }
                  Update: {
                    "activo"?: boolean,"costo_unitario"?: number | null,"empresa_id"?: string,"id"?: string,"nombre"?: string,"stock_minimo"?: number,"unidad"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventario_items_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"inventario_movimientos": {
                  Row: {
                    "cantidad": number,"cliente_id": string | null,"costo_total": number | null,"creado_en": string,"empresa_id": string,"fecha": string,"id": string,"item_id": string,"nota": string | null,"registrado_por": string | null,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad": number,"cliente_id"?: string | null,"costo_total"?: number | null,"creado_en"?: string,"empresa_id": string,"fecha"?: string,"id"?: string,"item_id": string,"nota"?: string | null,"registrado_por"?: string | null,"tipo": string
                  }
                  Update: {
                    "cantidad"?: number,"cliente_id"?: string | null,"costo_total"?: number | null,"creado_en"?: string,"empresa_id"?: string,"fecha"?: string,"id"?: string,"item_id"?: string,"nota"?: string | null,"registrado_por"?: string | null,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventario_movimientos_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_movimientos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_movimientos_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "inventario_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_movimientos_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "v_inventario"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_movimientos_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    }
                  ]
                },"invitaciones": {
                  Row: {
                    "creado_en": string,"creado_por": string | null,"empresa_id": string,"id": string,"miembro_id": string,"token_hash": string,"usada_en": string | null,"usada_por": string | null,"vence_en": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_en"?: string,"creado_por"?: string | null,"empresa_id": string,"id"?: string,"miembro_id": string,"token_hash": string,"usada_en"?: string | null,"usada_por"?: string | null,"vence_en"?: string
                  }
                  Update: {
                    "creado_en"?: string,"creado_por"?: string | null,"empresa_id"?: string,"id"?: string,"miembro_id"?: string,"token_hash"?: string,"usada_en"?: string | null,"usada_por"?: string | null,"vence_en"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitaciones_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitaciones_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitaciones_miembro_id_fkey"
      columns: ["miembro_id"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    }
                  ]
                },"metas": {
                  Row: {
                    "empresa_id": string,"id": string,"indicador": string,"miembro_id": string | null,"objetivo": number,"producto_id": string | null,"semana": string
                  }
                  ComputedFields: never
                  Insert: {
                    "empresa_id": string,"id"?: string,"indicador": string,"miembro_id"?: string | null,"objetivo": number,"producto_id"?: string | null,"semana": string
                  }
                  Update: {
                    "empresa_id"?: string,"id"?: string,"indicador"?: string,"miembro_id"?: string | null,"objetivo"?: number,"producto_id"?: string | null,"semana"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "metas_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "metas_miembro_id_fkey"
      columns: ["miembro_id"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "metas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"miembros": {
                  Row: {
                    "activo": boolean,"borrado_en": string | null,"correo": string | null,"creado_en": string,"empresa_id": string,"forma_pago": string,"id": string,"nombre": string,"rol": string,"usuario_id": string | null,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"borrado_en"?: string | null,"correo"?: string | null,"creado_en"?: string,"empresa_id": string,"forma_pago"?: string,"id"?: string,"nombre": string,"rol": string,"usuario_id"?: string | null,"whatsapp"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"borrado_en"?: string | null,"correo"?: string | null,"creado_en"?: string,"empresa_id"?: string,"forma_pago"?: string,"id"?: string,"nombre"?: string,"rol"?: string,"usuario_id"?: string | null,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "miembros_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"movimientos_banco": {
                  Row: {
                    "banco": string,"cobro_id": string | null,"creado_en": string,"descripcion": string,"empresa_id": string,"estado": string,"extracto_id": string | null,"fecha": string,"huella": string,"id": string,"pago_id": string | null,"referencia": string | null,"revisado_en": string | null,"revisado_por": string | null,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "banco": string,"cobro_id"?: string | null,"creado_en"?: string,"descripcion"?: string,"empresa_id": string,"estado"?: string,"extracto_id"?: string | null,"fecha": string,"huella": string,"id"?: string,"pago_id"?: string | null,"referencia"?: string | null,"revisado_en"?: string | null,"revisado_por"?: string | null,"valor": number
                  }
                  Update: {
                    "banco"?: string,"cobro_id"?: string | null,"creado_en"?: string,"descripcion"?: string,"empresa_id"?: string,"estado"?: string,"extracto_id"?: string | null,"fecha"?: string,"huella"?: string,"id"?: string,"pago_id"?: string | null,"referencia"?: string | null,"revisado_en"?: string | null,"revisado_por"?: string | null,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "movimientos_banco_cobro_id_fkey"
      columns: ["cobro_id"]
isOneToOne: false
      referencedRelation: "cobros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_banco_cobro_id_fkey"
      columns: ["cobro_id"]
isOneToOne: false
      referencedRelation: "v_cobros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_banco_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_banco_extracto_id_fkey"
      columns: ["extracto_id"]
isOneToOne: false
      referencedRelation: "extractos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_banco_pago_id_fkey"
      columns: ["pago_id"]
isOneToOne: false
      referencedRelation: "pagos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_banco_revisado_por_fkey"
      columns: ["revisado_por"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    }
                  ]
                },"oportunidad_vendedores": {
                  Row: {
                    "atribucion": string,"empresa_id": string,"miembro_id": string,"oportunidad_id": string,"parte": number
                  }
                  ComputedFields: never
                  Insert: {
                    "atribucion": string,"empresa_id": string,"miembro_id": string,"oportunidad_id": string,"parte"?: number
                  }
                  Update: {
                    "atribucion"?: string,"empresa_id"?: string,"miembro_id"?: string,"oportunidad_id"?: string,"parte"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "oportunidad_vendedores_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oportunidad_vendedores_miembro_id_fkey"
      columns: ["miembro_id"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oportunidad_vendedores_oportunidad_id_fkey"
      columns: ["oportunidad_id"]
isOneToOne: false
      referencedRelation: "oportunidades"
      referencedColumns: ["id"]
    }
                  ]
                },"oportunidades": {
                  Row: {
                    "borrado_en": string | null,"cerrada_en": string | null,"cliente_id": string,"creado_en": string,"empresa_id": string,"etapa": string,"id": string,"motivo_perdida": string | null,"plan_id": string | null,"producto_id": string,"proxima_accion": string | null,"proxima_fecha": string | null,"responsable_id": string | null,"valor_estimado": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "borrado_en"?: string | null,"cerrada_en"?: string | null,"cliente_id": string,"creado_en"?: string,"empresa_id": string,"etapa"?: string,"id"?: string,"motivo_perdida"?: string | null,"plan_id"?: string | null,"producto_id": string,"proxima_accion"?: string | null,"proxima_fecha"?: string | null,"responsable_id"?: string | null,"valor_estimado"?: number | null
                  }
                  Update: {
                    "borrado_en"?: string | null,"cerrada_en"?: string | null,"cliente_id"?: string,"creado_en"?: string,"empresa_id"?: string,"etapa"?: string,"id"?: string,"motivo_perdida"?: string | null,"plan_id"?: string | null,"producto_id"?: string,"proxima_accion"?: string | null,"proxima_fecha"?: string | null,"responsable_id"?: string | null,"valor_estimado"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "oportunidades_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oportunidades_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oportunidades_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "planes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oportunidades_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "oportunidades_responsable_id_fkey"
      columns: ["responsable_id"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    }
                  ]
                },"pagos": {
                  Row: {
                    "anulado_en": string | null,"cobro_id": string,"creado_en": string,"empresa_id": string,"fecha": string,"id": string,"medio": string,"referencia": string | null,"registrado_por": string | null,"valor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "anulado_en"?: string | null,"cobro_id": string,"creado_en"?: string,"empresa_id": string,"fecha"?: string,"id"?: string,"medio"?: string,"referencia"?: string | null,"registrado_por"?: string | null,"valor": number
                  }
                  Update: {
                    "anulado_en"?: string | null,"cobro_id"?: string,"creado_en"?: string,"empresa_id"?: string,"fecha"?: string,"id"?: string,"medio"?: string,"referencia"?: string | null,"registrado_por"?: string | null,"valor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "pagos_cobro_id_fkey"
      columns: ["cobro_id"]
isOneToOne: false
      referencedRelation: "cobros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagos_cobro_id_fkey"
      columns: ["cobro_id"]
isOneToOne: false
      referencedRelation: "v_cobros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagos_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    }
                  ]
                },"planes": {
                  Row: {
                    "activo": boolean,"borrado_en": string | null,"creado_en": string,"descripcion": string | null,"empresa_id": string,"id": string,"nombre": string,"precio": number | null,"producto_id": string,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"borrado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"empresa_id": string,"id"?: string,"nombre": string,"precio"?: number | null,"producto_id": string,"tipo": string
                  }
                  Update: {
                    "activo"?: boolean,"borrado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"empresa_id"?: string,"id"?: string,"nombre"?: string,"precio"?: number | null,"producto_id"?: string,"tipo"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "planes_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "planes_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"productos": {
                  Row: {
                    "activo": boolean,"borrado_en": string | null,"creado_en": string,"descripcion": string | null,"empresa_id": string,"id": string,"nombre": string,"orden": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"borrado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"empresa_id": string,"id"?: string,"nombre": string,"orden"?: number
                  }
                  Update: {
                    "activo"?: boolean,"borrado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"empresa_id"?: string,"id"?: string,"nombre"?: string,"orden"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "productos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"recorridos_vistos": {
                  Row: {
                    "completado_en": string,"empresa_id": string,"recorrido": string,"saltado": boolean,"usuario_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "completado_en"?: string,"empresa_id": string,"recorrido": string,"saltado"?: boolean,"usuario_id": string,"version"?: number
                  }
                  Update: {
                    "completado_en"?: string,"empresa_id"?: string,"recorrido"?: string,"saltado"?: boolean,"usuario_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "recorridos_vistos_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"reglas_comision": {
                  Row: {
                    "activa": boolean,"atribucion": string,"concepto": string,"empresa_id": string,"id": string,"meses_max": number | null,"porcentaje": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activa"?: boolean,"atribucion": string,"concepto": string,"empresa_id": string,"id"?: string,"meses_max"?: number | null,"porcentaje": number
                  }
                  Update: {
                    "activa"?: boolean,"atribucion"?: string,"concepto"?: string,"empresa_id"?: string,"id"?: string,"meses_max"?: number | null,"porcentaje"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "reglas_comision_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"suscripciones": {
                  Row: {
                    "cliente_id": string,"creado_en": string,"dia_cobro": number,"empresa_id": string,"estado": string,"id": string,"inicia": string,"oportunidad_id": string | null,"plan_id": string,"precio_mensual": number,"termina": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cliente_id": string,"creado_en"?: string,"dia_cobro"?: number,"empresa_id": string,"estado"?: string,"id"?: string,"inicia": string,"oportunidad_id"?: string | null,"plan_id": string,"precio_mensual": number,"termina"?: string | null
                  }
                  Update: {
                    "cliente_id"?: string,"creado_en"?: string,"dia_cobro"?: number,"empresa_id"?: string,"estado"?: string,"id"?: string,"inicia"?: string,"oportunidad_id"?: string | null,"plan_id"?: string,"precio_mensual"?: number,"termina"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "suscripciones_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "suscripciones_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "suscripciones_oportunidad_id_fkey"
      columns: ["oportunidad_id"]
isOneToOne: false
      referencedRelation: "oportunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "suscripciones_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "planes"
      referencedColumns: ["id"]
    }
                  ]
                },"tareas": {
                  Row: {
                    "asignada_a": string | null,"borrado_en": string | null,"cliente_id": string | null,"creado_en": string,"creado_por": string | null,"descripcion": string | null,"empresa_id": string,"estado": string,"hecha_en": string | null,"id": string,"oportunidad_id": string | null,"tipo": string,"titulo": string,"trabajo_pagado_en": string | null,"valor_trabajo": number | null,"vence": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "asignada_a"?: string | null,"borrado_en"?: string | null,"cliente_id"?: string | null,"creado_en"?: string,"creado_por"?: string | null,"descripcion"?: string | null,"empresa_id": string,"estado"?: string,"hecha_en"?: string | null,"id"?: string,"oportunidad_id"?: string | null,"tipo"?: string,"titulo": string,"trabajo_pagado_en"?: string | null,"valor_trabajo"?: number | null,"vence"?: string | null
                  }
                  Update: {
                    "asignada_a"?: string | null,"borrado_en"?: string | null,"cliente_id"?: string | null,"creado_en"?: string,"creado_por"?: string | null,"descripcion"?: string | null,"empresa_id"?: string,"estado"?: string,"hecha_en"?: string | null,"id"?: string,"oportunidad_id"?: string | null,"tipo"?: string,"titulo"?: string,"trabajo_pagado_en"?: string | null,"valor_trabajo"?: number | null,"vence"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tareas_asignada_a_fkey"
      columns: ["asignada_a"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tareas_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tareas_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tareas_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tareas_oportunidad_id_fkey"
      columns: ["oportunidad_id"]
isOneToOne: false
      referencedRelation: "oportunidades"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_avance_metas": {
                  Row: {
                    "empresa_id": string,"id": string,"indicador": string,"logrado": number | null,"miembro_id": string | null,"objetivo": number,"producto_id": string | null,"semana": string
                  }
                  ComputedFields: never
                  Insert: {
                           "empresa_id"?: string | null,"id"?: string | null,"indicador"?: string | null,"logrado"?: never,"miembro_id"?: string | null,"objetivo"?: number | null,"producto_id"?: string | null,"semana"?: string | null
                         }
                        Update: {
                           "empresa_id"?: string | null,"id"?: string | null,"indicador"?: string | null,"logrado"?: never,"miembro_id"?: string | null,"objetivo"?: number | null,"producto_id"?: string | null,"semana"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "metas_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "metas_miembro_id_fkey"
      columns: ["miembro_id"]
isOneToOne: false
      referencedRelation: "miembros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "metas_producto_id_fkey"
      columns: ["producto_id"]
isOneToOne: false
      referencedRelation: "productos"
      referencedColumns: ["id"]
    }
                  ]
                },"v_cobros": {
                  Row: {
                    "anulado_en": string | null,"cliente_id": string,"concepto": string,"creado_en": string,"descripcion": string | null,"empresa_id": string,"estado": string | null,"id": string,"oportunidad_id": string | null,"pagado": number | null,"periodo": string | null,"saldo": number | null,"suscripcion_id": string | null,"valor": number,"vence": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "cobros_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobros_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobros_oportunidad_id_fkey"
      columns: ["oportunidad_id"]
isOneToOne: false
      referencedRelation: "oportunidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cobros_suscripcion_id_fkey"
      columns: ["suscripcion_id"]
isOneToOne: false
      referencedRelation: "suscripciones"
      referencedColumns: ["id"]
    }
                  ]
                },"v_inventario": {
                  Row: {
                    "activo": boolean,"bajo": boolean | null,"costo_unitario": number | null,"empresa_id": string,"id": string,"nombre": string,"stock": number | null,"stock_minimo": number,"unidad": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "inventario_items_empresa_id_fkey"
      columns: ["empresa_id"]
isOneToOne: false
      referencedRelation: "empresas"
      referencedColumns: ["id"]
    }
                  ]
                },"v_por_pagar_ayudantes": {
                  Row: {
                    "desde": string | null,"empresa_id": string | null,"miembro_id": string | null,"origen": string | null,"origen_id": string | null,"valor": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "aceptar_invitacion":
{ Args: { "p_token": string }; Returns: Json
                           },
"anotar_visita":
{ Args: { "p_cliente_id"?: string,"p_empresa": string,"p_hablo_con_dueno"?: boolean,"p_nombre_negocio"?: string,"p_nota"?: string,"p_producto_id": string,"p_proxima_accion"?: string,"p_proxima_fecha"?: string,"p_resultado"?: string }; Returns: Json
                           },
"confirmar_movimiento":
{ Args: { "p_cobro": string,"p_movimiento": string }; Returns: string
                           },
"crear_invitacion":
{ Args: { "p_miembro": string }; Returns: string
                           },
"es_gerente":
{ Args: { "p_empresa": string }; Returns: boolean
                           },
"es_miembro":
{ Args: { "p_empresa": string }; Returns: boolean
                           },
"ganar_oportunidad":
{ Args: { "p_anticipo"?: number,"p_dia_cobro"?: number,"p_fecha_pago"?: string,"p_inicia"?: string,"p_medio"?: string,"p_oportunidad": string,"p_plan_instalacion": string,"p_plan_mensual"?: string,"p_precio_mensual"?: number,"p_valor": number,"p_vence": string }; Returns: Json
                           },
"generar_mensualidades":
{ Args: { "p_empresa": string,"p_mes": string }; Returns: number
                           },
"guardar_meta":
{ Args: { "p_empresa": string,"p_indicador": string,"p_miembro"?: string,"p_objetivo": number,"p_producto"?: string,"p_semana": string }; Returns: string
                           },
"hash_token":
{ Args: { "p_token": string }; Returns: string
                           },
"mi_miembro":
{ Args: { "p_empresa": string }; Returns: string
                           },
"resumen_semana":
{ Args: { "p_empresa": string,"p_lunes": string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
