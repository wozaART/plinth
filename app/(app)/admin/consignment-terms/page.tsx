import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsignmentTermsResponses } from "@/lib/supabase/queries";
import { PLATFORM_ADMIN_EMAIL } from "@/lib/platform-admin";
import ConsignmentTermsAdmin from "@/components/admin/ConsignmentTermsAdmin";

export default async function ConsignmentTermsAdminPage() {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== PLATFORM_ADMIN_EMAIL) redirect("/signin");

  const responses = await getConsignmentTermsResponses(supabase);

  return <ConsignmentTermsAdmin initialResponses={responses} />;
}
