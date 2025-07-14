WITH RECURSIVE
selected_root_comments AS (
  SELECT
    c.*,
    u.user_name,
    u.email,
    u.picture,
    f.url AS file_url
  FROM comment c
  LEFT JOIN "user" u ON c.user_uuid = u.uuid
  LEFT JOIN file f ON c.file_uuid = f.uuid
  WHERE c.parent_comment IS NULL
  ORDER BY __SORT_FIELD__ __SORT_ORDER__
  LIMIT $1 OFFSET $2
),
comment_tree AS (
  SELECT *, 0 AS level FROM selected_root_comments
  UNION ALL
  SELECT
    child.*,
    u.user_name,
    u.email,
    u.picture,
    f.url AS file_url,
    parent.level + 1
  FROM comment child
  LEFT JOIN "user" u ON child.user_uuid = u.uuid
  LEFT JOIN file f ON child.file_uuid = f.uuid
  INNER JOIN comment_tree parent ON child.parent_comment = parent.uuid
)
SELECT * FROM comment_tree
ORDER BY level, created_at;
