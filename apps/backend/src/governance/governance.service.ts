import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ethers } from 'ethers';

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
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: string;
  implementationCost: string;
  timeline: string;
}

export interface Delegate {
  address: string;
  delegatedPower: string;
  delegators: string[];
  votingHistory: VoteHistory[];
  participation: number;
  statement: string;
  social: {
    twitter?: string;
    discord?: string;
    github?: string;
  };
  score: number;
  rank: number;
}

export interface VoteHistory {
  proposalId: string;
  choice: VoteChoice;
  timestamp: Date;
}

export interface GovernanceConfig {
  proposalThreshold: string; // Min tokens to create proposal
  quorumPercentage: number; // Min participation
  votingPeriod: number; // Duration in seconds
  votingDelay: number; // Delay before voting starts
  executionDelay: number; // Delay before execution
  gracePeriod: number; // Time to execute after success
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
  type: 'proposal_created' | 'vote_cast' | 'proposal_executed' | 'delegation_changed';
  actor: string;
  target?: string;
  timestamp: Date;
  details: any;
}

@Injectable()
export class GovernanceService {
  private proposals: Map<string, Proposal> = new Map();
  private votes: Map<string, Vote[]> = new Map();
  private delegates: Map<string, Delegate> = new Map();
  private delegations: Map<string, string> = new Map(); // delegator -> delegate
  private treasury: Treasury;
  private activities: Activity[] = [];
  private config: GovernanceConfig = {
    proposalThreshold: '10000',
    quorumPercentage: 10,
    votingPeriod: 7 * 24 * 60 * 60, // 7 days
    votingDelay: 24 * 60 * 60, // 1 day
    executionDelay: 48 * 60 * 60, // 2 days
    gracePeriod: 7 * 24 * 60 * 60, // 7 days
    maxActiveProposals: 10,
    delegationEnabled: true,
    quadraticVoting: false,
    weightedVoting: true,
  };

  constructor(private eventEmitter: EventEmitter2) {
    this.initializeTreasury();
    this.initializeSampleProposals();
  }

  private initializeTreasury() {
    this.treasury = {
      address: '0x0000000000000000000000000000000000000000',
      balance: '1000000',
      allocations: [
        { category: 'Development', amount: '300000', percentage: 30, description: 'Game development and updates' },
        { category: 'Marketing', amount: '200000', percentage: 20, description: 'Marketing and partnerships' },
        { category: 'Tournaments', amount: '250000', percentage: 25, description: 'Tournament prizes and events' },
        { category: 'Community', amount: '150000', percentage: 15, description: 'Community rewards and incentives' },
        { category: 'Operations', amount: '100000', percentage: 10, description: 'Operational expenses' },
      ],
      pendingWithdrawals: [],
      historicalSpending: [],
      monthlyBudget: '100000',
      remainingBudget: '85000',
    };
  }

  private initializeSampleProposals() {
    const sampleProposal: Proposal = {
      id: 'proposal-1',
      title: 'Increase Tournament Prize Pool',
      description: 'Proposal to increase the monthly tournament prize pool from 10,000 to 15,000 tokens',
      category: ProposalCategory.TOURNAMENT_RULES,
      status: ProposalStatus.ACTIVE,
      creator: '0x1234567890123456789012345678901234567890',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      executed: false,
      cancelled: false,
      votingPower: {
        totalSupply: '10000000',
        totalVoted: '1500000',
        participation: 15,
        snapshot: {
          blockNumber: 1000000,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          holders: [],
        },
      },
      votes: [],
      results: {
        forVotes: '900000',
        againstVotes: '500000',
        abstainVotes: '100000',
        totalVotes: '1500000',
        uniqueVoters: 150,
        quorumReached: true,
        thresholdReached: true,
        topVoters: [],
      },
      quorum: 10,
      threshold: 50,
      actions: [],
      discussion: [],
      metadata: {
        tags: ['tournament', 'prizes', 'community'],
        priority: 'medium',
        estimatedImpact: 'Increased player participation in tournaments',
        implementationCost: '5000',
        timeline: '1 week',
      },
    };

    this.proposals.set(sampleProposal.id, sampleProposal);
  }

