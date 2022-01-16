CREATE INDEX git_comment_sha_repo ON git_comment (sha, repo_id);
CREATE INDEX github_pull_comment_number_repo ON github_pull_comment (number, repo_id);
CREATE INDEX github_pull_review_number_repo ON github_pull_review (number, repo_id);