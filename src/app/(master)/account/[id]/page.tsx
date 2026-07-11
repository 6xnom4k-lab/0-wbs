import { AccountDetail } from "@/components/account-detail";

type AccountDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params;

  return <AccountDetail accountId={id} />;
}
