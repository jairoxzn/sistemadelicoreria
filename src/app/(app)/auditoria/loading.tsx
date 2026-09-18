import { ListPageSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return <ListPageSkeleton rows={10} cols={5} />;
}
