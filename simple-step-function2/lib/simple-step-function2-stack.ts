import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as fs from 'fs';


export class SimpleStepFunction2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    /** ------------------ Lambda Handlers Definition ------------------ */
    const getStatusLambda = new lambda.Function(this, "CheckJob", {
      code: new lambda.InlineCode(fs.readFileSync('lambdas/check_status.py', { encoding: 'utf-8' })),
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.main',
      timeout: cdk.Duration.seconds(30)
    });

    const submitLambda = new lambda.Function(this, "SubmitJob", {
      code: new lambda.InlineCode(fs.readFileSync('lambdas/submit.py', { encoding: 'utf-8' })),
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.main',
      timeout: cdk.Duration.seconds(30)
    });

    /** ------------------ Step functions Definition ------------------ */
    const submitJob = new tasks.LambdaInvoke(this, "Submit Job", {
      lambdaFunction: submitLambda,
      outputPath: "$.Payload"
    })
    const waitX = new sfn.Wait(this, 'Wait X Seconds', {
      /**
       *  You can also implement with the path stored in the state like:
       *  sfn.WaitTime.secondsPath('$.waitSeconds')
       */
      time: sfn.WaitTime.duration(cdk.Duration.seconds(30)),
    });
    const getStatus = new tasks.LambdaInvoke(this, 'Get Job Status', {
      lambdaFunction: getStatusLambda,
      outputPath: '$.Payload',
    });
    const jobFailed = new sfn.Fail(this, 'Job Failed', {
      cause: 'AWS Batch Job Failed',
      error: 'DescribeJob returned FAILED',
    });
    const finalStatus = new tasks.LambdaInvoke(this, 'Get Final Job Status', {
      lambdaFunction: getStatusLambda,
      outputPath: '$.Payload',
    });

    // Create chain
    const definition = submitJob
      .next(waitX)
      .next(getStatus)
      .next(new sfn.Choice(this, 'Job Complete?')
        // Look at the "status" field
        .when(sfn.Condition.stringEquals('$.status', 'FAILED'), jobFailed)
        .when(sfn.Condition.stringEquals('$.status', 'SUCCEEDED'), finalStatus)
        .otherwise(waitX));

    // Create state machine
    const stateMachine = new sfn.StateMachine(this, 'CronStateMachine', {
      definition,
      timeout: cdk.Duration.minutes(5),
    });
    // Grant lambda execution roles
    submitLambda.grantInvoke(stateMachine.role);
    getStatusLambda.grantInvoke(stateMachine.role);

    const rule = new events.Rule(this, 'Rule', {
      schedule: events.Schedule.expression('cron(0 18 ? * MON-FRI *)')
    });
    rule.addTarget(new targets.SfnStateMachine(stateMachine));
  }
}
