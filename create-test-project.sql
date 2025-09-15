-- Create test project for debugging Complete Book functionality
-- User ID: ec2f2655-9302-47e3-b447-1b7576bfaed7
-- Project ID: 5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd

INSERT INTO projects (
    id,
    title,
    description,
    user_id,
    project_type,
    author_style,
    book_theme,
    illustration_style,
    target_age,
    total_pages,
    book_metadata,
    created_at,
    updated_at
) VALUES (
    '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'::uuid,
    'Test Magical Forest Book',
    'A test children''s book for debugging the Complete Book functionality',
    'ec2f2655-9302-47e3-b447-1b7576bfaed7'::uuid,
    'childrens-book',
    'dr-seuss',
    'magical-forest',
    'watercolor',
    '3-5',
    6,
    '{
        "main_character": "Luna the Little Fox",
        "setting": "Enchanted Forest",
        "conflict": "Finding her way home",
        "moral_lesson": "Believing in yourself",
        "created_via": "book-creator",
        "ai_generated": true,
        "include_video": false,
        "include_audio": false
    }'::jsonb,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    user_id = EXCLUDED.user_id,
    project_type = EXCLUDED.project_type,
    author_style = EXCLUDED.author_style,
    book_theme = EXCLUDED.book_theme,
    illustration_style = EXCLUDED.illustration_style,
    target_age = EXCLUDED.target_age,
    total_pages = EXCLUDED.total_pages,
    book_metadata = EXCLUDED.book_metadata,
    updated_at = now();

-- Also create a corresponding books table entry for compatibility
INSERT INTO books (
    id,
    title,
    author,
    target_age,
    theme,
    style,
    author_style,
    total_pages,
    is_public,
    user_id,
    project_id,
    created_at,
    updated_at
) VALUES (
    '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'::uuid,
    'Test Magical Forest Book',
    'Test Author',
    '3-5',
    'magical-forest',
    'watercolor',
    'dr-seuss',
    6,
    false,
    'ec2f2655-9302-47e3-b447-1b7576bfaed7'::uuid,
    '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'::uuid,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    author = EXCLUDED.author,
    target_age = EXCLUDED.target_age,
    theme = EXCLUDED.theme,
    style = EXCLUDED.style,
    author_style = EXCLUDED.author_style,
    total_pages = EXCLUDED.total_pages,
    is_public = EXCLUDED.is_public,
    user_id = EXCLUDED.user_id,
    project_id = EXCLUDED.project_id,
    updated_at = now();

-- Verify both insertions
SELECT 
    'projects' as table_name,
    id,
    title,
    user_id,
    created_at
FROM projects 
WHERE id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd'

UNION ALL

SELECT 
    'books' as table_name,
    id,
    title,
    user_id,
    created_at
FROM books 
WHERE id = '5fbfc1cc-addc-4f10-8ee4-e5763bbd5ecd';