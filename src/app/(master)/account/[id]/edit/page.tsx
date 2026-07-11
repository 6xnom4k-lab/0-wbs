import { AccountEdit } from "@/components/account-edit";

type AccountEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountEditPage({ params }: AccountEditPageProps) {
  const { id } = await params;

  return <AccountEdit accountId={id} />;
}
