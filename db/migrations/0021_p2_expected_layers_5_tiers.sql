-- Migration: 0021_p2_expected_layers_5_tiers
-- Description: Upgrade Expected Layers to 5-tier classification by adding strongly_recommended and caution tiers.

-- 1. Alter expected_layers table
ALTER TABLE expected_layers ADD COLUMN IF NOT EXISTS strongly_recommended text[] DEFAULT '{}';
ALTER TABLE expected_layers ADD COLUMN IF NOT EXISTS caution text[] DEFAULT '{}';

-- 2. Alter predicted_questions table
ALTER TABLE predicted_questions ADD COLUMN IF NOT EXISTS auto_strongly_recommended text[] DEFAULT '{}';
ALTER TABLE predicted_questions ADD COLUMN IF NOT EXISTS auto_caution text[] DEFAULT '{}';
