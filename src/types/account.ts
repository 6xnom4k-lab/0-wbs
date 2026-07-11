export type Account = {
  id: string;
  displayName: string;
  email: string;
  department: string;
  role: string;
  permission: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountInput = Pick<
  Account,
  "displayName" | "email" | "department" | "role"
>;
