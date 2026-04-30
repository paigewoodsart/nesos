import { redirect } from "next/navigation";
import { getWeekId } from "@/lib/dates";

export default function Home() {
  const weekId = getWeekId(new Date());
  redirect(`/planner/${weekId}`);
}
