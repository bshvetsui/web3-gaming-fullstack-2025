import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trophy, Users, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface GameCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  players: number;
  maxPlayers: number;
  mode: string;
  map: string;
  entryFee?: number;
  prizePool?: number;
  startTime: Date;
  status: 'upcoming' | 'live' | 'ended';
  onJoin?: (id: string) => void;
  onSpectate?: (id: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  id,
  title,
  description,
  image,
  players,
  maxPlayers,
  mode,
  map,
  entryFee,
  prizePool,
  startTime,
  status,
  onJoin,
  onSpectate,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'live':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'ended':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'live':
        return 'LIVE';
      case 'upcoming':
        return `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`;
      case 'ended':
        return 'Ended';
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-white text-xs font-bold ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center text-gray-300">
            <Users className="w-4 h-4 mr-1" />
            <span>{players}/{maxPlayers}</span>
          </div>
          <div className="flex items-center text-gray-300">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{map}</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Badge variant="secondary">{mode}</Badge>
          {prizePool && (
            <div className="flex items-center text-yellow-400">
              <Trophy className="w-4 h-4 mr-1" />
              <span className="font-semibold">{prizePool} TOKENS</span>
            </div>
          )}
        </div>

        {entryFee !== undefined && (
          <div className="text-center text-sm text-gray-400">
            Entry Fee: <span className="text-white font-semibold">{entryFee} TOKENS</span>
          </div>
        )}

        <div className="flex gap-2">
          {status === 'upcoming' && onJoin && (
            <Button
              onClick={() => onJoin(id)}
              className="flex-1"
              variant="primary"
            >
              Join Game
            </Button>
          )}
          {status === 'live' && onSpectate && (
            <Button
              onClick={() => onSpectate(id)}
              className="flex-1"
              variant="outline"
            >
              Spectate
            </Button>
          )}
          {status === 'ended' && (
            <Button
              className="flex-1"
              variant="outline"
              disabled
            >
              View Results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};