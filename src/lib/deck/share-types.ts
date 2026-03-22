// Shared types for the deck sharing feature — used by both the server page
// (app/share/[token]/page.tsx) and the client component (ShareDeckView.tsx).

export interface ApiCard {
  readonly id: string;
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly colorIdentity: readonly string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
}

export interface ApiSharedDeck {
  readonly id: string;
  readonly name: string;
  readonly format: string;
  readonly targetBracket: number;
  readonly budget: number | null;
  readonly commanderId: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: string;
  readonly shareEnabled: boolean;
  readonly cards: readonly ApiCard[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
