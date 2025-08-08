# Podcast Length Customization Feature

## Overview
Added the ability for users to customize podcast length from 1 to 15 minutes using a slider interface.

## Changes Made

### 1. Type Updates
- **`src/types/index.ts`**: Added `duration` field to `PodcastInput` interface
- **Database types**: Updated Supabase types to include duration field

### 2. User Interface
- **`src/components/TopicInput.tsx`**: Added duration slider component with:
  - Range slider (1-15 minutes)
  - Visual feedback showing current selection
  - Descriptive labels for quick vs detailed content
  - Dynamic validation and descriptions

### 3. Backend Logic
- **`src/lib/script-generation.ts`**: Updated script generation to:
  - Accept target duration parameter
  - Adjust content depth based on length (brief/standard/detailed formats)
  - Calculate appropriate word counts (150 words per minute baseline)
  - Provide duration-specific prompts to AI

### 4. Database Schema
- **`supabase/schema.sql`**: Added duration column with constraints (1-15 minutes)
- **Migration script**: Created migration for existing episodes
- **API validation**: Added duration validation in generate-script endpoint

### 5. State Management
- **`src/lib/store.ts`**: Updated default input to include duration (8 minutes default)
- **`src/components/Library.tsx`**: Display both target and estimated duration

## User Experience

### Duration Options
- **1-3 minutes**: Brief format focusing on core concepts only
- **4-8 minutes**: Standard format with examples and practical applications  
- **9-15 minutes**: Detailed format with comprehensive coverage and case studies

### Visual Design
- Clean slider interface with clear min/max labels
- Real-time feedback showing selected duration
- Contextual descriptions explaining content depth
- Consistent with existing design system

## Technical Details

### Word Count Calculation
- Base rate: 150 words per minute (standard podcast speaking rate)
- Buffer range: ±20% to account for natural speaking variation
- Content scaling based on target duration

### AI Prompt Adaptation
- Duration-specific content guidelines
- Adjusted number of concepts based on time available
- Variable depth instructions for different lengths

### Database Constraints
- Duration field required, default 8 minutes
- Range validation: 1-15 minutes
- Backwards compatibility maintained

## Future Enhancements
- Analytics on preferred durations
- Content complexity indicators
- Advanced time estimation based on content type
- User-specific duration preferences
