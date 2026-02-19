import mongoose, { Schema, Document, Types } from 'mongoose';

export type IdeaCategory = 'App' | 'Website' | 'SaaS' | 'AI Tool' | 'Content/Productized Service' | 'Other';
export type IdeaStage = 'Idea' | 'Prototype' | 'MVP' | 'Launched';
export type IdeaStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'ARCHIVED';

export interface IIdea extends Document {
  founderId: Types.ObjectId;
  title: string;
  oneLineSummary: string;
  category: IdeaCategory;
  stage: IdeaStage;
  targetUser: string;
  problem: string;
  solution: string;
  differentiation: string;
  monetization: string;
  roadmap: string;
  deckSlides: string[];
  status: IdeaStatus;
  pitchTitle: string;
  pitchIdea: string;
  pitchTarget: string;
  pitchSolves: string;
  pitchHow: string;
  pitchImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema = new Schema<IIdea>(
  {
    founderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    oneLineSummary: { type: String, maxlength: 250, default: '' },
    category: {
      type: String,
      enum: ['App', 'Website', 'SaaS', 'AI Tool', 'Content/Productized Service', 'Other'],
      default: 'Other',
    },
    stage: { type: String, enum: ['Idea', 'Prototype', 'MVP', 'Launched'], default: 'Idea' },
    targetUser: { type: String, default: '' },
    problem: { type: String, default: '' },
    solution: { type: String, default: '' },
    differentiation: { type: String, default: '' },
    monetization: { type: String, default: '' },
    roadmap: { type: String, default: '' },
    deckSlides: [{ type: String }],
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'ARCHIVED'],
      default: 'DRAFT',
    },
    pitchTitle: { type: String, default: '' },
    pitchIdea: { type: String, default: '' },
    pitchTarget: { type: String, default: '' },
    pitchSolves: { type: String, default: '' },
    pitchHow: { type: String, default: '' },
    pitchImageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Idea = mongoose.model<IIdea>('Idea', IdeaSchema);
