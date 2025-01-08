class Apiresponse {
constructor(
    statuscode, message="success" , data
){
 this.data = data
 this.message = message
 this.success = statuscode < 400
 this.statuscode = statuscode
}

}

export {Apiresponse}