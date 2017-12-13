# URL Rewrite
Uses Lambda@Edge to process the web request of a user and provide a 301 response
redirecting the user to a new location.  This functionality is helpful for public
web hosting, specifically for advertising campaigns that need to be tracked and
redirect users to a sign-up page.

## Technical Overview
This solution is a Lambda@Edge function that checks the URI the user is requesting
on the CloudFront distribution, checks an internal JSON object for a redirect, and
then responds to the requestor with a 301 response to the new document.

This solution requires:
1) An empty S3 web hosting bucket
2) An S3 web hosting bucket to host web assets for a landing zone
3) A Lambda@Edge function, written in Node.js 6.10
4) A CloudFront distribution in front of the empty bucket
5) An optional S3 bucket for CloudFront logging

## Version Information
This version has been written to only use Edge technologies.  Data is included in
a JSON document variable to reduce the need for any regional network calls.

## Setup

1. Create the S3 Buckets
This solution requires 2 S3 buckets, as described above.  If you have Python and
the Python SDK installed, you can simply run the command:
`python setupbuckets.py <webbucket> <emptybucket>`

This script will create both buckets, turn on encryption, turn on web hosting, and also
copy some sample public files to the webbucket.

You can also create these buckets manually.  If you do, make sure that they have
web hosting turned on.  Also, make sure to mark the files in your webbucket as
public so they can be served to the requestor.

As an optional step, you can also create a bucket to store your CloudFront logs
in.  This bucket will be used to provide logging for the initial requests, which is
important for the use case value proposition.

2. Create an IAM role for Lambda@Edge
Create a new role with trust relationships for:
  a. lambda.amazonaws.com
  b. edgelambda.amazonaws.com

Attach the policy listed below:
  a. AWSLambdaExecute

3. Create the Lambda@Edge function
Create a new Lambda function from scratch, using Node.js 6.10 as the runtime,
and use the role you created in step 2 for execution.  Paste in the code from
rewriteurledge.js.

  a. Data for your web site host is provided in the config section of the JSON
  document variable.  The values are:
    i. host - the host address of the website you want to redirect users to
    ii. error_page - the error page to use on your host
    iii. campaign_over_page - page to show when a campaign is expired or not active.

  b. Data for the redirects is provided in the rules section of the JSON document
  variable.  The values are:
    i. object name - the URI to redirect from
    ii. rewrite - the URI to redirect to on your host
    iii. startdate - the starting date of the campaign (when it should start redirecting)
    iv. enddate - the ending date of the campaign (when it should stop redirecting)

Please see step 5 for information about the use cases.

You can also create testing events for the Lambda function, which are included in
the repository as .json files.  Test the function to make sure that it works.

You must publish this function before the final step.  Click on Actions -> Publish
New Version and validate the Lambda function was published.  You should see an ARN
at the top of the page that looks like: `arn:aws:lambda:us-east-1:1234567890:function:URLrewrite2:22`
Copy the ARN plus the version number (:22, in this case), as you will need it for
the CloudFront distribution.  CloudFront cannot use $latest as a version at this time.

4. Create the CloudFront Distribution
Create a new Web CloudFront Distribution.  The origin name is your empty bucket
from step 1.  Values that you should change are:
  a. Restrict Bucket Access - Yes
  b. Lambda Function Association -> Event Type - Viewer Request
  c. Lambda Function Association -> Lambda Function ARN - your full ARN from step 3

You can enable logging, if you choose, by using the following settings:
  a. Logging - On
  b. Bucket for Logs - your logging bucket from step 1
  c. Log Prefix - choose a prefix to use for this distribution

Once you set these values, click on Create Distribution.  Once your distribution is
complete, you will have a URL rewriter, using HTTP 301, functioning at the edge.

5. Test Cases / Test Data
The test cases that are included in the JSON document variable are date dependent
and all testing will result in an error or campaign over response as of 1/12/2018.

You can test the distribution with the following tests, no matter what the current
date is:
  a. <cloudfronthost>/test1 - will either redirect to /testpage1.html or /campaignover.html
     depending on the date.
  b. <cloudfronthost>/test4 - will redirect to /error.html

If you change the dates in the Lambda function after you have published it, you
will need to republish the function *and* update the CloudFront Distribution to
point to the new version of the Lambda function.
