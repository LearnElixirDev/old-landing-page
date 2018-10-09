const LAMBDA_VERSION = '2015-03-31'

export const callLambda = (Lambda, params) => {
  const lambda = new Lambda({
    apiVersion: LAMBDA_VERSION,
    Payload: params
  })

  return new Promise((resolve, reject) => {
    lambda.invoke(params, function(error, data) {
      if (error) {
        reject(error)
      } else {
        resolve(JSON.parse(data.Payload))
      }
    })
  })
}

