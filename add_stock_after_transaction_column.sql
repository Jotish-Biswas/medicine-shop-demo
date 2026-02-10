-- Add stock_after_transaction column to transactions table
-- This column stores the stock value at the time of the transaction
-- so that statistics always show the correct historical stock values

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS stock_after_transaction INTEGER;

-- Add a comment to explain the purpose of this column
COMMENT ON COLUMN transactions.stock_after_transaction IS 'Stock quantity after this transaction was completed';
