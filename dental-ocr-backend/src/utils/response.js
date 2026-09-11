function success(res, data, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

function created(res, data) {
  success(res, data, 201);
}

function error(res, message, statusCode = 400) {
  res.status(statusCode).json({ success: false, message });
}

function notFound(res, message = 'Resource not found') {
  error(res, message, 404);
}

module.exports = { success, created, error, notFound };
