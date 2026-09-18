import { ListPageSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return <ListPageSkeleton statCards={3} rows={8} cols={6} />;
}
