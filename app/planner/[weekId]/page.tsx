import { PlannerView } from "@/components/planner/PlannerView";

interface Props {
  params: Promise<{ weekId: string }>;
}

export default async function PlannerPage({ params }: Props) {
  const { weekId } = await params;
  return <PlannerView weekId={weekId} />;
}
