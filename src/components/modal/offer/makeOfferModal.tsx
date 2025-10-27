'use client';

import { useState } from 'react';
import { useSeaportClient } from '@/hooks/useSeaportClient';
import { Cross } from 'ethereum-identity-kit';
import { MarketplaceDomainType } from '@/types/domains';

interface MakeOfferModalProps {
  onClose: () => void;
  domain: MarketplaceDomainType | null;
}

const MakeOfferModal: React.FC<MakeOfferModalProps> = ({
  onClose,
  domain,
}) => {
  const { createOffer, isLoading, error } = useSeaportClient();
  const [offerPriceInEth, setOfferPriceInEth] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [success, setSuccess] = useState(false);

  if (!domain) return null;

  const { token_id: tokenId, name: ensName, owner: currentOwner } = domain;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!currentOwner) {
      console.error('Domain is not registered');
      return;
    }

    try {
      await createOffer({
        tokenId: tokenId.toString(),
        offerPriceInEth,
        durationDays: parseInt(durationDays),
        currentOwner,
        ensNameId: domain.id,
      });

      setSuccess(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  };

  console.log(domain)

  return (
    <div className="fixed" style={{ top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, overflowY: 'auto', paddingTop: '50px' }}>
      <div className="bg-background border border-border rounded-lg p-6 max-w-md" style={{ margin: '0 auto', maxWidth: '28rem' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Make Offer on {ensName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <Cross className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-500 text-lg font-semibold mb-2">
              Offer Created Successfully!
            </div>
            <p className="text-muted-foreground">
              Your offer has been submitted and signed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Offer Price (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={offerPriceInEth}
                onChange={(e) => setOfferPriceInEth(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="text-xs text-gray-400">
              By making an offer, you&apos;re committing to purchase this NFT if the seller accepts.
              The offer will be signed with your wallet and stored on-chain.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !offerPriceInEth}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Make Offer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default MakeOfferModal;