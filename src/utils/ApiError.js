class ApiError extends Error {
 constructor(
statuscode,
message= 'someting went wrong',
errors = [],
stack = ''
 ){
  super(message)
  this.statuscode = statuscode
  this.data = null
 this.message = message
 this.success = false
 this.error = this.errors
if(stack){
 this.stack = stack
}else{
    Error.captureStackTrace(this, this.constructor)
}

}


}