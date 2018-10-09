import {callLambda} from './call-lambda'

const COGNITO_POOL_ID = 'us-west-2:da458850-963b-4d46-aec1-ce8cd45047bc'
const DEFAULT_SEND_EMAIL = 'landing-page@lure.is'
const LAMBDA_REGION = 'us-west-2'
const DEFAULT_PARAMS = {
  FunctionName: 'lure-email-send',
  InvocationType: 'RequestResponse'
}

const createCredentialsAndSendEmail = ({config, Lambda, CognitoIdentityCredentials}, name, email, phoneNumber, message) => {
  config.credentials = new CognitoIdentityCredentials({IdentityPoolId: COGNITO_POOL_ID})
  config.region = LAMBDA_REGION

  let emailMessage = phoneNumber ? 'Phone Number: ' + phoneNumber + '\n' : ''

  emailMessage += message

  const params = {
    senderName: name,
    senderEmail: email || DEFAULT_SEND_EMAIL,
    message: emailMessage
  }

  return callLambda(Lambda, {
    ...DEFAULT_PARAMS,
    Payload: JSON.stringify(params)
  })
} 

export const sendEmail = (name, email, phoneNumber, message) => import('aws-sdk')
  .then((AWS) => createCredentialsAndSendEmail(AWS, name, email, phoneNumber, message))
