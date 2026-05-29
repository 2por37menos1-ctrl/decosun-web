import { supabase } from "./supabase";

export async function createProjectHistory({
  projectId,
  type,
  description,
  createdBy = "sistema",
  metadata = {},
}) {
  if (!projectId) return false;

  try {
    const { error } = await supabase
      .from("project_history")
      .insert({
        project_id: projectId,
        event_type: type,
        description,
        created_by: createdBy,
        metadata,
      });

    if (error) {
      console.error(
        "[PROJECT HISTORY ERROR]",
        error
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[PROJECT HISTORY EXCEPTION]",
      error
    );
    return false;
  }
}