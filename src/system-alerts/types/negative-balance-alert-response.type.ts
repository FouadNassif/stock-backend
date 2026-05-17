export type NegativeBalanceMemberResponse = {
  memberId: string;
  fullName: string;
  email: string;
  walletBalance: number;
};

export type NegativeBalanceAlertResponse = {
  id: string;
  members: NegativeBalanceMemberResponse[];
  totalCount: number;
  checkedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
