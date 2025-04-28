'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface NFTListing {
  id: string;
  tokenId: string;
  chain: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  seller: string;
  imageUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'weapon' | 'armor' | 'cosmetic' | 'character';
  attributes?: Record<string, any>;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<NFTListing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'newest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterAndSortListings();
  }, [listings, selectedCategory, selectedRarity, sortBy, searchQuery]);

  const fetchListings = async () => {
    try {
      // Mock data
      const mockListings: NFTListing[] = [
        {
          id: '1',
          tokenId: '0x123',
          chain: 'immutable-x',
          name: 'Dragon Sword',
          description: 'Legendary sword forged in dragon fire',
          price: 2.5,
          currency: 'ETH',
          seller: '0xabc...',
          imageUrl: '/nfts/dragon-sword.png',
          rarity: 'legendary',
          category: 'weapon',
          attributes: { attack: 150, durability: 100 },
        },
        {
          id: '2',
          tokenId: '0x456',
          chain: 'ronin',
          name: 'Shadow Armor',
          description: 'Armor that bends light and shadow',
          price: 1.8,
          currency: 'RON',
          seller: '0xdef...',
          imageUrl: '/nfts/shadow-armor.png',
          rarity: 'epic',
          category: 'armor',
          attributes: { defense: 120, stealth: 80 },
        },
        {
          id: '3',
          tokenId: '0x789',
          chain: 'solana',
          name: 'Golden Crown',
          description: 'Crown of the ancient kings',
          price: 5.0,
          currency: 'SOL',
          seller: '0xghi...',
          imageUrl: '/nfts/golden-crown.png',
          rarity: 'legendary',
          category: 'cosmetic',
        },
        {
          id: '4',
          tokenId: '0xabc',
          chain: 'flow',
          name: 'Ice Mage',
          description: 'Rare character with ice powers',
          price: 3.2,
          currency: 'FLOW',
          seller: '0xjkl...',
          imageUrl: '/nfts/ice-mage.png',
          rarity: 'rare',
          category: 'character',
        },
        {
          id: '5',
          tokenId: '0xdef',
          chain: 'immutable-x',
          name: 'Fire Staff',
          description: 'Staff imbued with fire magic',
          price: 0.8,
          currency: 'ETH',
          seller: '0xmno...',
          imageUrl: '/nfts/fire-staff.png',
          rarity: 'rare',
          category: 'weapon',
          attributes: { magic: 100, attack: 60 },
        },
        {
          id: '6',
          tokenId: '0xghi',
          chain: 'ronin',
          name: 'Leather Boots',
          description: 'Comfortable and durable boots',
          price: 0.3,
          currency: 'RON',
          seller: '0xpqr...',
          imageUrl: '/nfts/leather-boots.png',
          rarity: 'common',
          category: 'armor',
          attributes: { defense: 30, speed: 10 },
        },
      ];

      setListings(mockListings);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      setLoading(false);
    }
  };

  const filterAndSortListings = () => {
    let filtered = [...listings];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter((item) => item.rarity === selectedRarity);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Already in newest order
        break;
    }

    setFilteredListings(filtered);
  };

  const buyNFT = async (listingId: string) => {
    // TODO: Implement NFT purchase
    console.log('Buy NFT:', listingId);
  };

  const getRarityColor = (rarity: NFTListing['rarity']) => {
    switch (rarity) {
      case 'common':
        return '#9e9e9e';
      case 'rare':
        return '#4facfe';
      case 'epic':
        return '#a855f7';
      case 'legendary':
        return '#ffd700';
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading Marketplace...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>NFT Marketplace</h1>
        <p>Buy and sell game items across multiple blockchains</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.search}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Categories</option>
            <option value="weapon">Weapons</option>
            <option value="armor">Armor</option>
            <option value="cosmetic">Cosmetics</option>
            <option value="character">Characters</option>
          </select>

          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className={styles.select}
          >
            <option value="all">All Rarities</option>
            <option value="common">Common</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.select}
          >
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <span>Showing {filteredListings.length} items</span>
      </div>

      <div className={styles.grid}>
        {filteredListings.map((listing) => (
          <div key={listing.id} className={styles.card}>
            <div className={styles.imageContainer}>
              <div className={styles.imagePlaceholder}>🎨</div>
              <div
                className={styles.rarityBadge}
                style={{ background: getRarityColor(listing.rarity) }}
              >
                {listing.rarity}
              </div>
            </div>

            <div className={styles.cardContent}>
              <h3 className={styles.itemName}>{listing.name}</h3>
              <p className={styles.description}>{listing.description}</p>

              {listing.attributes && (
                <div className={styles.attributes}>
                  {Object.entries(listing.attributes).map(([key, value]) => (
                    <div key={key} className={styles.attribute}>
                      <span className={styles.attributeKey}>{key}:</span>
                      <span className={styles.attributeValue}>{value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.metadata}>
                <span className={styles.chain}>{listing.chain}</span>
                <span className={styles.seller}>
                  Seller: {listing.seller.substring(0, 8)}...
                </span>
              </div>

              <div className={styles.footer}>
                <div className={styles.price}>
                  <span className={styles.priceValue}>{listing.price}</span>
                  <span className={styles.currency}>{listing.currency}</span>
                </div>
                <button className={styles.buyBtn} onClick={() => buyNFT(listing.id)}>
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <div className={styles.empty}>No items found matching your criteria</div>
      )}
    </div>
  );
}
