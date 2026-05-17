import 'dotenv/config';

import * as bcrypt from 'bcrypt';
import mongoose, { Model, Types } from 'mongoose';

import { Admin, AdminRole, AdminSchema } from '../admin/schemas/admin.schema';
import {
  IdentityStatus,
  Member,
  MemberSchema,
} from '../members/schemas/member.schema';
import {
  Referral,
  ReferralSchema,
  ReferralStatus,
} from '../referrals/schemas/referral.schema';
import {
  PriceAlert,
  PriceAlertDirection,
  PriceAlertSchema,
} from '../alerts/schemas/price-alert.schema';
import {
  Order,
  OrderSchema,
  OrderStatus,
  OrderType,
} from '../orders/schemas/order.schema';
import {
  Position,
  PositionSchema,
  PositionStatus,
} from '../orders/schemas/position.schema';
import {
  PriceHistory,
  PriceHistorySchema,
} from '../stocks/schemas/price-history.schema';
import { Stock, StockSchema } from '../stocks/schemas/stock.schema';
import {
  NegativeBalanceAlert,
  NegativeBalanceAlertSchema,
} from '../system-alerts/schemas/negative-balance-alert.schema';
import {
  StalePendingWithdrawalAlert,
  StalePendingWithdrawalAlertSchema,
} from '../system-alerts/schemas/stale-pending-withdrawal-alert.schema';
import {
  Transaction,
  TransactionSchema,
} from '../wallet/schemas/transaction.schema';
import {
  TransactionStatus,
  TransactionType,
} from '../wallet/types/transaction.type';

type SeedModels = {
  adminModel: Model<Admin>;
  memberModel: Model<Member>;
  referralModel: Model<Referral>;
  stockModel: Model<Stock>;
  priceHistoryModel: Model<PriceHistory>;
  transactionModel: Model<Transaction>;
  orderModel: Model<Order>;
  positionModel: Model<Position>;
  priceAlertModel: Model<PriceAlert>;
  negativeBalanceAlertModel: Model<NegativeBalanceAlert>;
  stalePendingWithdrawalAlertModel: Model<StalePendingWithdrawalAlert>;
};

const seedEmails = [
  'admin.seed@stockmarket.com',
  'analyst.seed@stockmarket.com',
  'support.seed@stockmarket.com',
  'adam.seed@example.com',
  'sara.seed@example.com',
  'unverified.seed@example.com',
  'suspended.seed@example.com',
  'negative.seed@example.com',
];

const seedTickers = ['AAPL', 'MSFT', 'TSLA', 'JPM', 'PFE', 'XOM', 'OLDX'];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function getMongoUri(): string {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is missing from environment variables');
  }

  return uri;
}

async function cleanupSeedData(models: SeedModels): Promise<void> {
  const seedMembers = await models.memberModel
    .find({ email: { $in: seedEmails } })
    .select('_id')
    .exec();

  const seedMemberIds = seedMembers.map((member) => member._id);

  const seedStocks = await models.stockModel
    .find({ ticker: { $in: seedTickers } })
    .select('_id')
    .exec();

  const seedStockIds = seedStocks.map((stock) => stock._id);

  await Promise.all([
    models.adminModel.deleteMany({ email: { $in: seedEmails } }).exec(),

    models.referralModel
      .deleteMany({
        $or: [
          { referrerId: { $in: seedMemberIds } },
          { referredMemberId: { $in: seedMemberIds } },
          { referralCode: /^SEED-/ },
        ],
      })
      .exec(),

    models.priceAlertModel
      .deleteMany({
        $or: [
          { memberId: { $in: seedMemberIds } },
          { stockId: { $in: seedStockIds } },
        ],
      })
      .exec(),

    models.orderModel
      .deleteMany({
        $or: [
          { memberId: { $in: seedMemberIds } },
          { stockId: { $in: seedStockIds } },
        ],
      })
      .exec(),

    models.positionModel
      .deleteMany({
        $or: [
          { memberId: { $in: seedMemberIds } },
          { stockId: { $in: seedStockIds } },
        ],
      })
      .exec(),

    models.transactionModel
      .deleteMany({
        $or: [{ memberId: { $in: seedMemberIds } }, { referenceId: /^SEED-/ }],
      })
      .exec(),

    models.priceHistoryModel
      .deleteMany({ stockId: { $in: seedStockIds } })
      .exec(),

    models.stockModel.deleteMany({ ticker: { $in: seedTickers } }).exec(),

    models.negativeBalanceAlertModel
      .deleteMany({
        'members.memberId': { $in: seedMemberIds },
      })
      .exec(),

    models.stalePendingWithdrawalAlertModel
      .deleteMany({
        'withdrawals.memberId': { $in: seedMemberIds },
      })
      .exec(),
  ]);
}

