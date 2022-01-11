ALTER TABLE git_comment_satd
  ADD sha VARCHAR
  
ALTER TABLE git_comment_satd
  ADD repo_id INTEGER;

UPDATE git_comment_satd
SET
  sha = (SELECT sha from git_comment WHERE id = git_comment_satd.id),
  repo_id = (SELECT repo_id from git_comment WHERE id = git_comment_satd.id);

CREATE INDEX git_comment_satd_sha_repo ON git_comment_satd (sha, repo_id);