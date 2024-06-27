import error from "../../assests/error";

class apiError extends Error {
	constructor(responseCode, responseMessage) {
		super(responseMessage);
		this.responseCode = responseCode;
		this.responseMessage = responseMessage ? responseMessage : error[responseCode] || 'internal server error';
		this.isApiError = true;
		console.log("apiError======", this.responseMessage,this.responseCode);
	}

	static unauthorized(msg) {
		return new apiError(401, msg);
	}
	static badRequest(msg) {
		return new apiError(400, msg);
	}
	static internal(msg) {
		return new apiError(500, msg);
	}
	static notFound(msg) {
		return new apiError(404, msg);
	}
	static noResult(msg) {
		return new apiError(200, msg);
	}
	static conflict(msg) {
		return new apiError(409, msg);
	}
	static forbidden(msg) {
		return new apiError(403, msg)
	}
	static invalid(msg) {
		return new apiError(402, msg)
	}
	static alreadyExist(msg) {
		return new apiError(409, msg)
	}
}

module.exports = apiError;