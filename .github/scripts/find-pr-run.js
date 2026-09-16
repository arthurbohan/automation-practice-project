module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo

  const { data: prs } = await github.rest.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: context.sha,
  })

  const merged = prs.find((pr) => pr.merged_at)
  if (!merged) {
    core.info(`No merged PR associated with ${context.sha} — likely a direct push to main. Skipping artifact reuse (publish-allure/notify-telegram will no-op).`)
    core.setOutput('run_id', '')
    core.setOutput('conclusion', '')
    core.setOutput('pr_number', '')
    core.setOutput('pr_title', '')
    return
  }

  const { data: runs } = await github.rest.actions.listWorkflowRuns({
    owner,
    repo,
    workflow_id: 'pr-checks.yml',
    event: 'pull_request',
    status: 'completed',
    per_page: 30,
  })

  const match = runs.workflow_runs.find((run) => run.head_sha === merged.head.sha)

  if (!match) {
    core.warning(`Found merged PR #${merged.number} but no completed pull_request run for it — skipping artifact reuse.`)
    core.setOutput('run_id', '')
    core.setOutput('conclusion', '')
    core.setOutput('pr_number', String(merged.number))
    core.setOutput('pr_title', merged.title || '')
    return
  }

  core.info(`PR #${merged.number} → CI run ${match.id} (${match.conclusion})`)
  core.setOutput('run_id', String(match.id))
  core.setOutput('conclusion', match.conclusion || 'unknown')
  core.setOutput('pr_number', String(merged.number))
  core.setOutput('pr_title', merged.title || '')
}
