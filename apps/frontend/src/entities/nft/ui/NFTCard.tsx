'use client';

import { NFTAsset } from '@/shared/types/wallet';
import { Button } from '@/shared/ui/Button';
import styles from './NFTCard.module.css';

interface NFTCardProps {
  nft: NFTAsset;
  onAction?: (nft: NFTAsset) => void;
  actionLabel?: string;
  showOwner?: boolean;
}

/**
 * NFT display card component
 */
export function NFTCard({
  nft,
  onAction,
  actionLabel = 'View',
  showOwner = false,
}: NFTCardProps) {
  // Get rarity color
  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700';
      case 'epic':
        return '#9B59B6';
      case 'rare':
        return '#3498DB';
      case 'common':
      default:
        return '#95A5A6';
    }
  };

  const rarityColor = nft.attributes?.rarity
    ? getRarityColor(nft.attributes.rarity)
    : '#95A5A6';

  return (
    <div className={styles.card} style={{ borderColor: rarityColor }}>
      <div className={styles.imageContainer}>
        <img
          src={nft.imageUrl || '/placeholder-nft.png'}
          alt={nft.name}
          className={styles.image}
        />
        {nft.attributes?.rarity && (
          <div
            className={styles.rarityBadge}
            style={{ backgroundColor: rarityColor }}
          >
            {nft.attributes.rarity.toUpperCase()}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{nft.name}</h3>
        <p className={styles.description}>{nft.description}</p>

        {showOwner && (
          <div className={styles.owner}>
            <span className={styles.ownerLabel}>Owner:</span>
            <span className={styles.ownerAddress}>
              {nft.owner.slice(0, 6)}...{nft.owner.slice(-4)}
            </span>
          </div>
        )}

        <div className={styles.attributes}>
          {nft.attributes &&
            Object.entries(nft.attributes)
              .filter(([key]) => key !== 'rarity')
              .map(([key, value]) => (
                <div key={key} className={styles.attribute}>
                  <span className={styles.attributeKey}>{key}:</span>
                  <span className={styles.attributeValue}>{String(value)}</span>
                </div>
              ))}
        </div>

        {onAction && (
          <Button onClick={() => onAction(nft)} fullWidth>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
