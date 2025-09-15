-- Test the newly created batch_update_book_page_illustrations function
-- This will verify if the function works properly

-- First, check if the function exists
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name = 'batch_update_book_page_illustrations';

-- Test with a sample book ID (replace with actual ID from your database)
-- This is just a syntax test - it won't update anything if the book doesn't exist
SELECT * FROM batch_update_book_page_illustrations(
    '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'::UUID,
    '[
        {
            "page_number": 1,
            "illustration_url": "https://test.com/test1.png",
            "illustration_prompt": "Test prompt 1"
        }
    ]'::JSONB,
    'ec2f2655-9302-47e3-b447-1b7576bfaed7'::UUID
);