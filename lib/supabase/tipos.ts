// TEMPORAL (Fase 0): tipos escritos a mano para las tablas que usa la app hoy.
// Se reemplaza por los generados con `pnpm tipos` (supabase gen types) en cuanto haya base local
// o el proyecto de la nube esté vinculado. Ver BITACORA.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          zona_horaria: string;
          creado_en: string;
          borrado_en: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          slug: string;
          zona_horaria?: string;
          creado_en?: string;
          borrado_en?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["empresas"]["Insert"]>;
        Relationships: [];
      };
      miembros: {
        Row: {
          id: string;
          empresa_id: string;
          usuario_id: string | null;
          nombre: string;
          whatsapp: string | null;
          rol: "gerente" | "ayudante";
          forma_pago: "fijo" | "comision" | "por_trabajo" | "ninguno";
          activo: boolean;
          creado_en: string;
          borrado_en: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          usuario_id?: string | null;
          nombre: string;
          whatsapp?: string | null;
          rol: "gerente" | "ayudante";
          forma_pago?: "fijo" | "comision" | "por_trabajo" | "ninguno";
          activo?: boolean;
          creado_en?: string;
          borrado_en?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["miembros"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "miembros_empresa_id_fkey";
            columns: ["empresa_id"];
            isOneToOne: false;
            referencedRelation: "empresas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      es_gerente: { Args: { p_empresa: string }; Returns: boolean };
      es_miembro: { Args: { p_empresa: string }; Returns: boolean };
      mi_miembro: { Args: { p_empresa: string }; Returns: string };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
