const jobStore = new Map();

function createJob(jobId) {
  jobStore.set(jobId, {
    jobId,
    status: 'PROCESSING',
    processedLines: 0,
    errorLines: 0,
    totalLines: 0,
    errors: [],
    startTime: new Date().toISOString(),
  });
}

function updateJob(jobId, updates) {
  const job = jobStore.get(jobId);
  Object.assign(job, updates);
}

function getJob(jobId) {
  return jobStore.get(jobId);
}

module.exports = { createJob, updateJob, getJob };
