const aws = require('./aws');
const gh = require('./gh');
const config = require('./config');
const core = require('@actions/core');

function setOutput(label, ec2InstanceId) {
  core.setOutput('label', label);
  core.setOutput('ec2-instance-id', ec2InstanceId);
}

async function start() {
  const label = config.generateUniqueLabel();
  const githubRegistrationToken = await gh.getRegistrationToken();
  const ec2InstanceId = await aws.startEc2Instance(label, githubRegistrationToken);
  setOutput(label, ec2InstanceId);
  await aws.waitForInstanceRunning(ec2InstanceId);
  await gh.waitForRunnerRegistered(label);
}

async function start_spot() {
  const label = config.generateUniqueLabel();
  const githubRegistrationToken = await gh.getRegistrationToken();
  const ec2InstanceId = await aws.startEc2SpotInstance(label, githubRegistrationToken);
  setOutput(label, ec2InstanceId);
  await aws.waitForInstanceRunning(ec2InstanceId);
  await gh.waitForRunnerRegistered(label);
}

async function stop() {
  await aws.terminateEc2Instance();
  await gh.removeRunner();
}

(async function () {
  try {
    if (config.input.mode === 'start') {
      await start();
    } else if (config.input.mode === 'start_spot') {
      await start_spot();
    } else {
      await stop();
    }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
})();
