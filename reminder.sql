SELECT 
    git_commit_satd.repo_id, 
    git_commit_satd.sha

FROM git_commit_satd

WHERE 
    label_id != 0 AND
    EXISTS (
        SELECT 1 FROM git_comment_satd
        WHERE
            git_commit_satd.sha = git_comment_satd.sha AND
            git_commit_satd.sha = git_comment_satd.sha AND
            git_comment_satd.label_id != 0 AND
            git_comment_satd.label_id != git_commit_satd.label_id
        LIMIT 1
    )

LIMIT 10;

SELECT 
    COUNT(*) as _count, 
    (
        SELECT COUNT(*) FROM git_comment_satd
        WHERE
            git_commit_satd.sha = git_comment_satd.sha AND
            git_commit_satd.sha = git_comment_satd.sha
    ) as number_count

FROM git_commit_satd

GROUP BY _count