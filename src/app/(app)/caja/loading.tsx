import { ListPageSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return <ListPageSkeleton statCards={4} rows={4} cols={4} />;
}