async function createAdmins(models: SeedModels): Promise<void> {
  const adminPassword = await bcrypt.hash('Admin@12345', 10);
  const analystPassword = await bcrypt.hash('Analyst@12345', 10);
  const supportPassword = await bcrypt.hash('Support@12345', 10);

  const admin = await models.adminModel.create({
    fullName: 'Omar Seed Admin',
    email: 'admin.seed@stockmarket.com',
    password: adminPassword,
    role: AdminRole.Admin,
    isActive: true,
    mustChangePassword: false,
  });

  await models.adminModel.create({
    fullName: 'Leila Seed Analyst',
    email: 'analyst.seed@stockmarket.com',
    password: analystPassword,
    role: AdminRole.Analyst,
    isActive: true,
    mustChangePassword: false,
    createdBy: admin._id,
  });

  await models.adminModel.create({
    fullName: 'Sam Seed Support',
    email: 'support.seed@stockmarket.com',
    password: supportPassword,
    role: AdminRole.Support,
    isActive: true,
    mustChangePassword: false,
    createdBy: admin._id,
  });
}

async function createMembers(models: SeedModels): Promise<{
  adamId: Types.ObjectId;
  saraId: Types.ObjectId;
  unverifiedId: Types.ObjectId;
  suspendedId: Types.ObjectId;
  negativeId: Types.ObjectId;
}> {
  const adamPassword = await bcrypt.hash('Adam@12345', 10);
  const saraPassword = await bcrypt.hash('Sara@12345', 10);
  const suspendedPassword = await bcrypt.hash('Suspended@12345', 10);
  const negativePassword = await bcrypt.hash('Negative@12345', 10);

  const adam = await models.memberModel.create({
    fullName: 'Adam Seed Investor',
    email: 'adam.seed@example.com',
    nationalId: 'SEED-NID-001',
    dateOfBirth: new Date('1995-01-15'),
    password: adamPassword,
    emailVerified: true,
    referralCode: 'SEED-ADAM',
    identityStatus: IdentityStatus.Approved,
    isActive: true,
    walletBalance: 5000,
    lastDepositAt: daysAgo(3),
  });

  const sara = await models.memberModel.create({
    fullName: 'Sara Seed Investor',
    email: 'sara.seed@example.com',
    nationalId: 'SEED-NID-002',
    dateOfBirth: new Date('1997-04-20'),
    password: saraPassword,
    emailVerified: true,
    referralCode: 'SEED-SARA',
    identityStatus: IdentityStatus.Approved,
    isActive: true,
    walletBalance: 100,
    lastDepositAt: daysAgo(4),
  });

  const unverified = await models.memberModel.create({
    fullName: 'Unverified Seed Member',
    email: 'unverified.seed@example.com',
    nationalId: 'SEED-NID-003',
    dateOfBirth: new Date('1998-08-12'),
    emailVerified: false,
    referralCode: 'SEED-UNVERIFIED',
    identityStatus: IdentityStatus.Pending,
    isActive: true,
    walletBalance: 0,
  });

  const suspended = await models.memberModel.create({
    fullName: 'Suspended Seed Member',
    email: 'suspended.seed@example.com',
    nationalId: 'SEED-NID-004',
    dateOfBirth: new Date('1992-03-10'),
    password: suspendedPassword,
    emailVerified: true,
    referralCode: 'SEED-SUSPENDED',
    identityStatus: IdentityStatus.Approved,
    isActive: false,
    walletBalance: 300,
    lastDepositAt: daysAgo(5),
  });

  const negative = await models.memberModel.create({
    fullName: 'Negative Balance Seed Member',
    email: 'negative.seed@example.com',
    nationalId: 'SEED-NID-005',
    dateOfBirth: new Date('1990-11-05'),
    password: negativePassword,
    emailVerified: true,
    referralCode: 'SEED-NEGATIVE',
    identityStatus: IdentityStatus.Approved,
    isActive: true,
    walletBalance: 10,
    lastDepositAt: daysAgo(6),
  });

  await models.memberModel.collection.updateOne(
    { _id: negative._id },
    { $set: { walletBalance: -50 } },
  );

  return {
    adamId: adam._id,
    saraId: sara._id,
    unverifiedId: unverified._id,
    suspendedId: suspended._id,
    negativeId: negative._id,
  };
}

