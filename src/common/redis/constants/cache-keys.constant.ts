export const CacheKeys = {
  stocksList: (queryKey: string) => `cache:stocks:list:${queryKey}`,

  stockDetail: (stockId: string) => `cache:stocks:detail:${stockId}`,

  stockCurrentPrice: (stockId: string) =>
    `cache:stocks:current-price:${stockId}`,

  portfolio: (memberId: string) => `cache:portfolio:${memberId}`,

  allStockLists: () => 'cache:stocks:list:*',
} as const;
