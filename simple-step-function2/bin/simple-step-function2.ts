#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleStepFunction2Stack } from '../lib/simple-step-function2-stack';

const app = new cdk.App();
new SimpleStepFunction2Stack(app, 'SimpleStepFunction2Stack', {
  env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: "ap-northeast-1"},
});