WITH RECURSIVE comment_tree AS (
  SELECT
    c.*,
    u.user_name,
    u.email,
    u.picture,
    f.url AS file_url,
    0 AS level
  FROM comment c
  LEFT JOIN "user" u ON c.user_uuid = u.uuid
  LEFT JOIN file f ON c.file_uuid = f.uuid
  WHERE c.uuid = $1

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
