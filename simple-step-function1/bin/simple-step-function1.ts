#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleStepFunction1Stack } from '../lib/simple-step-function1-stack';

const app = new cdk.App();

new SimpleStepFunction1Stack(app, 'SimpleStepFunction1Stack', {
  env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: "ap-northeast-1"},
});