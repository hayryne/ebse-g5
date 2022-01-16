/* Stratified sampling query 
Partitions over linkedness in order to obtain amounts proportional to chosen
sampling strata; e.g. 100 samples with linkedness = 1
*/
SELECT id FROM (
  SELECT 
    *, 
    row_number() 
      OVER (
        PARTITION BY linked 
        ORDER BY random()
      ) as seqnum 

  FROM github_jira_link
)

WHERE satd_count > 2 AND
      /* Proportional to a sample of 5000 */
      (
        linked = 0 AND seqnum <= 2950 OR
        linked = 1 AND seqnum <= 1950 OR
        linked = 2 AND seqnum <= 100 OR
        linked = 3 AND seqnum <= 1
      )

LIMIT 10