export function trackJob(jobs, id, run) {
  const pending = jobs.get(id);
  if (pending) return pending;
  const job = Promise.resolve().then(run).finally(() => jobs.delete(id));
  jobs.set(id, job);
  return job;
}