  async createProposal(data: {
    creator: string;
    title: string;
    description: string;
    category: ProposalCategory;
    actions?: ProposalAction[];
    metadata?: Partial<ProposalMetadata>;
  }): Promise<Proposal> {
    // Check creator's voting power
    const creatorPower = await this.getVotingPower(data.creator);
    const threshold = ethers.parseEther(this.config.proposalThreshold);

    if (ethers.parseEther(creatorPower) < threshold) {
      throw new BadRequestException(
        `Insufficient voting power. Required: ${this.config.proposalThreshold}`
      );
    }

    // Check active proposals limit
    const activeProposals = Array.from(this.proposals.values()).filter(
      p => p.status === ProposalStatus.ACTIVE || p.status === ProposalStatus.PENDING
    );

    if (activeProposals.length >= this.config.maxActiveProposals) {
      throw new BadRequestException('Maximum active proposals reached');
    }

    const proposalId = `proposal-${Date.now()}`;
    const now = new Date();

    const proposal: Proposal = {
      id: proposalId,
      title: data.title,
      description: data.description,
      category: data.category,
      status: ProposalStatus.PENDING,
      creator: data.creator,
      createdAt: now,
      startTime: new Date(now.getTime() + this.config.votingDelay * 1000),
      endTime: new Date(now.getTime() + (this.config.votingDelay + this.config.votingPeriod) * 1000),
      executed: false,
      cancelled: false,
      votingPower: {
        totalSupply: '10000000', // Should fetch from token contract
        totalVoted: '0',
        participation: 0,
        snapshot: {
          blockNumber: 1000001, // Should get current block
          timestamp: now,
          holders: await this.takeSnapshot(),
        },
      },
      votes: [],
      results: {
        forVotes: '0',
        againstVotes: '0',
        abstainVotes: '0',
        totalVotes: '0',
        uniqueVoters: 0,
        quorumReached: false,
        thresholdReached: false,
        topVoters: [],
      },
      quorum: this.config.quorumPercentage,
      threshold: 50, // 50% approval needed
      actions: data.actions || [],
      discussion: [],
      metadata: {
        tags: [],
        priority: 'medium',
        estimatedImpact: '',
        implementationCost: '',
        timeline: '',
        ...data.metadata,
      },
    };

    this.proposals.set(proposalId, proposal);
    this.votes.set(proposalId, []);

    // Record activity
    this.recordActivity({
      type: 'proposal_created',
      actor: data.creator,
      timestamp: now,
      details: { proposalId, title: data.title },
    });

    this.eventEmitter.emit('governance.proposal.created', {
      proposalId,
      creator: data.creator,
      title: data.title,
    });

    // Schedule status updates
    setTimeout(() => this.activateProposal(proposalId), this.config.votingDelay * 1000);
    setTimeout(() => this.endVoting(proposalId), (this.config.votingDelay + this.config.votingPeriod) * 1000);

    return proposal;
  }

  async vote(data: {
    proposalId: string;
    voter: string;
    choice: VoteChoice;
    reason?: string;
  }): Promise<Vote> {
    const proposal = this.proposals.get(data.proposalId);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== ProposalStatus.ACTIVE) {
      throw new BadRequestException('Voting is not active for this proposal');
    }

    // Check if already voted
    const proposalVotes = this.votes.get(data.proposalId) || [];
    const existingVote = proposalVotes.find(v => v.voter === data.voter);

    if (existingVote) {
      throw new BadRequestException('Already voted on this proposal');
    }

    // Get voting power (considering delegation)
    const votingPower = await this.getEffectiveVotingPower(data.voter);

    if (votingPower === '0') {
      throw new BadRequestException('No voting power');
    }

    const vote: Vote = {
      id: `vote-${Date.now()}`,
      voter: data.voter,
      proposalId: data.proposalId,
      choice: data.choice,
      votingPower,
      reason: data.reason,
      timestamp: new Date(),
      signature: this.generateSignature(data),
      delegated: this.delegations.has(data.voter),
    };

    proposalVotes.push(vote);
    this.votes.set(data.proposalId, proposalVotes);

    // Update proposal results
    this.updateProposalResults(proposal, vote);

    // Update delegate history if applicable
    this.updateDelegateHistory(data.voter, data.proposalId, data.choice);

    // Record activity
    this.recordActivity({
      type: 'vote_cast',
      actor: data.voter,
      target: data.proposalId,
      timestamp: new Date(),
      details: { choice: data.choice, votingPower },
    });

    this.eventEmitter.emit('governance.vote.cast', {
      proposalId: data.proposalId,
      voter: data.voter,
      choice: data.choice,
      votingPower,
    });

