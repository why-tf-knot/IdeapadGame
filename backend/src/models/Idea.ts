import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export type IdeaCategory = 'App' | 'Website' | 'SaaS' | 'AI Tool' | 'Content/Productized Service' | 'Other';
export type IdeaStage = 'Idea' | 'Prototype' | 'MVP' | 'Launched';
export type IdeaStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'ARCHIVED';

export interface IIdea extends Document {
  _id: ObjectId;
  founderId: ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema = new Schema<IIdea>(
  {
    founderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    oneLineSummary: { type: String, required: true, maxlength: 140 },
    category: { 
      type: String, 
      enum: ['App', 'Website', 'SaaS', 'AI Tool', 'Content/Productized Service', 'Other'], 
      required: true 
    },
    stage: { 
      type: String, 
      enum: ['Idea', 'Prototype', 'MVP', 'Launched'], 
      required: true 
    },
    targetUser: { type: String, required: true },
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    differentiation: { type: String, required: true },
    monetization: { type: String, required: true },
    roadmap: { type: String, required: true },
    deckSlides: [{ type: String }],
    status: { 
      type: String, 
      enum: ['PENDING_REVIEW', 'ACTIVE', 'ARCHIVED'], 
      default: 'PENDING_REVIEW' 
    },
  },
  { timestamps: true }
);

export const Idea = mongoose.model<IIdea>('Idea', IdeaSchema);