async function createStocks(
  models: SeedModels,
): Promise<Record<string, Types.ObjectId>> {
  const stocks = await models.stockModel.insertMany([
    {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      sector: 'Technology',
      currentPrice: 180,
      description: 'Apple Inc. designs and manufactures consumer electronics.',
      isListed: true,
    },
    {
      ticker: 'MSFT',
      companyName: 'Microsoft Corporation',
      sector: 'Technology',
      currentPrice: 420,
      description: 'Microsoft develops software, cloud, and AI solutions.',
      isListed: true,
    },
    {
      ticker: 'TSLA',
      companyName: 'Tesla Inc.',
      sector: 'Automotive',
      currentPrice: 250,
      description: 'Tesla builds electric vehicles and energy products.',
      isListed: true,
    },
    {
      ticker: 'JPM',
      companyName: 'JPMorgan Chase & Co.',
      sector: 'Finance',
      currentPrice: 200,
      description: 'JPMorgan Chase provides financial and banking services.',
      isListed: true,
    },
    {
      ticker: 'PFE',
      companyName: 'Pfizer Inc.',
      sector: 'Healthcare',
      currentPrice: 35,
      description: 'Pfizer is a global pharmaceutical company.',
      isListed: true,
    },
    {
      ticker: 'XOM',
      companyName: 'Exxon Mobil Corporation',
      sector: 'Energy',
      currentPrice: 115,
      description: 'Exxon Mobil operates in oil, gas, and energy.',
      isListed: true,
    },
    {
      ticker: 'OLDX',
      companyName: 'Old Exchange Corp.',
      sector: 'Finance',
      currentPrice: 12,
      description: 'Delisted seed stock for testing rejected buy orders.',
      isListed: false,
    },
  ]);

  await models.priceHistoryModel.insertMany(
    stocks.flatMap((stock) => [
      {
        stockId: stock._id,
        price: Math.max(stock.currentPrice - 10, 1),
        recordedAt: daysAgo(7),
      },
      {
        stockId: stock._id,
        price: Math.max(stock.currentPrice - 5, 1),
        recordedAt: daysAgo(3),
      },
      {
        stockId: stock._id,
        price: stock.currentPrice,
        recordedAt: new Date(),
      },
    ]),
  );

  return Object.fromEntries(stocks.map((stock) => [stock.ticker, stock._id]));
}

