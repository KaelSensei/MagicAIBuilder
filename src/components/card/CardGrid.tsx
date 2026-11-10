"use client";
// Grid display for search results
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CardImage } from "./CardImage";
import { DraggableCard } from "./DraggableCard";
import { cn } from "@/components/ui/utils";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { DFC_LAYOUTS } from "@/lib/scryfall/types";
import { getCardImageUri, getListedImageUri } from "@/lib/scryfall/images";
import { isMdfcWithLandBack } from "@/lib/deck/categories";
import type { CardFace, DeckZone } from "@/lib/deck/types";
import { CollectionBadge } from "@/components/collection/CollectionBadge";
import { QuickAddCollectionButton } from "@/components/collection/QuickAddCollectionButton";
import { SearchZoneMenu } from "@/components/card/SearchZoneMenu";

interface CardGridProps {
  readonly cards: readonly ScryfallCard[];
  readonly onCardClick?: (card: ScryfallCard) => void;
  readonly className?: string;
  readonly emptyMessage?: string;
  readonly draggable?: boolean;
  readonly onAddToMaybeboard?: (card: ScryfallCard) => void;
  readonly onAddToZone?: (card: ScryfallCard, zone: DeckZone) => void;
  readonly maybeboardNames?: Set<string>;
}

function buildDfcFaces(card: ScryfallCard): [CardFace, CardFace] | undefined {
  if (!DFC_LAYOUTS.has(card.layout ?? "")) return undefined;
  const faces = card.card_faces;
  if (!faces || faces.length < 2) return undefined;
  const [f0, f1] = faces;
  return [
    {
      name: f0.name,
      manaCost: f0.mana_cost ?? "",
      typeLine: f0.type_line ?? "",
      oracleText: f0.oracle_text ?? "",
      imageUri:
        getListedImageUri(f0.image_uris, "grid") ??
        getCardImageUri(card, "grid", "front"),
      artCropUri:
        getListedImageUri(f0.image_uris, "art") ??
        getCardImageUri(card, "art", "front"),
    },
    {
      name: f1.name,
      manaCost: f1.mana_cost ?? "",
      typeLine: f1.type_line ?? "",
      oracleText: f1.oracle_text ?? "",
      imageUri:
        getListedImageUri(f1.image_uris, "grid") ??
        getCardImageUri(card, "grid", "back"),
      artCropUri:
        getListedImageUri(f1.image_uris, "art") ??
        getCardImageUri(card, "art", "back"),
    },
  ];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function CardGrid({
  cards,
  onCardClick,
  className,
  emptyMessage,
  draggable = false,
  onAddToMaybeboard: _onAddToMaybeboard,
  onAddToZone,
  maybeboardNames: _maybeboardNames,
}: CardGridProps) {
  const t = useTranslations("card");

  if (cards.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-40 text-[var(--text-secondary)]", className)}>
        {emptyMessage ?? t("noCardsFound")}
      </div>
    );
  }

  return (
    <motion.div
      className={cn("grid grid-cols-3 gap-2 p-2", className)}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => {
        const dfcFaces = buildDfcFaces(card);
        return (
          <motion.div key={card.id} variants={itemVariants} className="relative group/gridcard">
            {draggable ? (
              <DraggableCard card={card}>
                <CardImage
                  imageUri={getCardImageUri(card, "grid")}
                  largeUri={getCardImageUri(card, "display")}
                  name={card.name}
                  manaCost={card.mana_cost}
                  cmc={card.cmc}
                  showOverlay={!dfcFaces}
                  onClick={() => onCardClick?.(card)}
                  cardFaces={dfcFaces}
                  isFlexibleLand={isMdfcWithLandBack(card)}
                />
              </DraggableCard>
            ) : (
              <CardImage
                imageUri={getCardImageUri(card, "grid")}
                largeUri={getCardImageUri(card, "display")}
                name={card.name}
                manaCost={card.mana_cost}
                cmc={card.cmc}
                showOverlay={!dfcFaces}
                onClick={() => onCardClick?.(card)}
                cardFaces={dfcFaces}
                isFlexibleLand={isMdfcWithLandBack(card)}
              />
            )}
            <CollectionBadge
              scryfallId={card.id}
              compact
              className="absolute bottom-6 left-1 z-10"
            />
            <QuickAddCollectionButton
              card={card}
              className="absolute bottom-6 right-1 z-10 opacity-0 group-hover/gridcard:opacity-100 transition-opacity"
            />
            {onAddToZone && (
              <div className="absolute inset-x-1 bottom-1 z-20">
                <SearchZoneMenu card={card} onAddToZone={onAddToZone} />
              </div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
