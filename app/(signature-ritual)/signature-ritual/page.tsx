import { redirect } from "next/navigation";
import { ritualPath } from "@/components/signature-ritual/routes";

export default function SignatureRitualIndexPage() {
  redirect(ritualPath("idle"));
}