async function createPositionsOrdersTransactions(
  models: SeedModels,
  memberIds: {
    adamId: Types.ObjectId;
    saraId: Types.ObjectId;
    negativeId: Types.ObjectId;
  },
  stockIds: Record<string, Types.ObjectId>,
): Promise<{
  pendingWithdrawalId: Types.ObjectId;
  staleWithdrawalId: Types.ObjectId;
}> {
  const adamAaplPosition = await models.positionModel.create({
    memberId: memberIds.adamId,
    stockId: stockIds.AAPL,
    sharesHeld: 8,
    avgPurchasePrice: 150,
    status: PositionStatus.Open,
    openedAt: daysAgo(10),
  });

  const adamMsftPosition = await models.positionModel.create({
    memberId: memberIds.adamId,
    stockId: stockIds.MSFT,
    sharesHeld: 2,
    avgPurchasePrice: 380,
    status: PositionStatus.Open,
    openedAt: daysAgo(8),
  });

  const saraTslaPosition = await models.positionModel.create({
    memberId: memberIds.saraId,
    stockId: stockIds.TSLA,
    sharesHeld: 1,
    avgPurchasePrice: 230,
    status: PositionStatus.Open,
    openedAt: daysAgo(5),
  });

  const adamBuyAaplOrderId = new Types.ObjectId();
  const adamSellAaplOrderId = new Types.ObjectId();
  const adamBuyMsftOrderId = new Types.ObjectId();
  const saraBuyTslaOrderId = new Types.ObjectId();

  await models.orderModel.collection.insertMany([
    {
      _id: adamBuyAaplOrderId,
      memberId: memberIds.adamId,
      stockId: stockIds.AAPL,
      positionId: adamAaplPosition._id,
      type: OrderType.Buy,
      quantity: 10,
      priceAtExecution: 150,
      totalAmount: 1500,
      status: OrderStatus.Completed,
      realizedProfitLoss: 0,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      _id: adamSellAaplOrderId,
      memberId: memberIds.adamId,
      stockId: stockIds.AAPL,
      positionId: adamAaplPosition._id,
      type: OrderType.Sell,
      quantity: 2,
      priceAtExecution: 175,
      totalAmount: 350,
      status: OrderStatus.Completed,
      realizedProfitLoss: 50,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      _id: adamBuyMsftOrderId,
      memberId: memberIds.adamId,
      stockId: stockIds.MSFT,
      positionId: adamMsftPosition._id,
      type: OrderType.Buy,
      quantity: 2,
      priceAtExecution: 380,
      totalAmount: 760,
      status: OrderStatus.Completed,
      realizedProfitLoss: 0,
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8),
    },
    {
      _id: saraBuyTslaOrderId,
      memberId: memberIds.saraId,
      stockId: stockIds.TSLA,
      positionId: saraTslaPosition._id,
      type: OrderType.Buy,
      quantity: 1,
      priceAtExecution: 230,
      totalAmount: 230,
      status: OrderStatus.Completed,
      realizedProfitLoss: 0,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
  ]);

  await models.transactionModel.collection.insertMany([
    {
      memberId: memberIds.adamId,
      type: TransactionType.Deposit,
      amount: 7000,
      status: TransactionStatus.Completed,
      referenceId: 'SEED-DEP-ADAM-001',
      notes: 'Seed completed deposit',
      balanceBefore: 0,
      balanceAfter: 7000,
      processedAt: daysAgo(3),
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      memberId: memberIds.adamId,
      type: TransactionType.Buy,
      amount: 1500,
      status: TransactionStatus.Completed,
      referenceId: adamBuyAaplOrderId.toString(),
      notes: 'Seed buy AAPL',
      balanceBefore: 7000,
      balanceAfter: 5500,
      processedAt: daysAgo(10),
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    },
    {
      memberId: memberIds.adamId,
      type: TransactionType.Sell,
      amount: 350,
      status: TransactionStatus.Completed,
      referenceId: adamSellAaplOrderId.toString(),
      notes: 'Seed sell AAPL',
      balanceBefore: 4650,
      balanceAfter: 5000,
      processedAt: daysAgo(2),
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    {
      memberId: memberIds.adamId,
      type: TransactionType.Buy,
      amount: 760,
      status: TransactionStatus.Completed,
      referenceId: adamBuyMsftOrderId.toString(),
      notes: 'Seed buy MSFT',
      balanceBefore: 5500,
      balanceAfter: 4740,
      processedAt: daysAgo(8),
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8),
    },
    {
      memberId: memberIds.saraId,
      type: TransactionType.Buy,
      amount: 230,
      status: TransactionStatus.Completed,
      referenceId: saraBuyTslaOrderId.toString(),
      notes: 'Seed buy TSLA',
      balanceBefore: 330,
      balanceAfter: 100,
      processedAt: daysAgo(5),
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      memberId: memberIds.negativeId,
      type: TransactionType.Withdrawal,
      amount: 60,
      status: TransactionStatus.Completed,
      referenceId: 'SEED-WD-NEGATIVE-001',
      notes: 'Seed data integrity negative-balance example',
      balanceBefore: 10,
      balanceAfter: -50,
      processedAt: daysAgo(1),
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ]);

  const pendingWithdrawalId = new Types.ObjectId();
  const staleWithdrawalId = new Types.ObjectId();

  await models.transactionModel.collection.insertMany([
    {
      _id: pendingWithdrawalId,
      memberId: memberIds.adamId,
      type: TransactionType.Withdrawal,
      amount: 100,
      status: TransactionStatus.Pending,
      referenceId: 'SEED-WD-PENDING-001',
      notes: 'Seed pending withdrawal for approve/reject testing',
      balanceBefore: 5000,
      balanceAfter: 5000,
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
    },
    {
      _id: staleWithdrawalId,
      memberId: memberIds.adamId,
      type: TransactionType.Withdrawal,
      amount: 250,
      status: TransactionStatus.Pending,
      referenceId: 'SEED-WD-STALE-001',
      notes: 'Seed stale pending withdrawal older than 24 hours',
      balanceBefore: 5000,
      balanceAfter: 5000,
      createdAt: hoursAgo(30),
      updatedAt: hoursAgo(30),
    },
  ]);

  return {
    pendingWithdrawalId,
    staleWithdrawalId,
  };
}

async function createReferralsAndAlerts(
  models: SeedModels,
  memberIds: {
    adamId: Types.ObjectId;
    saraId: Types.ObjectId;
    unverifiedId: Types.ObjectId;
  },
  stockIds: Record<string, Types.ObjectId>,
): Promise<void> {
  await models.referralModel.create({
    referrerId: memberIds.adamId,
    referredMemberId: memberIds.saraId,
    referralCode: 'SEED-ADAM',
    status: ReferralStatus.EmailVerified,
    registeredAt: daysAgo(4),
    emailVerifiedAt: daysAgo(4),
  });

  await models.referralModel.create({
    referrerId: memberIds.adamId,
    referredMemberId: memberIds.unverifiedId,
    referralCode: 'SEED-ADAM',
    status: ReferralStatus.Registered,
    registeredAt: daysAgo(1),
  });

  await models.priceAlertModel.create({
    memberId: memberIds.adamId,
    stockId: stockIds.AAPL,
    targetPrice: 200,
    direction: PriceAlertDirection.Above,
    triggered: false,
  });

  await models.priceAlertModel.create({
    memberId: memberIds.adamId,
    stockId: stockIds.TSLA,
    targetPrice: 220,
    direction: PriceAlertDirection.Below,
    triggered: false,
  });

  await models.priceAlertModel.create({
    memberId: memberIds.adamId,
    stockId: stockIds.MSFT,
    targetPrice: 400,
    direction: PriceAlertDirection.Above,
    triggered: true,
    triggeredAt: daysAgo(1),
  });
}

async function createSystemAlertSnapshots(
  models: SeedModels,
  memberIds: {
    negativeId: Types.ObjectId;
    adamId: Types.ObjectId;
  },
  staleWithdrawalId: Types.ObjectId,
): Promise<void> {
  await models.negativeBalanceAlertModel.create({
    members: [
      {
        memberId: memberIds.negativeId,
        fullName: 'Negative Balance Seed Member',
        email: 'negative.seed@example.com',
        walletBalance: -50,
      },
    ],
    totalCount: 1,
    checkedAt: new Date(),
  });

  await models.stalePendingWithdrawalAlertModel.create({
    withdrawals: [
      {
        transactionId: staleWithdrawalId,
        memberId: memberIds.adamId,
        memberFullName: 'Adam Seed Investor',
        memberEmail: 'adam.seed@example.com',
        amount: 250,
        status: TransactionStatus.Pending,
        requestedAt: hoursAgo(30),
        ageHours: 30,
      },
    ],
    totalCount: 1,
    thresholdHours: 24,
    checkedAt: new Date(),
  });
}

function printSeedSummary(data: {
  stockIds: Record<string, Types.ObjectId>;
  memberIds: {
    adamId: Types.ObjectId;
    saraId: Types.ObjectId;
    unverifiedId: Types.ObjectId;
    suspendedId: Types.ObjectId;
    negativeId: Types.ObjectId;
  };
  pendingWithdrawalId: Types.ObjectId;
  staleWithdrawalId: Types.ObjectId;
}): void {
  console.log('\n✅ Seed completed successfully\n');

  console.log('CMS users:');
  console.log('Admin   → admin.seed@stockmarket.com / Admin@12345');
  console.log('Analyst → analyst.seed@stockmarket.com / Analyst@12345');
  console.log('Support → support.seed@stockmarket.com / Support@12345');

  console.log('\nMembers:');
  console.log('Adam       → adam.seed@example.com / Adam@12345');
  console.log('Sara       → sara.seed@example.com / Sara@12345');
  console.log('Suspended  → suspended.seed@example.com / Suspended@12345');
  console.log('Negative   → negative.seed@example.com / Negative@12345');
  console.log('Unverified → unverified.seed@example.com / no password');

  console.log('\nMember IDs:');
  console.log(`Adam:       ${data.memberIds.adamId.toString()}`);
  console.log(`Sara:       ${data.memberIds.saraId.toString()}`);
  console.log(`Unverified: ${data.memberIds.unverifiedId.toString()}`);
  console.log(`Suspended:  ${data.memberIds.suspendedId.toString()}`);
  console.log(`Negative:   ${data.memberIds.negativeId.toString()}`);

  console.log('\nStock IDs:');
  for (const [ticker, id] of Object.entries(data.stockIds)) {
    console.log(`${ticker}: ${id.toString()}`);
  }

  console.log('\nWithdrawal IDs:');
  console.log(`Pending withdrawal: ${data.pendingWithdrawalId.toString()}`);
  console.log(`Stale withdrawal:   ${data.staleWithdrawalId.toString()}`);

  console.log('\nUseful Postman notes:');
  console.log('- Use Adam for member wallet/orders/alerts tests.');
  console.log('- Use Analyst for stock + analytics permission tests.');
  console.log('- Use Support for withdrawal/member-support tests.');
  console.log('- Use Admin for full CMS access.');
  console.log('- Use OLDX stock to test delisted stock buy rejection.');
  console.log(
    '- Use negative.seed@example.com for negative balance alert tests.',
  );
}

async function main(): Promise<void> {
  const uri = getMongoUri();

  await mongoose.connect(uri);

  const models: SeedModels = {
    adminModel: mongoose.model(Admin.name, AdminSchema),
    memberModel: mongoose.model(Member.name, MemberSchema),
    referralModel: mongoose.model(Referral.name, ReferralSchema),
    stockModel: mongoose.model(Stock.name, StockSchema),
    priceHistoryModel: mongoose.model(PriceHistory.name, PriceHistorySchema),
    transactionModel: mongoose.model(Transaction.name, TransactionSchema),
    orderModel: mongoose.model(Order.name, OrderSchema),
    positionModel: mongoose.model(Position.name, PositionSchema),
    priceAlertModel: mongoose.model(PriceAlert.name, PriceAlertSchema),
    negativeBalanceAlertModel: mongoose.model(
      NegativeBalanceAlert.name,
      NegativeBalanceAlertSchema,
    ),
    stalePendingWithdrawalAlertModel: mongoose.model(
      StalePendingWithdrawalAlert.name,
      StalePendingWithdrawalAlertSchema,
    ),
  };

  await cleanupSeedData(models);

  await createAdmins(models);

  const memberIds = await createMembers(models);

  const stockIds = await createStocks(models);

  const withdrawalIds = await createPositionsOrdersTransactions(
    models,
    {
      adamId: memberIds.adamId,
      saraId: memberIds.saraId,
      negativeId: memberIds.negativeId,
    },
    stockIds,
  );

  await createReferralsAndAlerts(models, memberIds, stockIds);

  await createSystemAlertSnapshots(
    models,
    {
      adamId: memberIds.adamId,
      negativeId: memberIds.negativeId,
    },
    withdrawalIds.staleWithdrawalId,
  );

  printSeedSummary({
    stockIds,
    memberIds,
    pendingWithdrawalId: withdrawalIds.pendingWithdrawalId,
    staleWithdrawalId: withdrawalIds.staleWithdrawalId,
  });

  await mongoose.disconnect();
}

main().catch(async (error: unknown) => {
  console.error('❌ Seed failed');
  console.error(error);

  await mongoose.disconnect();

  process.exit(1);
});
