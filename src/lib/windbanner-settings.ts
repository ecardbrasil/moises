import { getSupabase } from "./supabase";
import type { WindbannerSettings } from "./windbanner-types";

interface SettingsRow {
  id: number;
  total_disponivel: number;
  updated_at: string;
}

function rowToSettings(row: SettingsRow): WindbannerSettings {
  return { totalDisponivel: row.total_disponivel, updatedAt: row.updated_at };
}

export async function getSettings(): Promise<WindbannerSettings> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("windbanner_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return rowToSettings(data as SettingsRow);
}

export async function updateSettings(input: { totalDisponivel: number }): Promise<WindbannerSettings> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("windbanner_settings")
    .update({ total_disponivel: input.totalDisponivel, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("*")
    .single();
  if (error) throw error;
  return rowToSettings(data as SettingsRow);
}
