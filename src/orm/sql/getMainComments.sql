WITH RECURSIVE
selected_root_comments AS (
  SELECT
    c.uuid,
    c.text,
    c.created_at AS comment_created_at,
    c.parent_comment,
    c.user_uuid,
    c.file_uuid,
    c.home_page, -- тут змінив з u.home_page на c.home_page
    u.user_name,
    u.email,
    u.picture,
    f.url AS file_url,
    ROW_NUMBER() OVER (ORDER BY __SORT_FIELD__ __SORT_ORDER__) AS sort_order
  FROM comment c
  LEFT JOIN "user" u ON c.user_uuid = u.uuid
  LEFT JOIN file f ON c.file_uuid = f.uuid
  WHERE c.parent_comment IS NULL
  LIMIT $1 OFFSET $2
),
comment_tree AS (
  SELECT
    uuid,
    text,
    comment_created_at,
    parent_comment,
    user_uuid,
    file_uuid,
    home_page, -- тут додай home_page
    user_name,
    email,
    picture,
    file_url,
    sort_order,
    0 AS level
  FROM selected_root_comments

  UNION ALL

  SELECT
    child.uuid,
    child.text,
    child.created_at AS comment_created_at,
    child.parent_comment,
    child.user_uuid,
    child.file_uuid,
    child.home_page, -- тут також додай
    u.user_name,
    u.email,
    u.picture,
    f.url AS file_url,
    parent.sort_order,
    parent.level + 1
  FROM comment child
  LEFT JOIN "user" u ON child.user_uuid = u.uuid
  LEFT JOIN file f ON child.file_uuid = f.uuid
  INNER JOIN comment_tree parent ON child.parent_comment = parent.uuid
)
SELECT *
FROM comment_tree
ORDER BY sort_order, level, comment_created_at;
