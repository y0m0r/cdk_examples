import * as cdk from 'aws-cdk-lib';
import * as ecsp from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as path from "path"
import { Construct } from 'constructs';

export class FargateFastapiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs_patterns.ApplicationLoadBalancedFargateService.html
    new ecsp.ApplicationLoadBalancedFargateService(this, "MyFastAPI", {
      taskImageOptions: {
        // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs.ContainerImage.html
        image: ecs.ContainerImage.fromAsset(path.join(__dirname, '../src/'), {
        }
        ),
      },
      publicLoadBalancer: true
    })
  }
}
