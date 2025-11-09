export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: ProposalCategory;
  status: ProposalStatus;
  creator: string;
  createdAt: Date;
  startTime: Date;
  endTime: Date;
  executionTime?: Date;
  executed: boolean;
  cancelled: boolean;
  votingPower: VotingPower;
  votes: Vote[];
  results: VotingResults;
  quorum: number;
  threshold: number;
  actions: ProposalAction[];
  discussion: Discussion[];
  metadata: ProposalMetadata;
}

export enum ProposalCategory {
  GAME_BALANCE = 'game_balance',
  ECONOMIC_POLICY = 'economic_policy',
  FEATURE_REQUEST = 'feature_request',
  TOURNAMENT_RULES = 'tournament_rules',
  REWARD_DISTRIBUTION = 'reward_distribution',
  GOVERNANCE_CHANGE = 'governance_change',
  EMERGENCY = 'emergency',
  COMMUNITY_EVENT = 'community_event',
  PARTNERSHIP = 'partnership',
  TREASURY_ALLOCATION = 'treasury_allocation',
}

export enum ProposalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  QUEUED = 'queued',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface VotingPower {
  totalSupply: string;
  totalVoted: string;
  participation: number;
  snapshot: {
    blockNumber: number;
    timestamp: Date;
    holders: VotingSnapshot[];
  };
}

export interface VotingSnapshot {
  address: string;
  balance: string;
  delegatedTo?: string;
  votingPower: string;
}

export interface Vote {
  id: string;
  voter: string;
  proposalId: string;
  choice: VoteChoice;
  votingPower: string;
  reason?: string;
  timestamp: Date;
  signature: string;
  delegated: boolean;
}

export enum VoteChoice {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain',
}

export interface VotingResults {
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  totalVotes: string;
  uniqueVoters: number;
  quorumReached: boolean;
  thresholdReached: boolean;
  topVoters: TopVoter[];
}

export interface TopVoter {
  address: string;
  votingPower: string;
  choice: VoteChoice;
  percentage: number;
}

export interface ProposalAction {
  target: string;
  value: string;
  signature: string;
  data: string;
  description: string;
}

export interface Discussion {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  likes: number;
  replies: Reply[];
  edited: boolean;
  editedAt?: Date;
}

export interface Reply {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  likes: number;
}

export interface ProposalMetadata {
  ipfsHash?: string;
  forumLink?: string;
  snapshotLink?: string;
  tags: string[];
  priority: Priority;
  estimatedImpact: string;
  implementationCost: string;
  timeline: string;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface Delegate {
  address: string;
  delegatedPower: string;
  delegators: string[];
  votingHistory: VoteHistory[];
  participation: number;
  statement: string;
  social: SocialLinks;
  score: number;
  rank: number;
}

export interface VoteHistory {
  proposalId: string;
  choice: VoteChoice;
  timestamp: Date;
}

export interface SocialLinks {
  twitter?: string;
  discord?: string;
  github?: string;
}

export interface GovernanceConfig {
  proposalThreshold: string;
  quorumPercentage: number;
  votingPeriod: number;
  votingDelay: number;
  executionDelay: number;
  gracePeriod: number;
  maxActiveProposals: number;
  delegationEnabled: boolean;
  quadraticVoting: boolean;
  weightedVoting: boolean;
}

export interface Treasury {
  address: string;
  balance: string;
  allocations: TreasuryAllocation[];
  pendingWithdrawals: PendingWithdrawal[];
  historicalSpending: HistoricalSpending[];
  monthlyBudget: string;
  remainingBudget: string;
}

export interface TreasuryAllocation {
  category: string;
  amount: string;
  percentage: number;
  description: string;
}

export interface PendingWithdrawal {
  id: string;
  proposalId: string;
  recipient: string;
  amount: string;
  reason: string;
  scheduledTime: Date;
  executed: boolean;
}

export interface HistoricalSpending {
  month: string;
  categories: { [key: string]: string };
  total: string;
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  successfulProposals: number;
  failedProposals: number;
  totalVoters: number;
  averageParticipation: number;
  treasuryBalance: string;
  topDelegates: Delegate[];
  recentActivity: Activity[];
}

export interface Activity {
  type: ActivityType;
  actor: string;
  target?: string;
  timestamp: Date;
  details: any;
}

export enum ActivityType {
  PROPOSAL_CREATED = 'proposal_created',
  VOTE_CAST = 'vote_cast',
  PROPOSAL_EXECUTED = 'proposal_executed',
  DELEGATION_CHANGED = 'delegation_changed',
}