    return vote;
  }

  async delegate(delegator: string, delegate: string): Promise<void> {
    if (delegator === delegate) {
      throw new BadRequestException('Cannot delegate to yourself');
    }

    const previousDelegate = this.delegations.get(delegator);

    // Update delegation
    if (delegate === '0x0000000000000000000000000000000000000000') {
      // Undelegate
      this.delegations.delete(delegator);
    } else {
      this.delegations.set(delegator, delegate);
    }

    // Update delegate records
    if (previousDelegate) {
      const prevDelegateRecord = this.delegates.get(previousDelegate);
      if (prevDelegateRecord) {
        prevDelegateRecord.delegators = prevDelegateRecord.delegators.filter(d => d !== delegator);
        prevDelegateRecord.delegatedPower = await this.calculateDelegatedPower(previousDelegate);
      }
    }

    if (delegate !== '0x0000000000000000000000000000000000000000') {
      let delegateRecord = this.delegates.get(delegate);

      if (!delegateRecord) {
        delegateRecord = {
          address: delegate,
          delegatedPower: '0',
          delegators: [],
          votingHistory: [],
          participation: 0,
          statement: '',
          social: {},
          score: 0,
          rank: 0,
        };
        this.delegates.set(delegate, delegateRecord);
      }

      if (!delegateRecord.delegators.includes(delegator)) {
        delegateRecord.delegators.push(delegator);
      }

      delegateRecord.delegatedPower = await this.calculateDelegatedPower(delegate);
    }

    // Record activity
    this.recordActivity({
      type: 'delegation_changed',
      actor: delegator,
      target: delegate,
      timestamp: new Date(),
      details: { previousDelegate },
    });

    this.eventEmitter.emit('governance.delegation.changed', {
      delegator,
      delegate,
      previousDelegate,
    });
  }

  private async activateProposal(proposalId: string) {
    const proposal = this.proposals.get(proposalId);

    if (proposal && proposal.status === ProposalStatus.PENDING) {
      proposal.status = ProposalStatus.ACTIVE;
      this.proposals.set(proposalId, proposal);

      this.eventEmitter.emit('governance.proposal.active', { proposalId });
    }
  }

  private async endVoting(proposalId: string) {
    const proposal = this.proposals.get(proposalId);

    if (!proposal || proposal.status !== ProposalStatus.ACTIVE) {
      return;
    }

    // Calculate final results
    const totalSupply = ethers.parseEther(proposal.votingPower.totalSupply);
    const totalVoted = ethers.parseEther(proposal.results.totalVotes);
    const forVotes = ethers.parseEther(proposal.results.forVotes);

    const participation = (totalVoted * BigInt(100)) / totalSupply;
    const approval = totalVoted > 0 ? (forVotes * BigInt(100)) / totalVoted : BigInt(0);

    proposal.results.quorumReached = participation >= BigInt(proposal.quorum);
    proposal.results.thresholdReached = approval >= BigInt(proposal.threshold);

    if (proposal.results.quorumReached && proposal.results.thresholdReached) {
      proposal.status = ProposalStatus.SUCCEEDED;
      proposal.executionTime = new Date(Date.now() + this.config.executionDelay * 1000);

      // Schedule execution
      setTimeout(() => this.executeProposal(proposalId), this.config.executionDelay * 1000);
    } else {
      proposal.status = ProposalStatus.FAILED;
    }

    this.proposals.set(proposalId, proposal);

    this.eventEmitter.emit('governance.voting.ended', {
      proposalId,
      status: proposal.status,
      results: proposal.results,
    });
  }

  async executeProposal(proposalId: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== ProposalStatus.SUCCEEDED) {
      throw new BadRequestException('Proposal did not succeed');
    }

    if (proposal.executed) {
      throw new BadRequestException('Proposal already executed');
    }

    if (proposal.executionTime && new Date() < proposal.executionTime) {
      throw new BadRequestException('Execution delay not met');
    }

    // Execute actions
    for (const action of proposal.actions) {
      await this.executeAction(action);
    }

    proposal.executed = true;
    proposal.status = ProposalStatus.EXECUTED;
    this.proposals.set(proposalId, proposal);

    // Record activity
    this.recordActivity({
      type: 'proposal_executed',
      actor: 'system',
      target: proposalId,
      timestamp: new Date(),
      details: { actions: proposal.actions },
    });

    this.eventEmitter.emit('governance.proposal.executed', {
      proposalId,
      actions: proposal.actions,
    });
  }

  async cancelProposal(proposalId: string, canceller: string): Promise<void> {
    const proposal = this.proposals.get(proposalId);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.creator !== canceller) {
      throw new BadRequestException('Only proposal creator can cancel');
    }

    if (proposal.status === ProposalStatus.EXECUTED) {
      throw new BadRequestException('Cannot cancel executed proposal');
    }

    proposal.cancelled = true;
    proposal.status = ProposalStatus.CANCELLED;
    this.proposals.set(proposalId, proposal);

    this.eventEmitter.emit('governance.proposal.cancelled', { proposalId, canceller });
  }

  async addDiscussion(
    proposalId: string,
    author: string,
    message: string
  ): Promise<Discussion> {
    const proposal = this.proposals.get(proposalId);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    const discussion: Discussion = {
      id: `discussion-${Date.now()}`,
      author,
      message,
      timestamp: new Date(),
      likes: 0,
      replies: [],
      edited: false,
    };

    proposal.discussion.push(discussion);
    this.proposals.set(proposalId, proposal);

    this.eventEmitter.emit('governance.discussion.added', {
      proposalId,
      discussionId: discussion.id,
      author,
    });

    return discussion;
  }

  async getProposal(proposalId: string): Promise<Proposal> {
    const proposal = this.proposals.get(proposalId);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    return proposal;
  }

  async getProposals(filter?: {
    status?: ProposalStatus;
    category?: ProposalCategory;
    creator?: string;
  }): Promise<Proposal[]> {
    let proposals = Array.from(this.proposals.values());

    if (filter) {
      if (filter.status) {
        proposals = proposals.filter(p => p.status === filter.status);
      }

      if (filter.category) {
        proposals = proposals.filter(p => p.category === filter.category);
      }

      if (filter.creator) {
        proposals = proposals.filter(p => p.creator === filter.creator);
      }
    }

    return proposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getVotes(proposalId: string): Promise<Vote[]> {
    return this.votes.get(proposalId) || [];
  }

  async getDelegates(limit: number = 100): Promise<Delegate[]> {
    const delegates = Array.from(this.delegates.values());

    // Calculate scores and ranks
    delegates.forEach(delegate => {
      delegate.score = this.calculateDelegateScore(delegate);
    });

    delegates.sort((a, b) => b.score - a.score);

    delegates.forEach((delegate, index) => {
      delegate.rank = index + 1;
    });

    return delegates.slice(0, limit);
  }

  async getGovernanceStats(): Promise<GovernanceStats> {
    const proposals = Array.from(this.proposals.values());
    const allVotes = Array.from(this.votes.values()).flat();
    const uniqueVoters = new Set(allVotes.map(v => v.voter)).size;

    const stats: GovernanceStats = {
      totalProposals: proposals.length,
      activeProposals: proposals.filter(p => p.status === ProposalStatus.ACTIVE).length,
      successfulProposals: proposals.filter(p => p.status === ProposalStatus.EXECUTED).length,
      failedProposals: proposals.filter(p => p.status === ProposalStatus.FAILED).length,
      totalVoters: uniqueVoters,
      averageParticipation: this.calculateAverageParticipation(proposals),
      treasuryBalance: this.treasury.balance,
      topDelegates: await this.getDelegates(10),
      recentActivity: this.activities.slice(-20).reverse(),
    };

    return stats;
  }

  async getTreasury(): Promise<Treasury> {
    return this.treasury;
  }

  async proposeTreasuryAllocation(
    proposalId: string,
    allocations: TreasuryAllocation[]
  ): Promise<void> {
    const proposal = this.proposals.get(proposalId);

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.category !== ProposalCategory.TREASURY_ALLOCATION) {
      throw new BadRequestException('Proposal must be treasury allocation type');
    }

    // Validate allocations
    const totalPercentage = allocations.reduce((sum, a) => sum + a.percentage, 0);
    if (totalPercentage !== 100) {
      throw new BadRequestException('Allocations must sum to 100%');
    }

    // Add to proposal actions
    allocations.forEach(allocation => {
      proposal.actions.push({
        target: this.treasury.address,
        value: allocation.amount,
        signature: 'allocate(string,uint256)',
        data: this.encodeAllocationData(allocation),
        description: `Allocate ${allocation.amount} to ${allocation.category}`,
      });
    });

    this.proposals.set(proposalId, proposal);
  }

  private async takeSnapshot(): Promise<VotingSnapshot[]> {
    // In production, would fetch from blockchain
    return [
      {
        address: '0x1111111111111111111111111111111111111111',
        balance: '100000',
        votingPower: '100000',
      },
      {
        address: '0x2222222222222222222222222222222222222222',
        balance: '50000',
        delegatedTo: '0x1111111111111111111111111111111111111111',
        votingPower: '0',
      },
    ];
  }

  private async getVotingPower(address: string): Promise<string> {
    // In production, would fetch from token contract
    return '100000';
  }

  private async getEffectiveVotingPower(address: string): Promise<string> {
    // Check if delegated
    const delegate = this.delegations.get(address);

    if (delegate) {
      return '0'; // Delegated voting power
    }

    // Get own power + delegated power
    const ownPower = await this.getVotingPower(address);
    const delegatedPower = await this.calculateDelegatedPower(address);

    return (BigInt(ownPower) + BigInt(delegatedPower)).toString();
  }

  private async calculateDelegatedPower(delegate: string): Promise<string> {
    let total = BigInt(0);

    this.delegations.forEach(async (del, delegator) => {
      if (del === delegate) {
        const power = await this.getVotingPower(delegator);
        total += BigInt(power);
      }
    });

    return total.toString();
  }

  private updateProposalResults(proposal: Proposal, vote: Vote) {
    const votePower = BigInt(vote.votingPower);

    switch (vote.choice) {
      case VoteChoice.FOR:
        proposal.results.forVotes = (BigInt(proposal.results.forVotes) + votePower).toString();
        break;
      case VoteChoice.AGAINST:
        proposal.results.againstVotes = (BigInt(proposal.results.againstVotes) + votePower).toString();
        break;
      case VoteChoice.ABSTAIN:
        proposal.results.abstainVotes = (BigInt(proposal.results.abstainVotes) + votePower).toString();
        break;
    }

    proposal.results.totalVotes = (BigInt(proposal.results.totalVotes) + votePower).toString();
    proposal.results.uniqueVoters++;

    const totalSupply = BigInt(proposal.votingPower.totalSupply);
    proposal.votingPower.totalVoted = proposal.results.totalVotes;
    proposal.votingPower.participation = Number((BigInt(proposal.results.totalVotes) * BigInt(100)) / totalSupply);

    // Update top voters
    const topVoters = [...proposal.results.topVoters, {
      address: vote.voter,
      votingPower: vote.votingPower,
      choice: vote.choice,
      percentage: Number((votePower * BigInt(100)) / BigInt(proposal.results.totalVotes)),
    }];

    proposal.results.topVoters = topVoters
      .sort((a, b) => Number(BigInt(b.votingPower) - BigInt(a.votingPower)))
      .slice(0, 10);
  }

  private updateDelegateHistory(voter: string, proposalId: string, choice: VoteChoice) {
    const delegate = this.delegates.get(voter);

    if (delegate) {
      delegate.votingHistory.push({
        proposalId,
        choice,
        timestamp: new Date(),
      });

      // Update participation
      const totalProposals = this.proposals.size;
      delegate.participation = (delegate.votingHistory.length / totalProposals) * 100;
    }
  }

  private calculateDelegateScore(delegate: Delegate): number {
    let score = 0;

    // Participation weight
    score += delegate.participation * 10;

    // Delegated power weight
    score += Number(BigInt(delegate.delegatedPower) / BigInt(1000));

    // Number of delegators weight
    score += delegate.delegators.length * 5;

    // Voting consistency (not flipping votes often)
    const consistency = this.calculateVotingConsistency(delegate.votingHistory);
    score += consistency * 20;

    return Math.round(score);
  }

  private calculateVotingConsistency(history: VoteHistory[]): number {
    if (history.length < 2) return 1;

    let flips = 0;
    for (let i = 1; i < history.length; i++) {
      if (history[i].choice !== history[i - 1].choice) {
        flips++;
      }
    }

    return 1 - (flips / history.length);
  }

  private calculateAverageParticipation(proposals: Proposal[]): number {
    if (proposals.length === 0) return 0;

    const totalParticipation = proposals.reduce((sum, p) => sum + p.votingPower.participation, 0);
    return totalParticipation / proposals.length;
  }

  private async executeAction(action: ProposalAction) {
    // In production, would execute on-chain
    this.eventEmitter.emit('governance.action.executed', { action });
  }

  private encodeAllocationData(allocation: TreasuryAllocation): string {
    // In production, would encode for smart contract
    return `0x${Buffer.from(JSON.stringify(allocation)).toString('hex')}`;
  }

  private generateSignature(data: any): string {
    // In production, would be actual signature
    return `0x${Buffer.from(JSON.stringify(data)).toString('hex').slice(0, 130)}`;
  }

  private recordActivity(activity: Activity) {
    this.activities.push(activity);

    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(-1000);
    }
  }
}